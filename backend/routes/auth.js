const express = require('express')
const router = express.Router()
const axios = require('axios')
const config = require('../config/github')

router.get('/login', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${config.scope}`
  res.redirect(url)
})

router.get('/callback', async (req, res) => {
  const { code } = req.query

  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
      },
      { headers: { Accept: 'application/json' } }
    )

    const accessToken = tokenRes.data.access_token

    // Send token to frontend via URL param (we'll store it in localStorage)
    res.redirect(`${process.env.FRONTEND_URL}?token=${accessToken}`)
  } catch (err) {
    console.error('OAuth error:', err.message)
    res.status(500).send('Authentication failed')
  }
})

module.exports = router