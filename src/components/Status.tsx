import { Badge } from 'antd'
import { palette } from '../config/theme'

export default function Status({ online }: { online: boolean }) {
  return online ? (
    <Badge color={palette.primary} text="Online" />
  ) : (
    <Badge color={palette.textDisabled} text={<span className="muted">Offline</span>} />
  )
}
