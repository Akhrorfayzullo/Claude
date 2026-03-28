import { Router } from 'express'
import { Settings } from '../models/Settings.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const SUPPORTED_LANGUAGES = ['en', 'ko', 'uz']

router.get('/language', async (_request, response, next) => {
  try {
    const setting = await Settings.findOne({ key: 'defaultLanguage' })
    response.json({ language: setting?.value ?? 'en' })
  } catch (error) {
    next(error)
  }
})

router.put('/language', requireAuth, async (request, response, next) => {
  try {
    const { language } = request.body

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      response.status(400).json({ message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}.` })
      return
    }

    await Settings.findOneAndUpdate(
      { key: 'defaultLanguage' },
      { value: language },
      { upsert: true, new: true },
    )

    response.json({ language })
  } catch (error) {
    next(error)
  }
})

export default router
