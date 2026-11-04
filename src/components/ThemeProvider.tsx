import { ConfigProvider } from 'antd'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { buildTheme, type ThemeMode } from '../config/theme'
import { ThemeModeContext, type ThemeOrigin } from '../hooks/useThemeMode'

const STORAGE_KEY = 'edgeportal-theme'
const THEME_COLOR: Record<ThemeMode, string> = { dark: '#101416', light: '#ffffff' }

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

      // The new theme spreads as a circle from the button; without View Transitions, or with reduced motion, it just switches.
      if (!('startViewTransition' in document) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setMode(next)
        return
      }
      const { x, y } = origin ?? { x: innerWidth / 2, y: 0 }
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
      const transition = document.startViewTransition(() => {
        flushSync(() => setMode(next))
        document.documentElement.dataset.theme = next
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
      <ConfigProvider theme={themeConfig} tag={{ variant: 'outlined' }}>
        {children}
      </ConfigProvider>
    </ThemeModeContext>
  )
}
