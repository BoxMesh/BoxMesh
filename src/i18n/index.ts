import { useSyncExternalStore } from 'react'
import ja from './ja'

export type Lang = 'en' | 'ja'

export const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
]

const STORAGE_KEY = 'boxmesh-lang'

// A saved choice wins; otherwise a Japanese browser starts in Japanese. Outside a browser (tests) it is English.
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'ja') return saved
  } catch {
    // Storage blocked or absent: fall through to the browser language.
  }
  return typeof document !== 'undefined' && navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

/** The current language. A live binding: importers always read the latest value. */
export let lang: Lang = initialLang()

/**
 * The English copy is the key; Japanese falls back to it for a line with no translation yet. `{name}` is filled
 * from `vars`. Keys must be string literals so `i18n.test.ts` can check every one has a translation.
 * Call it while rendering or handling an event, never at module level: a label worked out when the file loads
 * would keep the old language after a switch.
 */
export function t(text: string, vars?: Record<string, string | number>): string {
  const out = (lang === 'ja' && ja[text]) || text
  return vars ? out.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : out
}

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Switches the language in place; components using `useLang()` render again in it. */
export function setLang(next: Lang) {
  if (next === lang) return
  lang = next
  document.documentElement.lang = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Storage blocked: the choice lasts until the tab is reloaded.
  }
  listeners.forEach((listener) => listener())
}

export const useLang = () => useSyncExternalStore(subscribe, () => lang)
