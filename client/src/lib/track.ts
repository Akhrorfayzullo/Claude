const API = import.meta.env.VITE_API_BASE_URL ?? ''

export type TrackEventType = 'page_visit' | 'resume_download' | 'project_click'

/**
 * Fire-and-forget event tracker.
 * Never throws — tracking must never break the UI.
 */
export function trackEvent(
  type: TrackEventType,
  meta: Record<string, string> = {},
): void {
  const payload = {
    type,
    meta: {
      referrer: document.referrer || 'Direct',
      language: navigator.language,
      screen: `${screen.width}×${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...meta,
    },
  }

  fetch(`${API}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // silently ignore — tracking must never affect the user experience
  })
}
