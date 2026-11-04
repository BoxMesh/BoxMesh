import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Alert, Button, Result, Tabs, Tag } from 'antd'
import { Link, useParams, useSearchParams } from 'react-router'
import { Icon } from '../../components/Icon'
import Status from '../../components/Status'
import { navItem } from '../../config/nav'
import { useNotSupported } from '../../hooks/useNotSupported'
import { connectionHistoryQuery, deviceQuery } from '../../services/queries'
import { ago } from '../../utils/time'
import ConnectionCard from './ConnectionCard'
import DeviceOverview from './DeviceOverview'

// Each remote screen takes the device in `?host=`, so these open straight onto this machine.
const REMOTE = ['/remote-terminal', '/remote-desktop', '/remote-files', '/remote-services'].map(navItem)

export default function DeviceDetailPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const notSupported = useNotSupported()
  // Start the history request alongside the device request instead of after it.
  usePrefetchQuery(connectionHistoryQuery(id))
  const { data: device } = useSuspenseQuery(deviceQuery(id))

  if (!device) {
    return (
      <Result
        status="404"
        title="Device not found"
        subTitle={`No enrolled device is named ${id}.`}
        extra={<Link to="/devices">Back to devices</Link>}
      />
    )
  }

  const tab = params.get('tab') ?? 'overview'
  const openTab = (key: string) => setParams(key === 'overview' ? {} : { tab: key }, { replace: true })

  return (
    <div className="stack">
      <div className="page-header">
        <div className="title-row">
          <Link to="/devices" className="icon-btn" aria-label="Back to devices">
            <Icon name="back" />
          </Link>
          <h1 style={{ margin: 0 }}>{device.host}</h1>
          <span className="muted">{device.alias}</span>
          <Status online={device.online} />
          <Tag color="processing">{device.group}</Tag>
        </div>
        <div className="page-actions">
          {REMOTE.map((feature) => (
            <Link key={feature.path} to={`${feature.path}?host=${encodeURIComponent(device.host)}`}>
              <Button icon={<Icon name={feature.icon} size={14} />} disabled={!device.online}>
                {feature.label.replace('Remote ', '')}
              </Button>
            </Link>
          ))}
          <Button onClick={() => notSupported('Updating agents')}>Update agent</Button>
          <Button danger onClick={() => notSupported('Disabling devices')}>
            Disable
          </Button>
        </div>
      </div>

      {!device.online ? (
        <Alert
          type="info"
          showIcon
          title={`${device.host} is offline`}
          description={`Its last heartbeat was ${ago(device.lastSeen)}. The details below are from that moment and update when the agent reconnects.`}
        />
      ) : null}

      <Tabs
        activeKey={tab}
        onChange={openTab}
        items={[
          { key: 'overview', label: 'Overview', children: <DeviceOverview device={device} /> },
          { key: 'connection', label: 'Connection', children: <ConnectionCard device={device} /> },
        ]}
      />
    </div>
  )
}
