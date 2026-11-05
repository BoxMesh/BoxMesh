import { Button, Card, Descriptions, Form, InputNumber, Tag, type DescriptionsProps } from 'antd'
import { useNotSupported } from '../../hooks/useNotSupported'
import type { Device } from '../../types/device'
import { THRESHOLDS } from '../../utils/devices'
import { daysLeft, daysLeftLabel, formatDate, formatDateTime } from '../../utils/time'
import ConnectionCard from './ConnectionCard'

export default function DeviceOverview({ device: d }: { device: Device }) {
  const notSupported = useNotSupported()
  const certDays = daysLeft(d.certExpires)
  const info: DescriptionsProps['items'] = [
    { key: 'host', label: 'Hostname', children: d.host },
    { key: 'os', label: 'Operating system', children: `${d.os} ${d.osVersion} · ${d.osArchitecture}` },
    { key: 'ip', label: 'IP', children: d.ip },
    { key: 'mac', label: 'MAC', children: <code>{d.mac}</code> },
    { key: 'cpu', label: 'CPU', children: d.hardware.cpu },
    { key: 'ram', label: 'RAM', children: d.hardware.ram },
    { key: 'disk', label: 'Disk', children: d.hardware.disk },
    { key: 'uptime', label: 'Uptime', children: d.hardware.uptime },
    {
      key: 'agent',
      label: 'Agent version',
      children: (
        <>
          {d.agentVersion} {d.agentOutdated ? <Tag color="warning">outdated</Tag> : null}
        </>
      ),
    },
    {
      key: 'cert',
      label: 'Certificate',
      children: (
        <>
          Expires {formatDate(d.certExpires)} {certDays <= 14 ? <Tag color="warning">{daysLeftLabel(certDays)}</Tag> : null}
        </>
      ),
    },
    { key: 'enrolled', label: 'Enrolled at', children: formatDateTime(d.enrolledAt) },
    {
      key: 'tag',
      label: 'Tag',
      children: (
        <>
          <Tag>{d.tag}</Tag>
          <Button size="small" type="dashed" onClick={() => notSupported('Editing tags')}>
            + Tag
          </Button>
        </>
      ),
    },
  ]

  return (
    <div className="stack">
      <Card title="Device information">
        <Descriptions layout="vertical" colon={false} column={{ xs: 1, sm: 2, lg: 3, xl: 4 }} items={info} />
      </Card>
      <div className="grid-2">
        <ConnectionCard device={d} />
        <Card title="Alert thresholds" extra={<span className="muted">Applies to this device only</span>}>
          <Form layout="vertical" initialValues={{ ...THRESHOLDS, sustained: 5 }} onFinish={() => notSupported('Saving thresholds')}>
            <div className="kv">
              <Form.Item label="CPU above (%)" name="cpu">
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="RAM above (%)" name="ram">
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Disk above (%)" name="disk">
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Sustained for (min)" name="sustained">
                <InputNumber min={1} max={120} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <Button type="primary" htmlType="submit">
              Save thresholds
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  )
}
