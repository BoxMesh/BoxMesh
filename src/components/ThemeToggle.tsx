import { useThemeSwitch } from '../hooks/useThemeMode'
import { Icon } from './Icon'

/** Icon button that switches the theme. No tooltip; the name is on the button for screen readers. */
export default function ThemeToggle() {
  const { mode, switchProps } = useThemeSwitch()
  return (
    <button className="icon-btn" {...switchProps}>
      <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  )
}
