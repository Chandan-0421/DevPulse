module.exports = function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }
  req.token = auth.split(' ')[1]
  next()
}