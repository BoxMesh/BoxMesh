import { Tooltip } from 'antd'
import type { MouseEvent } from 'react'
import { useThemeMode } from '../hooks/useThemeMode'
import { Icon } from './Icon'

/** Icon button with a tooltip; `labelled` shows the target mode as text instead (sign-in page). */
export default function ThemeToggle({ labelled = false }: { labelled?: boolean }) {
  const { mode, toggle } = useThemeMode()
  const next = mode === 'dark' ? 'Light' : 'Dark'
  const icon = <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={labelled ? 16 : 18} />
  // Spread from the button's centre, so keyboard presses animate from the same place as clicks.
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  }

  if (labelled) {
    return (
      <button type="button" className="theme-pill" onClick={onClick}>
        {icon}
        {next} mode
      </button>
    )
  }

  const label = `Switch to ${next.toLowerCase()} theme`
  return (
    <Tooltip title={label}>
      <button type="button" className="icon-btn" onClick={onClick} aria-label={label}>
        {icon}
      </button>
    </Tooltip>
  )
}
