import { Badge } from 'antd'
import { tone } from '../config/theme'

export default function Status({ online }: { online: boolean }) {
  return online ? (
    <Badge color={tone.positive} text="Online" />
  ) : (
    <Badge color={tone.disabled} text={<span className="muted">Offline</span>} />
  )
}
