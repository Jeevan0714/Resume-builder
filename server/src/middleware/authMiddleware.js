const { auth } = require('../config/firebase')

module.exports = async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Authorization header missing.' })
  }
  const idToken = authHeader.split('Bearer ')[1]
  try {
    const decoded = await auth.verifyIdToken(idToken)
    req.user = decoded   // { uid, email, name, ... }
    next()
  } catch (err) {
    console.error('[AuthMiddleware] Token verification failed:', err.message)
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}
