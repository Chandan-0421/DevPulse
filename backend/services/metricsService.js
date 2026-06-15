const redis = require('../config/redis')
const { getRepos, getCommits, getPullRequests, getCodeFrequency } = require('./githubService')

const METRICS_TTL = 900

async function computeMetrics(token, username, bypassCache = false) {
  const cacheKey = `metrics:${username}`

  if (!bypassCache) {
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)
  }

  const repos = await getRepos(token, bypassCache)
  const topRepos = repos.slice(0, 10)

  let allCommits = []
  let totalPRMergeTimes = []
  const commitsPerRepo = {}
  const weeklyChurn = {}

  // Fetch all repo data in parallel
  const repoResults = await Promise.all(
    topRepos.map(async (repo) => {
      const result = { commits: [], prs: [], churn: [] }

      try {
        result.commits = await getCommits(token, repo.owner.login, repo.name)
      } catch (e) {}

      try {
        const prs = await getPullRequests(token, repo.owner.login, repo.name)
        result.prs = prs.filter(pr => pr.merged_at)
      } catch (e) {}

      try {
        const freq = await getCodeFrequency(token, repo.owner.login, repo.name, bypassCache)
        if (Array.isArray(freq)) result.churn = freq
      } catch (e) {}

      return { name: repo.name, ...result }
    })
  )

  // Process results
  for (const r of repoResults) {
    allCommits = allCommits.concat(r.commits)
    commitsPerRepo[r.name] = r.commits.length

    for (const pr of r.prs) {
      const open = new Date(pr.created_at)
      const merged = new Date(pr.merged_at)
      totalPRMergeTimes.push((merged - open) / (1000 * 60 * 60))
    }

    for (const [timestamp, added, deleted] of r.churn) {
      const weekKey = new Date(timestamp * 1000).toISOString().slice(0, 10)
      if (!weeklyChurn[weekKey]) weeklyChurn[weekKey] = { added: 0, deleted: 0 }
      weeklyChurn[weekKey].added += added
      weeklyChurn[weekKey].deleted += Math.abs(deleted)
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