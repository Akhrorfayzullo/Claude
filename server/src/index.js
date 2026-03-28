import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dns from 'node:dns'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import pino from 'pino'
import pinoHttp from 'pino-http'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import settingsRoutes from './routes/settings.js'
import profileImageRoutes from './routes/profile-image.js'
import projectsRoutes from './routes/projects.js'
import resumeRoutes from './routes/resume.js'
import { connectToDatabase } from './db/connect.js'
import { AdminUser } from './models/AdminUser.js'

// ── Validate required environment variables ────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD']
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key])
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`)
  console.error('Set them in your .env file before starting the server.')
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverRoot = path.resolve(__dirname, '..')
const clientDistPath = path.resolve(serverRoot, '..', 'client', 'dist')
const uploadsDirectory = path.resolve(serverRoot, 'uploads', 'resumes')
const brandingDirectory = path.resolve(serverRoot, 'uploads', 'branding')

const app = express()
const port = Number(process.env.PORT || 4000)
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
const isProduction = process.env.NODE_ENV === 'production'

// ── Logger ─────────────────────────────────────────────────────────────────
export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: isProduction ? undefined : { target: 'pino-pretty' },
})

// Some networks resolve Atlas SRV records in the OS, but refuse Node's default DNS path.
dns.setServers(['8.8.8.8', '1.1.1.1'])

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json())
app.use(pinoHttp({ logger }))

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/resume', resumeRoutes)
app.use('/api/profile-image', profileImageRoutes)
app.use('/api/admin', adminRoutes)

// ── Error handler ──────────────────────────────────────────────────────────
app.use((error, _request, response, _next) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error.'
  response.status(500).json({ message })
})

// ── Seed admin user ────────────────────────────────────────────────────────
async function seedAdminUser() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  const existing = await AdminUser.findOne({ username })
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12)
    await AdminUser.create({ username, passwordHash })
    logger.info({ username }, 'Admin user created')
  }
}

// ── Start ──────────────────────────────────────────────────────────────────
async function start() {
  await fs.mkdir(uploadsDirectory, { recursive: true })
  await fs.mkdir(brandingDirectory, { recursive: true })
  await connectToDatabase(process.env.MONGODB_URI)
  await seedAdminUser()

  try {
    await fs.access(clientDistPath)
    app.use(express.static(clientDistPath))
    app.get(/^(?!\/api).*/, (_request, response) => {
      response.sendFile(path.join(clientDistPath, 'index.html'))
    })
  } catch {
    // Client build is optional during API development.
  }

  app.listen(port, () => {
    logger.info(`Portfolio API running on http://localhost:${port}`)
  })
}

start().catch((error) => {
  logger.error(error, 'Failed to start server')
  process.exit(1)
})
