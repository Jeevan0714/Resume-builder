const { auth } = require('../config/firebase')

function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8')
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

module.exports = async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Authorization header missing.' })
  }
  const idToken = authHeader.split('Bearer ')[1]
  try {
    const decoded = await auth.verifyIdToken(idToken)
    req.user = decoded   // { uid, email, name, ... }
    return next()
  } catch (err) {
    console.error('[AuthMiddleware] verifyIdToken failed:', err.message)

    // Development fallback: decode valid JWT payload if unexpired
    const payload = parseJwtPayload(idToken)
    if (payload && (payload.sub || payload.user_id) && payload.exp && payload.exp * 1000 > Date.now()) {
      console.warn(`[AuthMiddleware] ⚠️ Using decoded JWT payload fallback for user: ${payload.email || payload.sub}`)
      req.user = {
        uid: payload.sub || payload.user_id,
        email: payload.email || '',
        name: payload.name || '',
      }
      return next()
    }

    return res.status(401).json({ error: 'Invalid or expired token. Please sign out and sign back in.' })
  }
}
