import { useSuspenseQueries } from '@tanstack/react-query'
import { Button, Card, Progress, Segmented, Table, Tag, Timeline, type TableProps } from 'antd'
import { useState, useTransition } from 'react'
import { Link } from 'react-router'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { tone } from '../../config/theme'
import { devicesQuery, recentActivityQuery, remoteSessionsQuery, resourceUsageQuery } from '../../services/queries'
import type { TimeRange } from '../../types/dashboard'
import { summarize, triage, type Severity, type TriageRow } from '../../utils/devices'
import { ago, daysLeft, daysLeftLabel } from '../../utils/time'

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
]
const RESOURCE_WARN = 70
const RESOURCES = [
  { key: 'cpu', label: 'CPU' },
  { key: 'ram', label: 'RAM' },
  { key: 'disk', label: 'Disk' },
] as const

const SEVERITY_LABEL: Record<Severity, string> = { critical: 'Critical', warning: 'Warning', offline: 'Offline' }

// The queue is one table: each severity opens with a header row that spans every column.
type QueueRow = TriageRow | { group: Severity; count: number }
const isGroup = (r: QueueRow): r is { group: Severity; count: number } => 'group' in r
const COLUMN_COUNT = 6
const spanGroup = (r: QueueRow) => (isGroup(r) ? { colSpan: 0 } : {})

const queueColumns: TableProps<QueueRow>['columns'] = [
  {
    key: 'severity',
    width: 4,
    onCell: (r) => (isGroup(r) ? { colSpan: COLUMN_COUNT, className: 'queue-group' } : { className: 'queue-stripe-cell' }),
    render: (_, r) =>
      isGroup(r) ? (
        `${SEVERITY_LABEL[r.group]} · ${r.count}`
      ) : (
        <span className={`queue-stripe ${r.severity}`} aria-label={SEVERITY_LABEL[r.severity]} />
      ),
  },
  {
    title: <Th icon="devices" label="Device" />,
    key: 'device',
    onCell: spanGroup,
    render: (_, r) =>
      isGroup(r) ? null : (
        <Link to={`/devices/${r.device.host}`} className="strong queue-nowrap">
          {r.device.host}
        </Link>
      ),
  },
  {
    title: <Th icon="warning" label="Issue" />,
    key: 'issue',
    onCell: spanGroup,
    render: (_, r) =>
      isGroup(r) ? null : (
        <span className="queue-tags">
          {r.issues.map((i) => (
            <Tag key={i.kind} color={i.level}>
              {i.label}
            </Tag>
          ))}
        </span>
      ),
  },
  {
    title: <Th icon="pulse" label="Value" />,
    key: 'value',
    onCell: spanGroup,
    render: (_, r) => (isGroup(r) ? null : r.issues.map((i) => i.value).join(' · ')),
  },
  {
    title: <Th icon="clock" label="Last seen" />,
    key: 'seen',
    onCell: spanGroup,
    render: (_, r) => (isGroup(r) ? null : <span className="muted queue-nowrap">{ago(r.device.lastSeen)}</span>),
  },
  {
    title: <Th icon="more" label="Next step" />,
    key: 'action',
    onCell: spanGroup,
    render: (_, r) => {
      if (isGroup(r)) return null
      // A machine running hot is looked at in a terminal; anything else starts from its own page.
      const hot = r.device.online && r.issues.some((i) => i.kind === 'cpu' || i.kind === 'ram')
      return (
        <Link to={hot ? `/remote-terminal?host=${encodeURIComponent(r.device.host)}` : `/devices/${r.device.host}`}>
          <Button size="small" icon={hot ? <Icon name="terminal" size={14} /> : undefined}>
            {hot ? 'Terminal' : 'Open'}
          </Button>
        </Link>
      )
    },
  },
]

export default function DashboardPage() {
  const [range, setRange] = useState<TimeRange>('24h')
  // A transition keeps the current numbers on screen while the new range loads, instead of the page spinner.
  const [, startTransition] = useTransition()
  const [{ data: devices }, { data: resources }, { data: remoteSessions }, { data: activity }] = useSuspenseQueries({
    queries: [devicesQuery, resourceUsageQuery(range), remoteSessionsQuery, recentActivityQuery],
  })
  const s = summarize(devices)
  const rows = triage(devices)
  const count = (severity: Severity) => rows.filter((r) => r.severity === severity).length
  const critical = count('critical')
  const warning = count('warning')
  const healthy = s.online - critical - warning
  const criticalRows = rows.filter((r) => r.severity === 'critical')
  const overThreshold = criticalRows.filter((r) => r.issues.some((i) => i.kind === 'cpu' || i.kind === 'ram')).length
  const certsSoon = criticalRows.filter((r) => r.issues.some((i) => i.kind === 'cert')).length
  const soonest = s.expiringCerts[0]

  const queue: QueueRow[] = (['critical', 'warning', 'offline'] as const).flatMap((severity) => {
    const group = rows.filter((r) => r.severity === severity)
    return group.length ? [{ group: severity, count: group.length }, ...group] : []
  })

  const segments = [
    { key: 'healthy', count: healthy, label: 'healthy' },
    { key: 'warning', count: warning, label: 'warning' },
    { key: 'critical', count: critical, label: 'critical' },
    { key: 'offline', count: s.offline, label: 'offline' },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Dashboard"
        subtitle="What is down, what needs attention, and what to do next."
        actions={
          <Segmented<TimeRange>
            aria-label="Time range"
            options={RANGE_OPTIONS}
            value={range}
            onChange={(value) => startTransition(() => setRange(value))}
          />
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <div className="health-strip">
          <div className="health-cell">
            <span className="muted">Fleet health</span>
            <span className="health-big">
              {s.online} <span className="health-unit">of {s.total} online</span>
            </span>
            {/* The bar is a picture of the legend below it, which carries the same numbers in words. */}
            <div className="health-bar" aria-hidden="true">
              {segments.map((seg) => (
                <i key={seg.key} className={seg.key} style={{ flexGrow: seg.count }} />
              ))}
            </div>
            <div className="health-legend">
              {segments.map((seg) => (
                <span key={seg.key}>
                  <i className={seg.key} />
                  {seg.count} {seg.label}
                </span>
              ))}
            </div>
          </div>
          <div className="health-cell">
            <span className="muted">Needs attention now</span>
            <span className="health-big" style={{ color: critical ? tone.error : undefined }}>
              {critical}
            </span>
            <span className="sub">
              {critical ? `${overThreshold} over threshold · ${certsSoon} certificate${certsSoon === 1 ? '' : 's'} within 7 days` : 'Nothing critical'}
            </span>
          </div>
          <div className="health-cell">
            <span className="muted">Certificates within 30 days</span>
            <span className="health-big" style={{ color: s.expiringCerts.length ? tone.warning : undefined }}>
              {s.expiringCerts.length}
            </span>
            <span className="sub">
              {soonest ? `Soonest: ${soonest.host}, ${daysLeftLabel(daysLeft(soonest.certExpires))}` : 'Every certificate is current'}
            </span>
          </div>
          <div className="health-cell">
            <span className="muted">Average latency</span>
            <span className="health-big">
              {s.avgLatency} <span className="health-unit">ms</span>
            </span>
            <span className="sub">
              {s.online} tunnels open · {remoteSessions.reconnects24h} reconnects in 24 h
            </span>
          </div>
        </div>
      </Card>

      <div className="dash-cols">
        <Card title="Needs attention" extra={<Link to="/devices">All devices</Link>} styles={{ body: { padding: 0 } }}>
          <Table<QueueRow>
            columns={queueColumns}
            dataSource={queue}
            rowKey={(r) => (isGroup(r) ? `group-${r.group}` : r.device.host)}
            pagination={false}
            // A fixed minimum rather than max-content: a device with three issues wraps its tags instead of
            // pushing Last seen and Next step out of the card. Below 680px the table scrolls sideways.
            scroll={{ x: 680 }}
            locale={{
              emptyText: <span className="muted">Every device is online, within its thresholds, and its certificate is current.</span>,
            }}
          />
        </Card>

        <div className="dash-side">
          <Card title="Average resources">
            {RESOURCES.map(({ key, label }) => {
              const value = resources[key]
              const high = value > RESOURCE_WARN
              return (
                <div key={key} className="meter">
                  <div className="meter-label">
                    <span>{label}</span>
                    <span>
                      {value}%{high ? ` · above ${RESOURCE_WARN}%` : ''}
                    </span>
                  </div>
                  <Progress
                    percent={value}
                    showInfo={false}
                    size={['100%', 8]}
                    strokeColor={high ? 'var(--warning-fill)' : tone.positive}
                    aria-label={label}
                  />
                </div>
              )
            })}
          </Card>
          <Card title="Recent activity">
            <Timeline
              items={activity.map((a) => ({
                color: a.failed ? tone.error : tone.positive,
                content: (
                  <>
                    <div>{a.text}</div>
                    <div className="sub">{ago(a.at)}</div>
                  </>
                ),
              }))}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
