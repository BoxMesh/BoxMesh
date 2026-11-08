import { Tooltip } from 'antd'
import { tone } from '../config/theme'
import { certTone } from '../utils/devices'
import { daysLeft, daysLeftLabel, formatDate } from '../utils/time'

// A certificate's expiry date, coloured by certTone's bands. Colour is the only mark, so the day count
// rides along for hover and screen readers. A revoked certificate's expiry no longer matters.
export default function CertExpiry({ iso, revoked = false }: { iso: string; revoked?: boolean }) {
  const days = daysLeft(iso)
  const band = revoked ? undefined : certTone(days)
  if (!band) return <>{formatDate(iso)}</>
  return (
    <Tooltip title={daysLeftLabel(days)}>
      <span style={{ color: tone[band] }} aria-label={`${formatDate(iso)}, ${daysLeftLabel(days)}`}>
        {formatDate(iso)}
      </span>
    </Tooltip>
  )
}
