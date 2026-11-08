import { describe, expect, it } from 'vitest'
import type { FileEntry } from '../types/remote'
import { compareListings, namesToSync, parentOf } from './files'

const file = (name: string, modified: string, size = 10): FileEntry => ({ name, kind: 'file', size, modified })

describe('compareListings', () => {
  it('labels each file against the other folder and ignores folders', () => {
    const here = [
      file('a.txt', '2026-11-09T10:00:00Z'),
      file('b.txt', '2026-11-09T10:00:00Z'),
      file('c.txt', '2026-11-09T10:00:01Z', 10),
      file('d.txt', '2026-11-09T10:00:00Z', 99),
      file('e.txt', '2026-11-01T10:00:00Z'),
      { name: 'docs', kind: 'folder', size: 0, modified: '2026-11-09T10:00:00Z' } as FileEntry,
    ]
    const there = [
      file('b.txt', '2026-11-08T10:00:00Z'),
      file('c.txt', '2026-11-09T10:00:00Z', 10),
      file('d.txt', '2026-11-09T10:00:00Z', 10),
      file('e.txt', '2026-11-09T10:00:00Z'),
    ]
    const result = compareListings(here, there)
    expect(Object.fromEntries(result)).toEqual({ 'a.txt': 'only', 'b.txt': 'newer', 'c.txt': 'same', 'd.txt': 'differs', 'e.txt': 'older' })
    expect(namesToSync(result)).toEqual(['a.txt', 'b.txt'])
  })
})

describe('parentOf', () => {
  it('stops at the root on both path styles', () => {
    expect(parentOf('C:\\Users\\ops', 'C:\\', '\\')).toBe('C:\\Users')
    expect(parentOf('C:\\Users', 'C:\\', '\\')).toBe('C:\\')
    expect(parentOf('/var/log', '/', '/')).toBe('/var')
    expect(parentOf('/var', '/', '/')).toBe('/')
  })
})
