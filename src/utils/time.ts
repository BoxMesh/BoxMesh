import { lang, t } from '../i18n'

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
  // Japanese reads dates year first: 2027/07/04.
  if (lang === 'ja') return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
  // Vietnamese reads day first: 04/07/2027.
  if (lang === 'vi') return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${formatDate(iso)}${lang === 'en' ? ', ' : ' '}${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / SECOND))
  if (s < 10) return t('just now')
  if (s < 60) return t('{n} s ago', { n: s })
  const m = Math.floor(s / 60)
  if (m < 60) return t('{n} min ago', { n: m })
  const h = Math.floor(m / 60)
  if (h < 24) return t('{n} h ago', { n: h })
  const d = Math.floor(h / 24)
  return d === 1 ? t('1 day ago') : t('{n} days ago', { n: d })
}
