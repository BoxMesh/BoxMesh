import { useQueries } from '@tanstack/react-query'
import { Card, Progress, Segmented, Skeleton } from 'antd'
import { useState } from 'react'
import { tone } from '../../config/theme'
import { t } from '../../i18n'
import { userMessage } from '../../services/http'
import { deviceMetricsQuery } from '../../services/queries'
import type { TimeRange } from '../../types/dashboard'
import type { Device } from '../../types/device'
import { THRESHOLDS } from '../../utils/devices'
import { formatDateTime, MINUTE } from '../../utils/time'
import UsageChart from '../device-detail/UsageChart'

type Metric = 'cpu' | 'ram' | 'disk'

const METRICS = (): { value: Metric; label: string }[] => [
  { value: 'cpu', label: 'CPU' },
  { value: 'ram', label: 'RAM' },
  { value: 'disk', label: t('Disk') },
]
const RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
]
// The width of one chart point per range, as BoxServer averages them (see PRODUCT.md, Metrics history).
const STEP: Record<TimeRange, number> = { '1h': MINUTE, '24h': 15 * MINUTE, '7d': 60 * MINUTE }
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
const percent = (v: number) => `${Math.round(v)}%`
// An average sits low, so a fixed 0-100 scale draws it as a flat strip: use the smallest round ceiling above it.
const CEILINGS = [10, 20, 25, 40, 50, 60, 80, 100]

/**
 * The average usage of every device the user can see. BoxServer has no fleet-wide history, so each device's own
 * history is read and averaged here, point by point.
 * shortcut: one request per device, fine for tens of machines; ask BoxServer for a fleet endpoint before hundreds.
 */
export default function FleetChartCard({ devices }: { devices: Device[] }) {
  const [metric, setMetric] = useState<Metric>('cpu')
  const [range, setRange] = useState<TimeRange>('24h')
  const results = useQueries({ queries: devices.map((d) => deviceMetricsQuery(d.id, range)) })

  // Each device reports on its own clock, so its points are snapped to the range's step before averaging;
  // otherwise every point would hold one device and the line would jump between them.
  const buckets = new Map<number, { sum: number; n: number }>()
  for (const r of results) {
    for (const p of r.data ?? []) {
      const at = Math.floor(Date.parse(p.at) / STEP[range]) * STEP[range]
      const b = buckets.get(at) ?? { sum: 0, n: 0 }
      buckets.set(at, { sum: b.sum + p[metric], n: b.n + 1 })
    }
  }
  const starts = [...buckets.keys()].toSorted((a, b) => a - b)
  const times = starts.map((at) => new Date(at).toISOString())
  const values = starts.map((at) => buckets.get(at)!.sum / buckets.get(at)!.n)
  const max = CEILINGS.find((c) => c >= Math.max(...values) * 1.2) ?? 100
  const peakAt = values.indexOf(Math.max(...values))
  const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1)
  const stats = [
    { label: t('Now'), n: values.at(-1) ?? 0 },
    { label: t('Average'), n: mean },
    { label: t('Peak'), n: values[peakAt] ?? 0, sub: times[peakAt] && (range === '7d' ? formatDateTime(times[peakAt]) : clock(times[peakAt])) },
    { label: t('Lowest'), n: Math.min(...values) },
  ]
  const loaded = results.filter((r) => !r.isPending).length
  const failed = results.find((r) => r.isError)
  const label = t('Average {metric}', { metric: METRICS().find((m) => m.value === metric)!.label })

  return (
    <Card
      title={t('Usage over time')}
      extra={
        <span className="card-tools">
          <Segmented<Metric> size="small" aria-label={t('Resource')} options={METRICS()} value={metric} onChange={setMetric} />
          <Segmented<TimeRange> size="small" aria-label={t('Time range')} options={RANGES} value={range} onChange={setRange} />
        </span>
      }
    >
      {!devices.length ? (
        <p className="muted card-note">{t('No devices')}</p>
      ) : loaded === 0 ? (
        <Skeleton active paragraph={{ rows: 6 }} title={false} />
      ) : failed && times.length === 0 ? (
        <span className="muted">
          {t("Usage history didn't load.")} {userMessage(failed.error)}
        </span>
      ) : times.length < 2 ? (
        <p className="muted card-note">{t('Not enough usage history yet.')}</p>
      ) : (
        <div className="chart-split">
          <div className="chart-main">
            <div className="usage-legend chart-legend">
              <span>
                <span className="usage-swatch s1" />
                {label} {percent(values.at(-1)!)}
              </span>
              {loaded < devices.length && (
                <span className="muted">{t('Loaded {done} of {total} devices', { done: loaded, total: devices.length })}</span>
              )}
            </div>
            <UsageChart
              label={label}
              times={times}
              series={[{ label, values }]}
              max={max}
              format={percent}
              threshold={THRESHOLDS[metric] <= max ? THRESHOLDS[metric] : undefined}
              range={range}
              height={320}
            />
          </div>
          <dl className="chart-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="muted">{s.label}</dt>
                <dd>{percent(s.n)}</dd>
                <Progress
                  percent={s.n}
                  size="small"
                  showInfo={false}
                  strokeColor={s.n >= THRESHOLDS[metric] ? tone.error : tone.disabled}
                  aria-label={s.label}
                />
                {s.sub && <span className="sub">{s.sub}</span>}
              </div>
            ))}
          </dl>
        </div>
      )}
    </Card>
  )
}
