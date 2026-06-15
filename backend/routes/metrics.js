const express = require('express')
const router = express.Router()
const { computeMetrics } = require('../services/metricsService')
const { getUser } = require('../services/githubService')
const redis = require('../config/redis')

// Middleware: extract token from Authorization header
const authMiddleware = require('../middleware/auth')
router.use(authMiddleware)

router.get('/debug', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true'
    const user = await getUser(req.token, refresh)

    if (refresh) {
      const cooldownKey = `cooldown:${user.login}`
      const onCooldown = await redis.get(cooldownKey)
      if (onCooldown) {
        return res.status(429).json({ error: "Please wait 30 seconds between syncs." })
      }
      await redis.setex(cooldownKey, 30, '1')
    }

    const metrics = await computeMetrics(req.token, user.login, refresh)
    res.json({
      streak: metrics.streak,
      weeklyChurnKeys: Object.keys(metrics.weeklyChurn || {}).length,
      weeklyChurnSample: Object.entries(metrics.weeklyChurn || {}).slice(0, 3),
      heatmapKeys: Object.keys(metrics.heatmap || {}).length,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true'
    const user = await getUser(req.token, refresh)

    if (refresh) {
      const cooldownKey = `cooldown:${user.login}`
      const onCooldown = await redis.get(cooldownKey)
      if (onCooldown) {
        return res.status(429).json({ error: "Please wait 30 seconds between syncs." })
      }
      await redis.setex(cooldownKey, 30, '1')
    }

    const metrics = await computeMetrics(req.token, user.login, refresh)
    res.json({ 
      user: { 
        login: user.login, 
        name: user.name || user.login,  // fallback to login if name not set
        avatar: user.avatar_url 
      }, 
      metrics 
    })
  } catch (err) {
    console.error('Metrics error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router