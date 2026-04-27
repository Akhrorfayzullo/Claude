import { Router } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { ProfileImage } from '../models/ProfileImage.js'
import { serializeProfileImage } from '../utils/serializers.js'

const router = Router()

async function getLatestProfileImage() {
  return ProfileImage.findOne().sort({ updatedAt: -1, createdAt: -1 })
}

router.get('/', async (_request, response, next) => {
  try {
    const profileImage = await getLatestProfileImage()

    if (!profileImage) {
      response.status(404).json({ message: 'No profile image uploaded yet.' })
      return
    }

    response.json(serializeProfileImage(profileImage))
  } catch (error) {
    next(error)
  }
})

router.get('/file', async (_request, response, next) => {
  try {
    const profileImage = await getLatestProfileImage()

    if (!profileImage) {
      response.status(404).json({ message: 'No profile image uploaded yet.' })
      return
    }

    const resolvedPath = path.resolve(profileImage.filePath)

    // File exists in MongoDB but may have been wiped from disk (e.g. server restart on Render)
    try {
      await fs.access(resolvedPath)
    } catch {
      response.status(404).json({ message: 'Profile image file not found on server.' })
      return
    }

    response.setHeader('Content-Type', profileImage.mimeType)
    response.setHeader('Cache-Control', 'public, max-age=60, must-revalidate')
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    response.sendFile(resolvedPath)
  } catch (error) {
    next(error)
  }
})

export default router
