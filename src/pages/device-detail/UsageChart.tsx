import { useState, type PointerEvent } from 'react'
import type { TimeRange } from '../../types/dashboard'
import { formatDate, formatDateTime } from '../../utils/time'

export interface Series {
  label: string
  values: number[]
}

const TICKS = [0, 0.25, 0.5, 0.75, 1]

const clock = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function UsageChart({
  label,
  times,
  series,
  max,
  format,
  threshold,
  range,
}: {
  label: string
  times: string[]
  series: Series[]
  max: number
  format: (value: number) => string
  threshold?: number
  range: TimeRange
}) {
  const [hover, setHover] = useState<number | null>(null)
  const last = times.length - 1
  if (last < 1) return null

  const y = (v: number) => 100 - (Math.min(v, max) / max) * 100
  const path = (values: number[]) => values.map((v, i) => `${i ? 'L' : 'M'}${i},${y(v)}`).join(' ')
  const tick = range === '7d' ? (iso: string) => formatDate(iso).slice(0, 6) : clock
  const tipTime = range === '7d' ? formatDateTime : clock

  const track = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setHover(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * last))
  }

  const at = hover === null ? 0 : hover / last
  const shift = at < 0.15 ? '0' : at > 0.85 ? '-100%' : '-50%'
  const summary = series
    .map((s) => `${s.label} now ${format(s.values[last])}, lowest ${format(Math.min(...s.values))}, highest ${format(Math.max(...s.values))}`)
    .join('; ')

  return (
    <>
      <div
        className="usage-plot"
        role="img"
        aria-label={`${label} from ${formatDateTime(times[0])} to ${formatDateTime(times[last])}: ${summary}${threshold === undefined ? '' : `; alert at ${format(threshold)}`}`}
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${last} 100`} preserveAspectRatio="none" aria-hidden="true">
          {TICKS.slice(1, -1).map((f) => (
            <line key={f} className="usage-grid" x1={f * last} x2={f * last} y1={0} y2={100} />
          ))}
          <line className="usage-grid" x1={0} x2={last} y1={50} y2={50} />
          <line className="usage-grid" x1={0} x2={last} y1={100} y2={100} />
          {series.length === 1 ? <path className="usage-area" d={`${path(series[0].values)} L${last},100 L0,100 Z`} /> : null}
          {series.map((s, i) => (
            <path key={s.label} className={`usage-line s${i + 1}`} d={path(s.values)} />
          ))}
          {threshold === undefined ? null : (
            <line className="usage-limit" x1={0} x2={last} y1={y(threshold)} y2={y(threshold)} />
          )}
        </svg>
        <span className="usage-tick" style={{ top: '50%' }}>
          {format(max / 2)}
        </span>
        {threshold === undefined ? null : (
          <span className="usage-limit-label" style={{ top: `${y(threshold)}%` }}>
            Alert {format(threshold)}
          </span>
        )}
        {hover !== null ? (
          <>
            <span className="usage-cross" style={{ left: `${at * 100}%` }} />
            {series.map((s, i) => (
              <span key={s.label} className={`usage-dot s${i + 1}`} style={{ left: `${at * 100}%`, top: `${y(s.values[hover])}%` }} />
            ))}
            <span className="usage-tip" style={{ left: `${at * 100}%`, transform: `translate(${shift}, -100%)` }}>
              <span className="muted">{tipTime(times[hover])}</span>
              {series.length === 1 ? (
                <strong> {format(series[0].values[hover])}</strong>
              ) : (
                series.map((s, i) => (
                  <span key={s.label} className="usage-tip-row">
                    <span className={`usage-swatch s${i + 1}`} />
                    {s.label} <strong>{format(s.values[hover])}</strong>
                  </span>
                ))
              )}
            </span>
          </>
        ) : null}
      </div>
      <div className="usage-axis" aria-hidden="true">
        {TICKS.map((f) => (
          <span key={f}>{tick(times[Math.round(f * last)])}</span>
        ))}
      </div>
    </>
  )
}
