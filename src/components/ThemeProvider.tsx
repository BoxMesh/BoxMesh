import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import jaJP from 'antd/locale/ja_JP'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { buildTheme, THEME_COLOR, type ThemeMode } from '../config/theme'
import { ThemeModeContext, type ThemeOrigin } from '../hooks/useThemeMode'
import { useLang } from '../i18n'

const STORAGE_KEY = 'boxmesh-theme'

// index.html sets data-theme before first paint (saved choice, else the OS preference); start from it.
const initialMode = (): ThemeMode => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode)

  useEffect(() => {
    document.documentElement.dataset.theme = mode
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[mode])
  }, [mode])

  // Only an explicit choice is saved; until then the app keeps following the OS setting.
  const toggle = useCallback(
    (origin?: ThemeOrigin) => {
      const next = mode === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Storage blocked (private mode, policy): the choice lasts for this session only.
      }

      // The new theme spreads as a circle from the control; without View Transitions, or with reduced motion, it just switches.
      // The attribute goes first in both paths. Child effects run before the provider's own, so a
      // child that reads the palette out of CSS variables during this commit — the terminal does,
      // because xterm paints to its own tree — would otherwise pick up the theme being replaced.
      if (!('startViewTransition' in document) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.dataset.theme = next
        setMode(next)
        return
      }
      const { x, y } = origin ?? { x: innerWidth / 2, y: 0 }
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
      const transition = document.startViewTransition(() => {
        document.documentElement.dataset.theme = next
        flushSync(() => setMode(next))
      })
      transition.ready
        .then(() =>
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 550, easing: 'cubic-bezier(0.2, 0, 0, 1)', pseudoElement: '::view-transition-new(root)' },
          ),
        )
        .catch(() => {
          // Skipped transition (e.g. the tab was hidden): the theme has already switched.
        })
    },
    [mode],
  )

  const value = useMemo(() => ({ mode, toggle }), [mode, toggle])
  const themeConfig = useMemo(() => buildTheme(mode), [mode])

  return (
    <ThemeModeContext value={value}>
      <ConfigProvider theme={themeConfig} tag={{ variant: 'outlined' }} locale={useLang() === 'ja' ? jaJP : enUS}>
        {children}
      </ConfigProvider>
    </ThemeModeContext>
  )
}
