import { useSuspenseQueries } from '@tanstack/react-query'
import { Button, Card, Table, Tag, type TableProps } from 'antd'
import { Link } from 'react-router'
import { Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { tone } from '../../config/theme'
import { devicesQuery, groupsQuery, remoteSessionsQuery } from '../../services/queries'
import { summarize, triage, type Severity, type TriageRow } from '../../utils/devices'
import { ago } from '../../utils/time'
import DiskForecastCard from './DiskForecastCard'
import GroupHealthCard from './GroupHealthCard'
import HealthBar from './HealthBar'
import TopUsageCard from './TopUsageCard'

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
    title: <Th icon="more" label="Action" />,
    key: 'action',
    onCell: spanGroup,
    render: (_, r) =>
      isGroup(r) ? null : (
        <Link to={`/devices/${r.device.host}`} aria-label={`Open ${r.device.host}`}>
          <Button size="small">Open</Button>
        </Link>
      ),
  },
]

export default function DashboardPage() {
  const [{ data: devices }, { data: groups }, { data: remoteSessions }] = useSuspenseQueries({
    queries: [devicesQuery, groupsQuery, remoteSessionsQuery],
  })
  const s = summarize(devices)
  const rows = triage(devices)
  const count = (severity: Severity) => rows.filter((r) => r.severity === severity).length
  const critical = count('critical')
  const warning = count('warning')
  const healthy = s.online - critical - warning
  const criticalRows = rows.filter((r) => r.severity === 'critical')
  const overThreshold = criticalRows.filter((r) => r.issues.some((i) => i.kind === 'cpu' || i.kind === 'ram')).length

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
  const outdated = devices.filter((d) => d.agentOutdated).length
  const families = (['Windows', 'Linux', 'macOS'] as const).map((family, i) => ({
    key: `os-${i + 1}`,
    count: s.byFamily[family] ?? 0,
    label: family,
  }))

  return (
    <div className="stack">
      <PageHeader
        title="Dashboard"
        subtitle="What is down, what needs attention, and what to do next."
      />

      <Card styles={{ body: { padding: 0 } }}>
        <div className="health-strip">
          <div className="health-cell">
            <span className="muted">Fleet health</span>
            <span className="health-big">
              {s.online} <span className="health-unit">of {s.total} online</span>
            </span>
            <HealthBar parts={segments} />
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
              {critical ? `${overThreshold} over the CPU or RAM threshold` : 'Nothing critical'}
            </span>
          </div>
          <div className="health-cell">
            <span className="muted">Average latency</span>
            <span className="health-big">
              {s.avgLatency} <span className="health-unit">ms</span>
            </span>
            <span className="sub">
              {remoteSessions.reconnects24h} reconnects in 24 h
            </span>
          </div>
          <div className="health-cell">
            <span className="muted">Agents</span>
            <span className="health-big">
              {outdated} <span className="health-unit">outdated</span>
            </span>
            <HealthBar parts={families} />
            <div className="health-legend">
              {families.map((f) => (
                <span key={f.key}>
                  <i className={f.key} />
                  {f.label} {f.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Alert" extra={<Link to="/devices">All devices</Link>} styles={{ body: { padding: 0 } }}>
        <Table<QueueRow>
          columns={queueColumns}
          dataSource={queue}
          rowKey={(r) => (isGroup(r) ? `group-${r.group}` : r.device.host)}
          pagination={false}
          // A fixed minimum rather than max-content: a device with three issues wraps its tags instead of
          // pushing Last seen and Action out of the card. Below 680px the table scrolls sideways.
          scroll={{ x: 680 }}
          locale={{
            emptyText: <span className="muted">Every device is online and within its thresholds.</span>,
          }}
        />
      </Card>

      <GroupHealthCard devices={devices} groups={groups} />

      <div className="grid-2">
        <TopUsageCard devices={devices} />
        <DiskForecastCard />
      </div>
    </div>
  )
}
