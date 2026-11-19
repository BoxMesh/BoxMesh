import { useQueries, useSuspenseQueries } from '@tanstack/react-query'
import { Card } from 'antd'
import type { ReactNode } from 'react'
import { Icon, type IconName } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { tone } from '../../config/theme'
import { t } from '../../i18n'
import { getSession } from '../../services/authService'
import { deviceMetricsQuery, devicesQuery } from '../../services/queries'
import type { Device } from '../../types/device'
import { THRESHOLDS } from '../../utils/devices'
import DeviceSummaryCard from './DeviceSummaryCard'
import FleetChartCard from './FleetChartCard'

/** An icon tile and label, the figure, an optional meter, and a footer strip for the context line. */
function Stat({
  icon,
  label,
  value,
  unit,
  color,
  footer,
}: {
  icon: IconName
  label: string
  value: ReactNode
  unit?: string
  color?: string
  footer: ReactNode
}) {
  return (
    <Card className="stat-card">
      <div className="stat-main">
        <div className="stat-head">
          <span className="stat-icon" aria-hidden="true">
            <Icon name={icon} size={16} />
          </span>
          <span className="muted">{label}</span>
        </div>
        <span className="health-big" style={{ color }}>
          {value} {unit && <span className="health-unit">{unit}</span>}
        </span>
      </div>
      <div className="stat-foot">{footer}</div>
    </Card>
  )
}

const average = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)

const mbps = (v: number) => `${v < 10 ? v.toFixed(1) : Math.round(v)} Mbps`

/** Network in and out, each averaged over the online devices from their latest sample in the last hour. */
function Network({ devices }: { devices: Device[] }) {
  const online = devices.filter((d) => d.online)
  const latest = useQueries({ queries: online.map((d) => deviceMetricsQuery(d.id, '1h')) }).flatMap((r) => r.data?.at(-1) ?? [])
  const mean = (key: 'netIn' | 'netOut') => (latest.length ? latest.reduce((sum, p) => sum + p[key], 0) / latest.length : 0)
  return (
    <Stat
      icon="swap"
      label={t('Average Network I/O')}
      value={latest.length ? mbps(mean('netIn') + mean('netOut')) : '—'}
      footer={latest.length ? t('In {in} · Out {out}', { in: mbps(mean('netIn')), out: mbps(mean('netOut')) }) : t('No device is online.')}
    />
  )
}

/** An average over the online devices, as a stat card with a bar and the busiest device beneath. */
const USAGE_ICON: Record<'cpu' | 'ram' | 'disk', IconName> = { cpu: 'chip', ram: 'pulse', disk: 'box' }

function Usage({ label, metric, devices }: { label: string; metric: 'cpu' | 'ram' | 'disk'; devices: Device[] }) {
  const online = devices.filter((d) => d.online)
  const mean = average(online.map((d) => d[metric]))
  const peak = online.toSorted((a, b) => b[metric] - a[metric])[0]
  return (
    <Stat
      icon={USAGE_ICON[metric]}
      label={label}
      value={online.length ? `${mean}%` : '—'}
      color={mean >= THRESHOLDS[metric] ? tone.error : undefined}
      footer={peak ? t('Peak {value}% on {host}', { value: peak[metric], host: peak.host }) : t('No device is online.')}
    />
  )
}

export default function DashboardPage() {
  const name = getSession()?.name
  const [{ data: devices }] = useSuspenseQueries({ queries: [devicesQuery] })

  return (
    <div className="stack">
      <PageHeader
        title={
          name ? (
            <>
              {t('Welcome back,')} <span style={{ color: 'var(--accent)' }}>{name}</span>
            </>
          ) : (
            t('Dashboard')
          )
        }
        subtitle={t('What is down, what needs attention, and what to do next.')} />

      <div className="stat-grid">
        <Usage label={t('Average CPU')} metric="cpu" devices={devices} />
        <Usage label={t('Average RAM')} metric="ram" devices={devices} />
        <Usage label={t('Average Disk')} metric="disk" devices={devices} />
        <Network devices={devices} />
      </div>

      <FleetChartCard devices={devices} />
      <DeviceSummaryCard devices={devices} />

    </div>
  )
}
