import { useQuery } from '@tanstack/react-query'
import { Segmented, Skeleton } from 'antd'
import { useState } from 'react'
import { t } from '../../i18n'
import { userMessage } from '../../services/http'
import { deviceMetricsQuery } from '../../services/queries'
import type { TimeRange } from '../../types/dashboard'
import type { Device } from '../../types/device'
import { THRESHOLDS } from '../../utils/devices'
import UsageChart from './UsageChart'

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
]

const RESOURCES = () => [
  { key: 'cpu', label: 'CPU' },
  { key: 'ram', label: 'RAM' },
  { key: 'disk', label: t('Disk') },
] as const

const percent = (v: number) => `${Math.round(v)}%`
const mbps = (v: number) => `${v < 10 ? v.toFixed(1) : Math.round(v)} Mbps`
// The smallest round ceiling above the data, so the lines fill the chart instead of hugging its floor.
const niceMax = (v: number) => {
  const p = 10 ** Math.floor(Math.log10(v || 1))
  return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((n) => n >= v)!
}

/** CPU, RAM, disk and network over time: the Performance tab of the device page. */
export default function PerformancePanel({ device: d }: { device: Device }) {
  const [range, setRange] = useState<TimeRange>('24h')
  const metrics = useQuery(deviceMetricsQuery(d.host, range))
  const points = metrics.data ?? []
  const times = points.map((p) => p.at)
  const latest = points.at(-1)
  const network = [
    { label: t('Received'), values: points.map((p) => p.netIn) },
    { label: t('Sent'), values: points.map((p) => p.netOut) },
  ]

  return (
    <div className="perf-panel">
      <div className="perf-bar">
        <Segmented<TimeRange> size="small" aria-label={t('Time range')} options={RANGES} value={range} onChange={setRange} />
      </div>
      {metrics.isPending ? (
        <Skeleton active paragraph={{ rows: 8 }} title={false} />
      ) : metrics.isError ? (
        <span className="muted">{t("Usage history didn't load.")} {userMessage(metrics.error)}</span>
      ) : (
        <>
          {RESOURCES().map(({ key, label }) => {
            const now = latest?.[key] ?? d[key]
            const high = now >= THRESHOLDS[key]
            return (
              <div key={key} className="usage">
                <div className="meter-label">
                  <span>
                    {label} <span className="muted">· {d.hardware[key]}</span>
                  </span>
                  <span>
                    {now}%{high ? ` · ${t('above {n}%', { n: THRESHOLDS[key] })}` : ''}
                  </span>
                </div>
                <UsageChart
                  label={label}
                  times={times}
                  series={[{ label, values: points.map((p) => p[key]) }]}
                  max={100}
                  format={percent}
                  threshold={THRESHOLDS[key]}
                  range={range}
                />
              </div>
            )
          })}
          <div className="usage">
            <div className="meter-label">
              <span className="nowrap">
                {t('Network')} <span className="muted">· Mbps</span>
              </span>
              <span className="usage-legend">
                {network.map((s, i) => (
                  <span key={s.label}>
                    <span className={`usage-swatch s${i + 1}`} />
                    {s.label} {latest ? mbps(s.values.at(-1)!) : '—'}
                  </span>
                ))}
              </span>
            </div>
            <UsageChart
              label={t('Network')}
              times={times}
              series={network}
              max={niceMax(Math.max(...network.flatMap((s) => s.values)) * 1.05)}
              format={mbps}
              axisFormat={(v) => String(v)}
              range={range}
              height={120}
            />
          </div>
        </>
      )}
    </div>
  )
}
