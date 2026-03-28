import { Router } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { ProfileImage } from '../models/ProfileImage.js'
import { Project } from '../models/Project.js'
import { Resume } from '../models/Resume.js'
import {
  serializeProfileImage,
  serializeProject,
  serializeResume,
} from '../utils/serializers.js'

const router = Router()

const resumesDirectory = path.resolve(process.cwd(), 'uploads', 'resumes')
const brandingDirectory = path.resolve(process.cwd(), 'uploads', 'branding')

const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, resumesDirectory)
    },
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname) || '.pdf'
      const safeBaseName = path
        .basename(file.originalname, extension)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      callback(null, `${Date.now()}-${safeBaseName || 'resume'}${extension}`)
    },
  }),
  fileFilter: (_request, file, callback) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')
    callback(isPdf ? null : new Error('Only PDF resumes are supported.'), isPdf)
  },
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
})

const profileImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, brandingDirectory)
    },
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname) || '.png'
      const safeBaseName = path
        .basename(file.originalname, extension)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      callback(null, `${Date.now()}-${safeBaseName || 'profile-image'}${extension}`)
    },
  }),
  fileFilter: (_request, file, callback) => {
    const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
    const extension = path.extname(file.originalname).toLowerCase()
    const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg'])
    const isAccepted = allowedMimeTypes.has(file.mimetype) || allowedExtensions.has(extension)

    callback(isAccepted ? null : new Error('Only PNG, JPG, WEBP, or SVG images are supported.'), isAccepted)
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => `${tag}`.trim())
      .filter(Boolean)
  }

  return `${value ?? ''}`
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function getProjectPayload(body) {
  return {
    title: `${body.title ?? ''}`.trim(),
    description: `${body.description ?? ''}`.trim(),
    href: `${body.href ?? ''}`.trim(),
    tags: normalizeTags(body.tags),
    sortOrder: Number(body.sortOrder ?? 0),
  }
}

function validateProjectPayload(payload) {
  if (!payload.title || !payload.description || !payload.href) {
    return 'Title, description, and link are required.'
  }

  if (!Number.isFinite(payload.sortOrder)) {
    return 'Sort order must be a valid number.'
  }

  return null
}

router.use(requireAuth)

router.post('/projects', async (request, response, next) => {
  try {
    const payload = getProjectPayload(request.body)
    const validationError = validateProjectPayload(payload)

    if (validationError) {
      response.status(400).json({ message: validationError })
      return
    }

    const project = await Project.create(payload)
    response.status(201).json(serializeProject(project))
  } catch (error) {
    next(error)
  }
})

router.put('/projects/:projectId', async (request, response, next) => {
  try {
    const payload = getProjectPayload(request.body)
    const validationError = validateProjectPayload(payload)

    if (validationError) {
      response.status(400).json({ message: validationError })
      return
    }

    const project = await Project.findByIdAndUpdate(request.params.projectId, payload, {
      new: true,
      runValidators: true,
    })

    if (!project) {
      response.status(404).json({ message: 'Project not found.' })
      return
    }

    response.json(serializeProject(project))
  } catch (error) {
    next(error)
  }
})

router.delete('/projects/:projectId', async (request, response, next) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(request.params.projectId)

    if (!deletedProject) {
      response.status(404).json({ message: 'Project not found.' })
      return
    }

    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

router.post('/resume', resumeUpload.single('resume'), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ message: 'Please upload a PDF resume.' })
      return
    }

    const previousResume = await Resume.findOne().sort({ updatedAt: -1, createdAt: -1 })

    const resume = await Resume.create({
      originalName: request.file.originalname,
      storedName: request.file.filename,
      mimeType: request.file.mimetype,
      size: request.file.size,
      filePath: path.resolve(request.file.path),
    })

    if (previousResume) {
      await Resume.findByIdAndDelete(previousResume._id)
      await fs.rm(previousResume.filePath, { force: true })
    }

    response.status(201).json(serializeResume(resume))
  } catch (error) {
    next(error)
  }
})

router.post(
  '/profile-image',
  profileImageUpload.single('profileImage'),
  async (request, response, next) => {
    try {
      if (!request.file) {
        response.status(400).json({ message: 'Please upload an image file.' })
        return
      }

      const previousProfileImage = await ProfileImage.findOne().sort({ updatedAt: -1, createdAt: -1 })

      const profileImage = await ProfileImage.create({
        originalName: request.file.originalname,
        storedName: request.file.filename,
        mimeType: request.file.mimetype,
        size: request.file.size,
        filePath: path.resolve(request.file.path),
      })

      if (previousProfileImage) {
        await ProfileImage.findByIdAndDelete(previousProfileImage._id)
        await fs.rm(previousProfileImage.filePath, { force: true })
      }

      response.status(201).json(serializeProfileImage(profileImage))
    } catch (error) {
      next(error)
    }
  },
)

export default router
