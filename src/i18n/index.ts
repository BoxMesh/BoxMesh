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

export const lang: Lang = initialLang()

/**
 * The English copy is the key; Japanese falls back to it for a line with no translation yet. `{name}` is filled
 * from `vars`. Keys must be string literals so `i18n.test.ts` can check every one has a translation.
 */
export function t(text: string, vars?: Record<string, string | number>): string {
  const out = (lang === 'ja' && ja[text]) || text
  return vars ? out.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : out
}

/** Labels outside components are worked out once at load, so a switch reloads the app in the new language. */
export function setLang(next: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    return // Nowhere to keep the choice, so a reload would come back in the same language.
  }
  location.reload()
}
