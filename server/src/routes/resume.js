import { Router } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Resume } from '../models/Resume.js'
import { serializeResume } from '../utils/serializers.js'

const router = Router()

async function getLatestResume() {
  return Resume.findOne().sort({ updatedAt: -1, createdAt: -1 })
}

router.get('/', async (_request, response, next) => {
  try {
    const resume = await getLatestResume()

    if (!resume) {
      response.status(404).json({ message: 'No resume uploaded yet.' })
      return
    }

    response.json(serializeResume(resume))
  } catch (error) {
    next(error)
  }
})

router.get('/file', async (request, response, next) => {
  try {
    const resume = await getLatestResume()

    if (!resume) {
      response.status(404).json({ message: 'No resume uploaded yet.' })
      return
    }

    const resolvedPath = path.resolve(resume.filePath)

    // File exists in MongoDB but may have been wiped from disk (e.g. server restart on Render)
    try {
      await fs.access(resolvedPath)
    } catch {
      response.status(404).json({ message: 'Resume file not found on server.' })
      return
    }

    const shouldDownload = request.query.download === '1'

    if (shouldDownload) {
      response.download(resolvedPath, resume.originalName)
      return
    }

    response.setHeader('Content-Type', resume.mimeType)
    response.setHeader('Content-Disposition', `inline; filename="${resume.originalName}"`)
    response.sendFile(resolvedPath)
  } catch (error) {
    next(error)
  }
})

export default router
