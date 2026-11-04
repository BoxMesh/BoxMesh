import { useSuspenseQueries } from '@tanstack/react-query'
import { Alert, Card, Progress, Segmented, Statistic, Table, Tag, Timeline, type TableProps } from 'antd'
import { Fragment, useState, useTransition } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { tone } from '../../config/theme'
import { devicesQuery, recentActivityQuery, remoteSessionsQuery, resourceUsageQuery } from '../../services/queries'
import type { TimeRange } from '../../types/dashboard'
import type { Device, Issue } from '../../types/device'
import { summarize } from '../../utils/devices'
import { ago, daysLeft, daysLeftLabel } from '../../utils/time'

type AttentionRow = Issue & { device: Device }

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
]
const RESOURCE_WARN = 70
const CERT_NAMES_SHOWN = 3
const RESOURCES = [
  { key: 'cpu', label: 'CPU' },
  { key: 'ram', label: 'RAM' },
  { key: 'disk', label: 'Disk' },
] as const

const attentionColumns: TableProps<AttentionRow>['columns'] = [
  { title: 'Device', key: 'device', render: (_, r) => <Link to={`/devices/${r.device.host}`}>{r.device.host}</Link> },
  { title: 'Issue', key: 'issue', render: (_, r) => <Tag color={r.level}>{r.label}</Tag> },
  { title: 'Value', dataIndex: 'value' },
  { title: 'Last seen', key: 'seen', render: (_, r) => ago(r.device.lastSeen) },
]

export default function DashboardPage() {
  const [range, setRange] = useState<TimeRange>('24h')
  // A transition keeps the current numbers on screen while the new range loads, instead of the page spinner.
  const [, startTransition] = useTransition()
  const [{ data: devices }, { data: resources }, { data: remoteSessions }, { data: activity }] = useSuspenseQueries({
    queries: [devicesQuery, resourceUsageQuery(range), remoteSessionsQuery, recentActivityQuery],
  })
  const s = summarize(devices)
  const certs = s.expiringCerts

  return (
    <div className="stack">
      <PageHeader
        title="Dashboard"
        subtitle="Agents, resources and health at a glance"
        actions={
          <Segmented<TimeRange>
            aria-label="Time range"
            options={RANGE_OPTIONS}
            value={range}
            onChange={(value) => startTransition(() => setRange(value))}
          />
        }
      />

      {certs.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          icon={<Icon name="warning" />}
          title={
            <>
              {certs.length === 1
                ? 'An agent certificate expires within 14 days: '
                : `${certs.length} agent certificates expire within 14 days: `}
              {certs.slice(0, CERT_NAMES_SHOWN).map((d, i) => (
                <Fragment key={d.host}>
                  {i > 0 ? ', ' : null}
                  <Link to={`/devices/${d.host}`}>{d.host}</Link> ({daysLeftLabel(daysLeft(d.certExpires))})
                </Fragment>
              ))}
              {certs.length > CERT_NAMES_SHOWN ? ` and ${certs.length - CERT_NAMES_SHOWN} more` : null}
            </>
          }
        />
      ) : null}

      <div className="grid-stats">
        <StatCard to="/devices" title="Total devices" value={s.total} note={`Windows ${s.windows} · Linux ${s.total - s.windows}`} />
        <StatCard
          to="/devices?status=online"
          title="Agents online"
          value={s.online}
          color={tone.positive}
          note={`${s.total ? Math.round((s.online / s.total) * 1000) / 10 : 0}% of all agents`}
        />
        <StatCard
          to="/devices?status=offline"
          title="Agents offline"
          value={s.offline}
          color={tone.muted}
          note={`${s.staleOffline} without heartbeat for over 10 min`}
        />
      </div>

      <div className="grid-2">
        <Card title="Average resources">
          {RESOURCES.map(({ key, label }) => {
            const value = resources[key]
            const high = value > RESOURCE_WARN
            return (
              <div key={key} className="meter">
                <div className="meter-label">
                  <span>{label}</span>
                  <span>
                    {value}%{high ? ` · above ${RESOURCE_WARN}% threshold` : ''}
                  </span>
                </div>
                <Progress
                  percent={value}
                  showInfo={false}
                  size={['100%', 8]}
                  strokeColor={high ? tone.warning : tone.positive}
                  aria-label={label}
                />
              </div>
            )
          })}
        </Card>
        <Card title="Connection status">
          <div className="kv">
            <div>
              <div className="muted">Open tunnel sessions</div>
              <div className="kv-value">{s.online}</div>
            </div>
            <div>
              <div className="muted">Average latency</div>
              <div className="kv-value">{s.avgLatency} ms</div>
            </div>
            <div>
              <div className="muted">Reconnects in 24 h</div>
              <div className="kv-value">{remoteSessions.reconnects24h}</div>
            </div>
            <div>
              <div className="muted">Active remote sessions</div>
              <div>{remoteSessions.summary}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card
          title="Devices needing attention"
          extra={<Link to="/devices">All devices</Link>}
          styles={{ body: { padding: 0 } }}
        >
          <Table<AttentionRow>
            columns={attentionColumns}
            dataSource={s.attention}
            rowKey={(r) => `${r.device.host}-${r.kind}`}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <span className="muted">Every device is online and within its thresholds.</span> }}
          />
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
  )
}

function StatCard({ to, title, value, note, color }: { to: string; title: string; value: number; note: string; color?: string }) {
  return (
    <Link to={to} className="stat-link">
      <Card>
        <Statistic title={title} value={value} styles={{ content: { color, lineHeight: '38px', fontWeight: 600 } }} />
        <div className="sub">{note}</div>
      </Card>
    </Link>
  )
}
