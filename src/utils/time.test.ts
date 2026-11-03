import { describe, expect, it } from 'vitest'
import { ago, daysLeft, fromNow } from './time'

const NOW = Date.parse('2026-11-03T12:00:00Z')

describe('ago', () => {
  it('formats elapsed time', () => {
    expect(ago(fromNow(-3_000, NOW), NOW)).toBe('just now')
    expect(ago(fromNow(-45_000, NOW), NOW)).toBe('45 s ago')
    expect(ago(fromNow(-18 * 60_000, NOW), NOW)).toBe('18 min ago')
    expect(ago(fromNow(-26 * 3_600_000, NOW), NOW)).toBe('1 day ago')
  })
})

describe('daysLeft', () => {
  it('rounds partial days up', () => {
    expect(daysLeft(fromNow(36 * 3_600_000, NOW), NOW)).toBe(2)
  })
})
