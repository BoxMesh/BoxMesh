export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const DAY = 24 * 60 * MINUTE

// Month names instead of 03/11/2026, which reads differently in the US and Vietnam. Built by hand rather
// than with Intl, whose en-GB output varies in width ("4 Jul", "13 Sept"): every date is "04 Jul 2027"
// and every date-time "04 Jul 2027, 09:05", so a column of them lines up.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad = (n: number) => String(n).padStart(2, '0')

export function fromNow(offsetMs: number, now = Date.now()) {
  return new Date(now + offsetMs).toISOString()
}

export function formatDate(iso: string) {
  const d = new Date(iso)
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${formatDate(iso)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
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
