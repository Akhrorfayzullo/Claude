import express from 'express'
import { sendTelegram, parseUserAgent, getClientIp, getGeoInfo } from '../utils/telegram.js'

const router = express.Router()

// Dedup: prevent spam if someone refreshes many times.
// Only applies to page_visit — leave/download/click always notify.
const recentEvents = new Map()
const VISIT_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes

function isDuplicate(ip, type) {
  if (type !== 'page_visit') return false
  const key = `${ip}:${type}`
  const last = recentEvents.get(key)
  if (last && Date.now() - last < VISIT_COOLDOWN_MS) return true
  recentEvents.set(key, Date.now())
  return false
}

const EVENT_META = {
  page_visit:      { emoji: '🌐', label: 'New Visit' },
  page_leave:      { emoji: '👋', label: 'User Left' },
  resume_download: { emoji: '📥', label: 'Resume Downloaded' },
  project_click:   { emoji: '🚀', label: 'Project Opened' },
}

router.post('/', async (req, res) => {
  const { type, meta = {} } = req.body ?? {}

  if (!EVENT_META[type]) {
    return res.status(400).json({ message: 'Invalid event type.' })
  }

  // Respond immediately — never make the browser wait
  res.json({ ok: true })

  const ip = getClientIp(req)
  if (isDuplicate(ip, type)) return

  const now = new Date()
  const dateStr = now.toLocaleString('en-GB', {
    timeZone: 'Asia/Seoul',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  })

  const { emoji, label } = EVENT_META[type]

  // ── page_leave: lightweight message, no geo needed ──────────
  if (type === 'page_leave') {
    const timeOnPage = meta.timeOnPage ?? '?'
    const deepestSection = meta.deepestSection ?? 'Unknown'
    const sessionId = meta.sessionId ? `#${meta.sessionId}` : ''

    const hints = {
      'Contact': '← was looking for how to reach you 🔥',
      'Resume':  '← checked your resume',
      'Projects':'← browsed your projects',
      'Skills':  '← looked at your skills',
      'About':   '← read about you',
      'Hero':    '← left early',
    }
    const sectionName = deepestSection.replace(/^[^\s]+ /, '') // strip emoji
    const hint = hints[sectionName] ?? ''

    const text =
      `👋 <code>${sessionId}</code> just left\n` +
      `⏱️ <b>${timeOnPage}</b> on page\n` +
      `📜 Got to: <b>${deepestSection}</b>\n` +
      `${hint}`

    await sendTelegram(text)
    return
  }

  // ── all other events: full geo + device info ─────────────────
  const ua = req.headers['user-agent'] ?? ''
  const referer = meta.referrer || req.headers['referer'] || 'Direct'
  const { browser, os, isMobile } = parseUserAgent(ua)
  const { country, city, isp } = await getGeoInfo(ip)

  const locationParts = [city, country].filter(Boolean)
  const locationLine = locationParts.length ? locationParts.join(', ') : 'Unknown'
  const ispLine = isp ? ` • ${isp}` : ''

  const deviceIcon = isMobile ? '📱' : '💻'
  const screenInfo = meta.screen ? ` • ${meta.screen}` : ''

  const cleanRef = referer.replace(/^https?:\/\//, '').split('/')[0]
  const refLine = cleanRef && cleanRef !== 'Direct'
    ? `\n🔗 From: <b>${cleanRef}</b>`
    : ''

  let extraLine = ''
  if (type === 'project_click' && meta.title) {
    extraLine = `\n📁 Project: <b>${meta.title}</b>`
  }
  if (type === 'resume_download') {
    extraLine = `\n📄 File: Resume PDF`
  }

  const sessionId = meta.sessionId ? `  <code>#${meta.sessionId}</code>` : ''

  const text =
    `${emoji} <b>${label}</b>${sessionId}\n` +
    `📅 ${dateStr} KST\n` +
    `🌍 ${locationLine}${ispLine}\n` +
    `${deviceIcon} ${browser} on ${os}${screenInfo}` +
    `\n🗣️ ${meta.language ?? 'Unknown'}` +
    refLine +
    extraLine

  await sendTelegram(text)
})

export default router
