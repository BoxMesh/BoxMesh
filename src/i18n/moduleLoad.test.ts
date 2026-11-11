import { expect, it, vi } from 'vitest'

// Every t() made while a file loads, instead of while rendering. Such a label keeps the old language after a switch.
const atLoad: string[] = []

vi.mock('.', async (original) => {
  const i18n = await original<typeof import('.')>()
  return { ...i18n, t: (text: string, vars?: Record<string, string | number>) => (atLoad.push(text), i18n.t(text, vars)) }
})

it('translates nothing when a file loads', async () => {
  // main.tsx renders into the page, so it is the one file left out.
  const files = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}', '!./**', '!../main.tsx'])
  await Promise.all(Object.values(files).map((load) => load()))
  expect(Object.keys(files).length).toBeGreaterThan(50)
  expect(atLoad).toEqual([])
}, 60_000) // the first load of antd and xterm takes a while
