import { createContext, useContext } from 'react'
import type { ThemeMode } from '../config/theme'

/** Viewport point the theme transition spreads from (the toggle's centre). */
export interface ThemeOrigin {
  x: number
  y: number
}

export const ThemeModeContext = createContext<{ mode: ThemeMode; toggle: (origin?: ThemeOrigin) => void }>({
  mode: 'dark',
  toggle: () => {},
})

export const useThemeMode = () => useContext(ThemeModeContext)
