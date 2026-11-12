import { useSyncExternalStore } from 'react'
import ja from './ja'
import vi from './vi'

export type Lang = 'en' | 'vi' | 'ja'

export const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ja', label: '日本語' },
]

const STORAGE_KEY = 'boxmesh-lang'

// English is the key, so it has no dictionary.
const DICTIONARY: Record<Exclude<Lang, 'en'>, Record<string, string>> = { vi, ja }

// A saved choice wins; otherwise a Vietnamese or Japanese browser starts in its language. Outside a browser (tests) it is English.
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const known = LANGS.find((l) => l.value === saved)
    if (known) return known.value
  } catch {
    // Storage blocked or absent: fall through to the browser language.
  }
  if (typeof document === 'undefined') return 'en'
  const browser = navigator.language.toLowerCase()
  return LANGS.find((l) => browser.startsWith(l.value))?.value ?? 'en'
}

/** The current language. A live binding: importers always read the latest value. */
export let lang: Lang = initialLang()

/**
 * The English copy is the key; another language falls back to it for a line with no translation yet. `{name}` is filled
 * from `vars`. Keys must be string literals so `i18n.test.ts` can check every one has a translation.
 * Call it while rendering or handling an event, never at module level: a label worked out when the file loads
 * would keep the old language after a switch.
 */
export function t(text: string, vars?: Record<string, string | number>): string {
  const out = (lang !== 'en' && DICTIONARY[lang][text]) || text
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
