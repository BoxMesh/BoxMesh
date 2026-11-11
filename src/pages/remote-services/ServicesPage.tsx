import { useQuery } from '@tanstack/react-query'
import { App, Button, Card, Table, Tag, type TableProps } from 'antd'
import DevicePicker, { DeviceOffline, PickFirst } from '../../components/DevicePicker'
import { useDeviceParam } from '../../hooks/useDeviceParam'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { t } from '../../i18n'
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
      title: <Th icon="web" label={t('Service')} />,
      key: 'name',
      render: (_, s) => (
        <>
          <span className="strong">{s.name}</span>
          <div className="sub">{s.kind}</div>
        </>
      ),
    },
    { title: <Th icon="chip" label={t('Port')} />, key: 'port', render: (_, s) => <code>{s.port}</code> },
    {
      title: <Th icon="pulse" label={t('Status')} />,
      key: 'status',
      render: (_, s) =>
        s.status === 'running' ? <Tag color="success">{t('running')}</Tag> : <Tag color="default">{t('stopped')}</Tag>,
    },
    {
      title: <Th icon="arrow" label={t('Address')} />,
      key: 'url',
      render: (_, s) => <code>{proxyPath(host, s)}</code>,
    },
    {
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, s) => (
        <div className="row-actions">
          <Button
            size="small"
            onClick={() =>
              navigator.clipboard.writeText(`${location.origin}${proxyPath(host, s)}`).then(
                () => message.success(t('Address copied')),
                () => message.error(t('Copy failed. Select the address and copy it manually.')),
              )
            }
          >
            {t('Copy link')}
          </Button>
          <Button
            size="small"
            type="primary"
            href={proxyPath(host, s)}
            target="_blank"
            rel="noopener noreferrer"
            disabled={s.status !== 'running'}
          >
            {t('Open')}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title={t('Remote Service')}
        subtitle={t("Open web apps running on a device — Grafana, an internal dashboard — through the panel's proxy.")}
        actions={<DevicePicker devices={devices} host={host} onChange={setHost} />}
      />

      {!device ? (
        <Card>
          <PickFirst icon="web" what={t('list the web apps on')} />
        </Card>
      ) : !device.online ? (
        <Card>
          <DeviceOffline device={device} />
        </Card>
      ) : (
        <Card className="table-card" title={t('Web apps on {host}', { host: device.host })} styles={{ body: { padding: 0 } }}>
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
                      ? t("The service list didn't load. {reason}", { reason: userMessage(services.error) })
                      : t('No web app is listening on {host}.', { host: device.host })}
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
