import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AdminUser } from '../models/AdminUser.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (request, response, next) => {
  try {
    const { username, password } = request.body

    if (!username || !password) {
      response.status(400).json({ message: 'Username and password are required.' })
      return
    }

    const admin = await AdminUser.findOne({ username: username.trim() })

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      response.status(401).json({ message: 'Invalid username or password.' })
      return
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || 'changeme',
      { expiresIn: '7d' },
    )

    response.json({ token })
  } catch (error) {
    next(error)
  }
})

router.get('/me', requireAuth, (request, response) => {
  response.json({ username: request.admin.username })
})

export default router
