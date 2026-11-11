import { Card, Progress, Segmented } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { tone } from '../../config/theme'
import { t } from '../../i18n'
import type { Device } from '../../types/device'
import { THRESHOLDS } from '../../utils/devices'

type Metric = 'cpu' | 'ram' | 'disk'

const METRICS = (): { value: Metric; label: string }[] => [
  { value: 'cpu', label: 'CPU' },
  { value: 'ram', label: 'RAM' },
  { value: 'disk', label: t('Disk') },
]

/** The five online devices using the most of one resource. Offline ones are left out: their numbers are stale. */
export default function TopUsageCard({ devices }: { devices: Device[] }) {
  const [metric, setMetric] = useState<Metric>('cpu')
  const label = METRICS().find((m) => m.value === metric)!.label
  const top = devices
    .filter((d) => d.online)
    .toSorted((a, b) => b[metric] - a[metric])
    .slice(0, 5)

  return (
    <Card
      title={t('Top usage')}
      extra={<Segmented<Metric> size="small" aria-label={t('Resource')} options={METRICS()} value={metric} onChange={setMetric} />}
      styles={{ body: { padding: 0 } }}
    >
      {top.length ? (
        <ul className="rank-list">
          {top.map((d) => {
            const hot = d[metric] >= THRESHOLDS[metric]
            return (
              <li key={d.host} className="rank-row">
                <Link to={`/devices/${encodeURIComponent(d.host)}`} className="strong rank-name">
                  {d.host}
                </Link>
                <Progress
                  percent={d[metric]}
                  showInfo={false}
                  size="small"
                  strokeColor={hot ? tone.error : tone.disabled}
                  aria-label={`${d.host} ${label}`}
                />
                <span className={hot ? 'rank-value hot' : 'rank-value'}>
                  {hot && <Icon name="warning" size={12} />}
                  {d[metric]}%{hot && <span className="sr-only"> {t('(over the {n}% threshold)', { n: THRESHOLDS[metric] })}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="muted card-note">{t('No device is online.')}</p>
      )}
    </Card>
  )
}
