import { useQuery } from '@tanstack/react-query'
import { App, Button, Card, Table, Tag, type TableProps } from 'antd'
import DevicePicker, { DeviceOffline, PickFirst } from '../../components/DevicePicker'
import { useDeviceParam } from '../../hooks/useDeviceParam'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { userMessage } from '../../services/http'
import { servicesQuery } from '../../services/queries'
import type { RemoteService } from '../../types/remote'

/** The panel reverse-proxies each app, so the browser never needs a route to the device itself. */
const proxyPath = (host: string, service: RemoteService) => `/web/${encodeURIComponent(host)}/${service.path}/`

export default function ServicesPage() {
  const { devices, host, device, setHost } = useDeviceParam()
  const { message } = App.useApp()
  const services = useQuery({ ...servicesQuery(host), enabled: Boolean(device?.online) })

  const columns: TableProps<RemoteService>['columns'] = [
    {
      title: <Th icon="web" label="Service" />,
      key: 'name',
      render: (_, s) => (
        <>
          <span className="strong">{s.name}</span>
          <div className="sub">{s.kind}</div>
        </>
      ),
    },
    { title: <Th icon="chip" label="Port" />, key: 'port', render: (_, s) => <code>{s.port}</code> },
    {
      title: <Th icon="pulse" label="Status" />,
      key: 'status',
      render: (_, s) => <Tag color={s.status === 'running' ? 'success' : 'default'}>{s.status}</Tag>,
    },
    {
      title: <Th icon="arrow" label="Address" />,
      key: 'url',
      render: (_, s) => <code>{proxyPath(host, s)}</code>,
    },
    {
      title: <Th icon="more" label="Actions" />,
      key: 'actions',
      render: (_, s) => (
        <div className="row-actions">
          <Button
            size="small"
            onClick={() =>
              navigator.clipboard.writeText(`${location.origin}${proxyPath(host, s)}`).then(
                () => message.success('Address copied'),
                () => message.error('Copy failed. Select the address and copy it manually.'),
              )
            }
          >
            Copy link
          </Button>
          <Button
            size="small"
            type="primary"
            href={proxyPath(host, s)}
            target="_blank"
            rel="noopener noreferrer"
            disabled={s.status !== 'running'}
          >
            Open
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Remote Service"
        subtitle="Open web apps running on a device — Grafana, an internal dashboard — through the panel's proxy."
        actions={<DevicePicker devices={devices} host={host} onChange={setHost} />}
      />

      {!device ? (
        <Card>
          <PickFirst icon="web" what="list the web apps on" />
        </Card>
      ) : !device.online ? (
        <Card>
          <DeviceOffline device={device} />
        </Card>
      ) : (
        <Card className="table-card" title={`Web apps on ${device.host}`} styles={{ body: { padding: 0 } }}>
          <Table<RemoteService>
            columns={columns}
            dataSource={services.data}
            loading={services.isPending}
            rowKey="path"
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: (
                <div className="empty">
                  <Icon name="web" size={28} />
                  <span>
                    {services.error
                      ? `The service list didn't load. ${userMessage(services.error)}`
                      : `No web app is listening on ${device.host}.`}
                  </span>
                </div>
              ),
            }}
          />
        </Card>
      )}
    </div>
  )
}
