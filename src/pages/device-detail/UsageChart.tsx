import { useState, type PointerEvent } from 'react'
import { t } from '../../i18n'
import type { TimeRange } from '../../types/dashboard'
import { DAY, formatDate, formatDateTime, MINUTE } from '../../utils/time'

export interface Series {
  label: string
  values: number[]
}

// Time marks fall on round local times: quarter hours, every six hours, every other midnight.
const TICK_STEP: Record<TimeRange, number> = { '1h': 15 * MINUTE, '24h': 6 * 60 * MINUTE, '7d': 2 * DAY }

const clock = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function ticksBetween(start: number, end: number, step: number) {
  const offset = new Date(start).getTimezoneOffset() * MINUTE
  const out: number[] = []
  for (let ms = Math.ceil((start - offset) / step) * step + offset; ms <= end; ms += step) out.push(ms)
  return out
}

export default function UsageChart({
  label,
  times,
  series,
  max,
  format,
  threshold,
  range,
  height = 88,
  axisFormat = format,
}: {
  label: string
  times: string[]
  series: Series[]
  max: number
  format: (value: number) => string
  /** The y labels; defaults to `format`. Pass a unit-less one when the unit is in the heading. */
  axisFormat?: (value: number) => string
  threshold?: number
  range: TimeRange
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const last = times.length - 1
  if (last < 1) return null

  const start = Date.parse(times[0])
  const end = Date.parse(times[last])
  const ticks = ticksBetween(start, end, TICK_STEP[range]).map((ms) => ({ ms, at: (ms - start) / (end - start) }))
  const y = (v: number) => 100 - (Math.min(v, max) / max) * 100
  const path = (values: number[]) => values.map((v, i) => `${i ? 'L' : 'M'}${i},${y(v)}`).join(' ')
  const tickLabel = range === '7d' ? (iso: string) => formatDate(iso).slice(0, 6) : clock
  const tipTime = range === '7d' ? formatDateTime : clock

  const track = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setHover(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * last))
  }

  const at = hover === null ? 0 : hover / last
  const shift = (pos: number) => (pos < 0.08 ? '0' : pos > 0.92 ? '-100%' : '-50%')
  const summary = series
    .map((s) =>
      t('{label} now {now}, lowest {low}, highest {high}', {
        label: s.label,
        now: format(s.values[last]),
        low: format(Math.min(...s.values)),
        high: format(Math.max(...s.values)),
      }),
    )
    .join('; ')

  return (
    <>
      <div
        className="usage-plot"
        style={{ height }}
        role="img"
        aria-label={
          t('{label} from {from} to {to}, scale 0 to {max}: {summary}', {
            label,
            from: formatDateTime(times[0]),
            to: formatDateTime(times[last]),
            max: format(max),
            summary,
          }) + (threshold === undefined ? '' : t('; alert at {value}', { value: format(threshold) }))
        }
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${last} 100`} preserveAspectRatio="none" aria-hidden="true">
          {ticks.map(({ ms, at: pos }) => (
            <line key={ms} className="usage-grid" x1={pos * last} x2={pos * last} y1={0} y2={100} />
          ))}
          {[0, 50, 100].map((v) => (
            <line key={v} className="usage-grid" x1={0} x2={last} y1={v} y2={v} />
          ))}
          <path className="usage-area" d={`${path(series[0].values)} L${last},100 L0,100 Z`} />
          {series.map((s, i) => (
            <path key={s.label} className={`usage-line s${i + 1}`} d={path(s.values)} />
          ))}
          {threshold === undefined ? null : <line className="usage-limit" x1={0} x2={last} y1={y(threshold)} y2={y(threshold)} />}
        </svg>
        <span className="usage-tick" style={{ top: 0 }}>
          {axisFormat(max)}
        </span>
        <span className="usage-tick" style={{ top: '50%' }}>
          {axisFormat(max / 2)}
        </span>
        {threshold === undefined ? null : (
          <span className="usage-limit-label" style={{ top: `${y(threshold)}%` }}>
            {t('Alert {value}', { value: format(threshold) })}
          </span>
        )}
        {hover !== null ? (
          <>
            <span className="usage-cross" style={{ left: `${at * 100}%` }} />
            {series.map((s, i) => (
              <span key={s.label} className={`usage-dot s${i + 1}`} style={{ left: `${at * 100}%`, top: `${y(s.values[hover])}%` }} />
            ))}
            <span className="usage-tip" style={{ left: `${at * 100}%`, transform: `translate(${shift(at)}, -100%)` }}>
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
        {ticks.map(({ ms, at: pos }) => (
          <span key={ms} style={{ left: `${pos * 100}%`, transform: `translateX(${shift(pos)})` }}>
            {tickLabel(new Date(ms).toISOString())}
          </span>
        ))}
      </div>
    </>
  )
}
