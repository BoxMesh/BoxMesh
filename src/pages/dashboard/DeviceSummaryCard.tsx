import { useQueries } from '@tanstack/react-query'
import { Card, Table, Tag, type TableProps } from 'antd'
import { Link } from 'react-router'
import { Th } from '../../components/Icon'
import { t } from '../../i18n'
import { deviceMetricsQuery } from '../../services/queries'
import type { Device, MetricPoint } from '../../types/device'
import { THRESHOLDS, USAGE_ICON } from '../../utils/devices'

type Metric = 'cpu' | 'ram' | 'disk'

const mbps = (v: number) => `${v < 10 ? v.toFixed(1) : Math.round(v)} Mbps`

// The bar fills the cell behind its figure, so the two are one object: a figure beside a bar was read as the
// neighbouring column's. An offline agent's numbers are stale, so they are left blank rather than shown as current.
function Meter({ device, metric }: { device: Device; metric: Metric }) {
  if (!device.online) return <span className="muted">—</span>
  const value = device[metric]
  return (
    <span
      className={`meter-cell${value >= THRESHOLDS[metric] ? ' is-over' : ''}`}
      role="meter"
      aria-label={`${device.host} ${metric}`}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${value}%`}
    >
      <span className="meter-fill" style={{ width: `${Math.min(value, 100)}%` }} />
      <span className="meter-value">{value}%</span>
    </span>
  )
}

// `network` holds each online device's latest sample of the last hour; a device without one shows a dash.
const total = (p?: MetricPoint) => (p ? p.netIn + p.netOut : 0)

const columns = (network: Map<string, MetricPoint>): TableProps<Device>['columns'] => [
  {
    title: <Th icon="devices" label={t('Device')} />,
    key: 'device',
    sorter: (a, b) => a.host.localeCompare(b.host),
    render: (_, r) => (
      <Link to={`/devices/${encodeURIComponent(r.id)}`} className="strong queue-nowrap">
        {r.host}
      </Link>
    ),
  },
  {
    title: <Th icon="check" label={t('Status')} />,
    key: 'status',
    sorter: (a, b) => Number(b.online) - Number(a.online),
    render: (_, r) => <Tag color={r.online ? 'success' : 'default'}>{r.online ? t('Online') : t('Offline')}</Tag>,
  },
  ...(['cpu', 'ram', 'disk'] as const).map((metric) => ({
    title: <Th icon={USAGE_ICON[metric]} label={metric === 'disk' ? t('Disk') : metric.toUpperCase()} />,
    key: metric,
    sorter: (a: Device, b: Device) => a[metric] - b[metric],
    render: (_: unknown, r: Device) => <Meter device={r} metric={metric} />,
  })),
  {
    title: <Th icon="swap" label={t('Network')} />,
    key: 'network',
    sorter: (a, b) => total(network.get(a.id)) - total(network.get(b.id)),
    render: (_, r) => {
      const p = network.get(r.id)
      return p ? <span className="queue-nowrap">{t('In {in} · Out {out}', { in: mbps(p.netIn), out: mbps(p.netOut) })}</span> : <span className="muted">—</span>
    },
  },
]

/** Every device in one table, online ones first (busiest CPU first); a header click re-sorts it. */
export default function DeviceSummaryCard({ devices }: { devices: Device[] }) {
  const online = devices.filter((d) => d.online)
  const results = useQueries({ queries: online.map((d) => deviceMetricsQuery(d.id, '1h')) })
  const network = new Map(online.flatMap((d, i) => (results[i].data?.length ? [[d.id, results[i].data!.at(-1)!] as const] : [])))
  const rows = devices.toSorted((a, b) => Number(b.online) - Number(a.online) || b.cpu - a.cpu)

  return (
    <Card title={t('Device summary')} extra={<Link to="/devices">{t('All devices')}</Link>} styles={{ body: { padding: 0 } }}>
      <Table<Device>
        columns={columns(network)}
        dataSource={rows}
        rowKey={(r) => r.id}
        pagination={{ pageSize: 8, hideOnSinglePage: true, showSizeChanger: false }}
        scroll={{ x: 820 }}
        locale={{ emptyText: <span className="muted">{t('No devices')}</span> }}
      />
    </Card>
  )
}
