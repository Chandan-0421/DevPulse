const axios = require('axios')
const redis = require('../config/redis')

const CACHE_TTL = 300        // 5 minutes in seconds
const RATE_LIMIT_KEY = 'gh:ratelimit'
const RATE_LIMIT_MAX = 4800  // stay safely under GitHub's 5000/hr

async function getRemainingCalls(token) {
  const key = `${RATE_LIMIT_KEY}:${token.slice(-8)}`
  const used = await redis.get(key)
  return RATE_LIMIT_MAX - (parseInt(used) || 0)
}

async function incrementCallCount(token) {
  const key = `${RATE_LIMIT_KEY}:${token.slice(-8)}`
  const multi = redis.multi()
  multi.incr(key)
  multi.expire(key, 3600)  // reset every hour
  await multi.exec()
}

async function cachedRequest(cacheKey, token, url, params = {}) {
  // Check cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Check rate limit before making API call
  const remaining = await getRemainingCalls(token)
  if (remaining <= 0) throw new Error('GitHub API rate limit reached. Try again in an hour.')

  // Make the actual API call
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    params,
  })

  await incrementCallCount(token)

  // Cache the result
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response.data))

  return response.data
}

// Get authenticated user profile
async function getUser(token) {
  return cachedRequest(`user:${token.slice(-8)}`, token, 'https://api.github.com/user')
}

// Get all repos for authenticated user
async function getRepos(token) {
  return cachedRequest(
    `repos:${token.slice(-8)}`,
    token,
    'https://api.github.com/user/repos',
    { per_page: 100, sort: 'pushed' }
  )
}

// Get commits for a specific repo in last 90 days
async function getCommits(token, owner, repo) {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  return cachedRequest(
    `commits:${owner}:${repo}:${token.slice(-8)}`,
    token,
    `https://api.github.com/repos/${owner}/${repo}/commits`,
    { since, per_page: 100 }
  )
}

// Get pull requests for a repo
async function getPullRequests(token, owner, repo) {
  return cachedRequest(
    `prs:${owner}:${repo}:${token.slice(-8)}`,
    token,
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    { state: 'closed', per_page: 50, sort: 'updated' }
  )
}

// Get code frequency (lines added/deleted per week) for a repo
async function getCodeFrequency(token, owner, repo) {
  const cacheKey = `churn:${owner}:${repo}:${token.slice(-8)}`

  // Check cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // GitHub returns 202 while it computes stats — retry up to 3 times
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/stats/code_frequency`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      if (response.status === 202) {
        // GitHub is computing — wait 2s and retry
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }

      if (Array.isArray(response.data) && response.data.length > 0) {
        await redis.setex(cacheKey, 300, JSON.stringify(response.data))
        return response.data
      }

      return []
    } catch (e) {
      if (e.response?.status === 202) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      return []
    }
  }

  return [] // gave up after 3 retries
}
module.exports = { getUser, getRepos, getCommits, getPullRequests, getCodeFrequency }