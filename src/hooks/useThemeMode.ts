import { createContext, useContext, type MouseEvent } from 'react'
import type { ThemeMode } from '../config/theme'
import { t } from '../i18n'

/** Viewport point the theme transition spreads from (the control's centre). */
export interface ThemeOrigin {
  x: number
  y: number
}

export const ThemeModeContext = createContext<{ mode: ThemeMode; toggle: (origin?: ThemeOrigin) => void }>({
  mode: 'dark',
  toggle: () => {},
})

export const useThemeMode = () => useContext(ThemeModeContext)

/**
 * Props for a control that switches the theme when clicked: the header button and the sign-in logo.
 * The transition spreads from the control's own centre rather than the cursor, so a keyboard press
 * animates from the same place as a click.
 */
export function useThemeSwitch() {
  const { mode, toggle } = useThemeMode()
  return {
    mode,
    switchProps: {
      type: 'button' as const,
      'aria-label': mode === 'dark' ? t('Switch to light theme') : t('Switch to dark theme'),
      onClick: (e: MouseEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect()
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
      },
    },
  }
}
