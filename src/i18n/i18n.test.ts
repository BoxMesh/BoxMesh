import { describe, expect, it } from 'vitest'
import { t } from '.'
import ja from './ja'

// Every source file as text, keyed by path. Tests and this folder are left out.
const sources = Object.entries(
  import.meta.glob<string>(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}', '!./**'], { query: '?raw', import: 'default', eager: true }),
)

// t('…') or t("…"), the first argument only.
const KEY = /\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g

describe('t', () => {
  it('falls back to the English key and fills placeholders', () => {
    expect(t('{n} devices enrolled', { n: 3 })).toBe('3 devices enrolled')
    expect(t('{a} and {b}', { a: 1 })).toBe('1 and {b}')
  })
})

describe('Japanese', () => {
  it('reads the source files', () => {
    expect(sources.length).toBeGreaterThan(50)
  })

  it('has a translation for every key in the source', () => {
    const missing = sources.flatMap(([file, text]) =>
      [...text.matchAll(KEY)]
        .map((m) => (m[1] ?? m[2]).replace(/\\(.)/g, '$1'))
        .filter((key) => !ja[key])
        .map((key) => `${file}: ${key}`),
    )
    expect(missing).toEqual([])
  })

  it('keeps every placeholder of the English key', () => {
    const broken = Object.entries(ja).filter(([en, text]) => (en.match(/\{\w+\}/g) ?? []).some((p) => !text.includes(p)))
    expect(broken).toEqual([])
  })

  it('never builds a key at run time', () => {
    const dynamic = sources.filter(([, text]) => /\bt\(\s*`/.test(text)).map(([file]) => file)
    expect(dynamic).toEqual([])
  })
})
