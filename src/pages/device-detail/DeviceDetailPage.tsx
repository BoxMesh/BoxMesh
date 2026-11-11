import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Button, Card, Result, Tabs } from 'antd'
import { Link, useParams, useSearchParams } from 'react-router'
import { Icon } from '../../components/Icon'
import StatusButton from '../../components/StatusButton'
import { navItem } from '../../config/nav'
import { t } from '../../i18n'
import { deviceQuery, groupsQuery, processesQuery } from '../../services/queries'
import DeviceInfo from './DeviceInfo'
import PerformancePanel from './PerformancePanel'
import ProcessesPanel from './ProcessesPanel'

// Each remote screen takes the device in `?host=`, so these open straight onto this machine.
const REMOTE = [
  { path: '/remote-terminal', short: t('Terminal') },
  { path: '/remote-desktop', short: t('Desktop') },
  { path: '/remote-files', short: t('Files') },
  { path: '/remote-services', short: t('Service') },
].map(({ path, short }) => ({ ...navItem(path), short }))

type Tab = 'processes' | 'performance'

export default function DeviceDetailPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const { data: device } = useSuspenseQuery(deviceQuery(id))
  const { data: groups } = useSuspenseQuery(groupsQuery)
  // Shares the Processes tab's cache for the count; without its own interval it doesn't poll on the Performance tab.
  const { data: processes } = useQuery({ ...processesQuery(id), enabled: Boolean(device?.online) })

  if (!device) {
    return (
      <Result
        status="404"
        title={t('Device not found')}
        subTitle={t('No enrolled device is named {id}.', { id })}
        extra={<Link to="/devices">{t('Back to devices')}</Link>}
      />
    )
  }

  const tab: Tab = params.get('tab') === 'performance' ? 'performance' : 'processes'
  const openTab = (key: string) => setParams(key === 'performance' ? { tab: key } : {}, { replace: true })

  return (
    <div className="stack">
      <div className="page-header">
        <div className="title-row">
          <Link to="/devices" className="icon-btn" aria-label={t('Back to devices')}>
            <Icon name="back" />
          </Link>
          <h1 style={{ margin: 0 }}>{device.host}</h1>
          <span className="muted">{device.alias}</span>
          <StatusButton device={device} />
        </div>
        <div className="page-actions">
          {/* The terminal is what people open a device for, so it leads. */}
          {REMOTE.map((feature, i) => (
            <Link key={feature.path} to={`${feature.path}?host=${encodeURIComponent(device.host)}`}>
              <Button
                type={i === 0 ? 'primary' : 'default'}
                icon={<Icon name={feature.icon} size={14} />}
                disabled={!device.online}
              >
                {feature.short}
              </Button>
            </Link>
          ))}
        </div>
      </div>


      <DeviceInfo device={device} groups={groups} />

      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <Tabs
          className="device-tabs"
          activeKey={tab}
          onChange={openTab}
          destroyOnHidden
          items={[
            {
              key: 'processes',
              label: device.online && processes ? t('Processes ({n})', { n: processes.length }) : t('Processes'),
              children: <ProcessesPanel device={device} />,
            },
            { key: 'performance', label: t('Performance'), children: <PerformancePanel device={device} /> },
          ]}
        />
      </Card>
    </div>
  )
}
