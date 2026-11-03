export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const DAY = 24 * 60 * MINUTE

// Month names instead of 03/11/2026, which reads differently in the US and Vietnam.
const date = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })
const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export function fromNow(offsetMs: number, now = Date.now()) {
  return new Date(now + offsetMs).toISOString()
}

export function formatDate(iso: string) {
  return date.format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso))
}

export function daysLeft(iso: string, now = Date.now()) {
  return Math.ceil((Date.parse(iso) - now) / DAY)
}

export function daysLeftLabel(days: number) {
  if (days <= 0) return 'expired'
  return days === 1 ? '1 day left' : `${days} days left`
}

export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / SECOND))
  if (s < 10) return 'just now'
  if (s < 60) return `${s} s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? '1 day ago' : `${d} days ago`
}
