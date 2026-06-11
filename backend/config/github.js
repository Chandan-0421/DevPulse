module.exports = {
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  redirectUri: process.env.CALLBACK_URL || 'http://localhost:5000/auth/callback',
  scope: 'read:user repo',
}