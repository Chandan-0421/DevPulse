const express = require('express')
const router = express.Router()
const { computeMetrics } = require('../services/metricsService')
const { getUser } = require('../services/githubService')

// Middleware: extract token from Authorization header
const authMiddleware = require('../middleware/auth')
router.use(authMiddleware)

router.get('/debug', async (req, res) => {
  try {
    const user = await getUser(req.token)
    const metrics = await computeMetrics(req.token, user.login)
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
    const user = await getUser(req.token)
    const metrics = await computeMetrics(req.token, user.login)
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