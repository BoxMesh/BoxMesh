import { Button, Card, Table, Tag, type TableProps } from 'antd'
import { Link } from 'react-router'
import { Th } from '../../components/Icon'
import type { Device, DeviceGroup } from '../../types/device'
import { groupHealth, type GroupHealth } from '../../utils/devices'
import HealthBar from './HealthBar'

const devicesOf = (g: GroupHealth) => `/devices?group=${encodeURIComponent(g.group.id)}`

const columns: TableProps<GroupHealth>['columns'] = [
  {
    title: <Th icon="tag" label="Group" />,
    key: 'group',
    render: (_, g) => (
      <Link to={devicesOf(g)} className="strong queue-nowrap">
        {g.group.name}
      </Link>
    ),
  },
  {
    title: <Th icon="pulse" label="Online" />,
    key: 'online',
    render: (_, g) => <span className="queue-nowrap">{`${g.online} of ${g.total}`}</span>,
  },
  {
    title: <Th icon="check" label="Health" />,
    key: 'health',
    render: (_, g) => (
      <HealthBar parts={(['healthy', 'warning', 'critical', 'offline'] as const).map((k) => ({ key: k, count: g[k] }))} />
    ),
  },
  {
    title: <Th icon="warning" label="Issues" />,
    key: 'issues',
    render: (_, g) =>
      g.total === 0 ? (
        <span className="muted">No devices</span>
      ) : g.critical + g.warning + g.offline === 0 ? (
        <Tag color="success">Healthy</Tag>
      ) : (
        <span className="queue-tags">
          {g.critical > 0 && <Tag color="error">{g.critical} critical</Tag>}
          {g.warning > 0 && <Tag color="warning">{g.warning} warning</Tag>}
          {g.offline > 0 && <Tag>{g.offline} offline</Tag>}
        </span>
      ),
  },
  {
    title: <Th icon="devices" label="Worst device" />,
    key: 'worst',
    render: (_, g) => {
      if (!g.worst) return <span className="muted">—</span>
      const [issue] = g.worst.issues
      return (
        <span className="queue-nowrap">
          <Link to={`/devices/${encodeURIComponent(g.worst.device.host)}`}>{g.worst.device.host}</Link>
          <span className="muted">
            {' · '}
            {issue.label}
            {issue.value !== '—' ? ` ${issue.value}` : ''}
          </span>
        </span>
      )
    },
  },
  {
    title: <Th icon="more" label="Action" />,
    key: 'action',
    render: (_, g) => (
      <Link to={devicesOf(g)} aria-label={`View devices in ${g.group.name}`}>
        <Button size="small">View devices</Button>
      </Link>
    ),
  },
]

/** Every group with its devices counted like the fleet, groups in trouble first. */
export default function GroupHealthCard({ devices, groups }: { devices: Device[]; groups: DeviceGroup[] }) {
  return (
    <Card title="Health by group" extra={<Link to="/groups">Groups</Link>} styles={{ body: { padding: 0 } }}>
      <Table<GroupHealth>
        className="group-health"
        columns={columns}
        dataSource={groupHealth(devices, groups)}
        rowKey={(g) => g.group.id}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 760 }}
        locale={{ emptyText: <span className="muted">No groups yet. Create one on the Groups page.</span> }}
      />
    </Card>
  )
}
