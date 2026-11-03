import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Alert, Button, Result, Tabs, Tag, Tooltip } from 'antd'
import { Link, useParams, useSearchParams } from 'react-router'
import { Icon } from '../../components/Icon'
import NotSupported from '../../components/NotSupported'
import Status from '../../components/Status'
import { navItem } from '../../config/nav'
import { useNotSupported } from '../../hooks/useNotSupported'
import { connectionHistoryQuery, deviceQuery } from '../../services/queries'
import { ago } from '../../utils/time'
import ConnectionCard from './ConnectionCard'
import DeviceOverview from './DeviceOverview'

const terminal = navItem('/terminal')
const desktop = navItem('/desktop')

// Tabs for modules that aren't built yet: muted, and their page leads back to Overview.
const SOON_TABS = [
  { key: 'terminal', label: 'Terminal', feature: terminal },
  { key: 'desktop', label: 'Desktop', feature: desktop },
  { key: 'files', label: 'Files', feature: navItem('/files') },
  { key: 'web', label: 'Remote Service', feature: navItem('/web-apps') },
]

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
          {[terminal, desktop].map((feature) => (
            <Tooltip key={feature.path} title={`${feature.label} isn't available yet`}>
              <Button disabled>{feature === terminal ? 'Open terminal' : 'Remote desktop'}</Button>
            </Tooltip>
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
          ...SOON_TABS.map(({ key, label, feature }) => ({
            key,
            label: <span className="tab-soon">{label}</span>,
            children: <NotSupported feature={feature} onBack={() => openTab('overview')} />,
          })),
          { key: 'connection', label: 'Connection', children: <ConnectionCard device={device} /> },
        ]}
      />
    </div>
  )
}
