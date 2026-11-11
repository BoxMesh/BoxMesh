import { describe, expect, it } from 'vitest'
import { ago, formatDate, formatDateTime, fromNow } from './time'

const NOW = Date.parse('2026-11-03T12:00:00Z')

describe('ago', () => {
  it('formats elapsed time', () => {
    expect(ago(fromNow(-3_000, NOW), NOW)).toBe('just now')
    expect(ago(fromNow(-45_000, NOW), NOW)).toBe('45 s ago')
    expect(ago(fromNow(-18 * 60_000, NOW), NOW)).toBe('18 min ago')
    expect(ago(fromNow(-26 * 3_600_000, NOW), NOW)).toBe('1 day ago')
  })
})

describe('formatDate', () => {
  it('pads the day and keeps every month three letters, so dates share one width', () => {
    // Local-time constructors, so the test holds in any time zone.
    expect(formatDate(new Date(2027, 6, 4).toISOString())).toBe('04 Jul 2027')
    expect(formatDate(new Date(2027, 8, 13).toISOString())).toBe('13 Sep 2027')
    expect(formatDateTime(new Date(2027, 6, 4, 9, 5).toISOString())).toBe('04 Jul 2027, 09:05')
  })
})
