import jwt from 'jsonwebtoken'

export function requireAuth(request, response, next) {
  const auth = request.headers.authorization

  if (!auth?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Unauthorized.' })
    return
  }

  const token = auth.slice(7)

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme')
    request.admin = payload
    next()
  } catch {
    response.status(401).json({ message: 'Invalid or expired token.' })
  }
}
