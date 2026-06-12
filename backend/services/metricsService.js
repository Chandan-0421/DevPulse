const redis = require('../config/redis')
const { getRepos, getCommits, getPullRequests, getCodeFrequency } = require('./githubService')

const METRICS_TTL = 900

async function computeMetrics(token, username) {
  const cacheKey = `metrics:${username}`

  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const repos = await getRepos(token)
  const topRepos = repos.slice(0, 10)

  let allCommits = []
  let totalPRMergeTimes = []
  const commitsPerRepo = {}
  const weeklyChurn = {}

  for (const repo of topRepos) {
    try {
      const commits = await getCommits(token, repo.owner.login, repo.name)
      allCommits = allCommits.concat(commits)
      commitsPerRepo[repo.name] = commits.length

      const prs = await getPullRequests(token, repo.owner.login, repo.name)
      for (const pr of prs) {
        if (pr.merged_at) {
          const open = new Date(pr.created_at)
          const merged = new Date(pr.merged_at)
          const hoursToMerge = (merged - open) / (1000 * 60 * 60)
          totalPRMergeTimes.push(hoursToMerge)
        }
      }

      // Code churn
      try {
        const freq = await getCodeFrequency(token, repo.owner.login, repo.name)
        if (Array.isArray(freq)) {
          for (const [timestamp, added, deleted] of freq) {
            const weekKey = new Date(timestamp * 1000).toISOString().slice(0, 10)
            if (!weeklyChurn[weekKey]) weeklyChurn[weekKey] = { added: 0, deleted: 0 }
            weeklyChurn[weekKey].added += added
            weeklyChurn[weekKey].deleted += Math.abs(deleted)
          }
        }
      } catch (e) {
        // skip repos with no stats
      }

    } catch (e) {
      // skip repos that error
    }
  }

  // Commit heatmap
  const heatmap = {}
  for (const commit of allCommits) {
    const date = commit.commit?.author?.date?.slice(0, 10)
    if (date) heatmap[date] = (heatmap[date] || 0) + 1
  }

  // Streak
  let streak = 0
  for (let i = 0; i < 90; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)

    const utcKey = d.toISOString().slice(0, 10)
    const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000))
    const istKey = istDate.toISOString().slice(0, 10)

    const hasCommit = heatmap[utcKey] || heatmap[istKey]

    if (i === 0 && !hasCommit) {
      continue
    }
    if (i === 1 && streak === 0 && !hasCommit) {
      break
    }
    if (hasCommit) {
      streak++
    } else {
      break
    }
  }

  // Active repos
  const activeRepos = Object.values(commitsPerRepo).filter(count => count > 0).length

  const avgMergeTime =
    totalPRMergeTimes.length > 0
      ? Math.round(totalPRMergeTimes.reduce((a, b) => a + b, 0) / totalPRMergeTimes.length)
      : null

  const peakDay = Object.entries(heatmap)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0]

  const metrics = {
    totalCommits: allCommits.length,
    streak,
    avgPRMergeTimeHours: avgMergeTime,
    activeRepos,
    commitsPerRepo,
    weeklyChurn,
    heatmap,
    peakDay: peakDay ? { date: peakDay[0], count: peakDay[1] } : null,
    topRepo: Object.entries(commitsPerRepo).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    generatedAt: new Date().toISOString(),
  }

  await redis.setex(cacheKey, METRICS_TTL, JSON.stringify(metrics))

  return metrics
}

module.exports = { computeMetrics }