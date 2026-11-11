import { Card, Descriptions, type DescriptionsProps } from 'antd'
import AgentVersion from '../../components/AgentVersion'
import DeviceGroups from '../../components/DeviceGroups'
import type { Device, DeviceGroup } from '../../types/device'
import { formatDateTime } from '../../utils/time'

export default function DeviceInfo({ device: d, groups }: { device: Device; groups: DeviceGroup[] }) {
  const info: DescriptionsProps['items'] = [
    { key: 'host', label: 'Hostname', children: d.host },
    { key: 'os', label: 'Operating system', children: `${d.os} ${d.osVersion} · ${d.osArchitecture}` },
    { key: 'ip', label: 'IP', children: d.ip },
    { key: 'mac', label: 'MAC', children: <code>{d.mac}</code> },
    { key: 'agent', label: 'Agent version', children: <AgentVersion device={d} /> },
    { key: 'uptime', label: 'Uptime', children: d.hardware.uptime },
    { key: 'enrolled', label: 'Enrolled at', children: formatDateTime(d.enrolledAt) },
    { key: 'groups', label: 'Groups', children: <DeviceGroups device={d} groups={groups} /> },
  ]

  return (
    <Card title="Device information">
      <Descriptions layout="vertical" colon={false} column={{ xs: 2, sm: 2, lg: 3, xl: 4 }} items={info} />
    </Card>
  )
}
