require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const WebSocket = require('ws')
const redis = require('./config/redis')
const authRoutes = require('./routes/auth')
const metricsRoutes = require('./routes/metrics')

const app = express()
const server = http.createServer(app)

// WebSocket server attached to the same HTTP server
const wss = new WebSocket.Server({ server })

app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.FRONTEND_URL?.replace(/\/$/, '')
    const requestOrigin = origin?.replace(/\/$/, '')
    if (!origin || requestOrigin === allowed) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/metrics', metricsRoutes)
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected')

  // Client sends their token as first message
  ws.on('message', async (msg) => {
    try {
      const { token } = JSON.parse(msg)
      ws.githubToken = token
      ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket live' }))
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }))
    }
  })

  ws.on('close', () => console.log('WebSocket client disconnected'))
})

// Redis pub/sub: listen for cache invalidation events
// When metrics cache expires, broadcast refresh to all connected clients
const subscriber = redis.duplicate()
subscriber.subscribe('metrics:invalidated')

subscriber.on('message', (channel, username) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'refresh', username }))
    }
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))