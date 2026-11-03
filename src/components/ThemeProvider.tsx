import { ConfigProvider } from 'antd'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildTheme, type ThemeMode } from '../config/theme'
import { ThemeModeContext } from '../hooks/useThemeMode'

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
  const toggle = useCallback(() => {
    const next = mode === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked (private mode, policy): the choice lasts for this session only.
    }
    setMode(next)
  }, [mode])

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
