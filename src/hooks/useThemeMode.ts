import { createContext, useContext } from 'react'
import type { ThemeMode } from '../config/theme'

export const ThemeModeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({
  mode: 'dark',
  toggle: () => {},
})

export const useThemeMode = () => useContext(ThemeModeContext)
