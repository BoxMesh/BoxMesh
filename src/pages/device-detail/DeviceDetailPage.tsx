import { useSuspenseQuery } from '@tanstack/react-query'
import { Alert, Button, Dropdown, Result } from 'antd'
import { Link, useParams } from 'react-router'
import { Icon } from '../../components/Icon'
import Status from '../../components/Status'
import { navItem } from '../../config/nav'
import { useNotSupported } from '../../hooks/useNotSupported'
import { deviceQuery, groupsQuery } from '../../services/queries'
import { ago } from '../../utils/time'
import DeviceOverview from './DeviceOverview'
import ProcessesCard from './ProcessesCard'

// Each remote screen takes the device in `?host=`, so these open straight onto this machine.
const REMOTE = ['/remote-terminal', '/remote-desktop', '/remote-files', '/remote-services'].map(navItem)

export default function DeviceDetailPage() {
  const { id = '' } = useParams()
  const notSupported = useNotSupported()
  const { data: device } = useSuspenseQuery(deviceQuery(id))
  const { data: groups } = useSuspenseQuery(groupsQuery)

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
        </div>
        <div className="page-actions">
          {/* The terminal is what people open a device for, so it leads; rare actions wait in the menu. */}
          {REMOTE.map((feature, i) => (
            <Link key={feature.path} to={`${feature.path}?host=${encodeURIComponent(device.host)}`}>
              <Button
                type={i === 0 ? 'primary' : 'default'}
                icon={<Icon name={feature.icon} size={14} />}
                disabled={!device.online}
              >
                {feature.label.replace('Remote ', '')}
              </Button>
            </Link>
          ))}
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                { key: 'update', label: 'Update agent' },
                { key: 'disable', label: 'Disable', danger: true },
              ],
              onClick: ({ key }) => notSupported(key === 'update' ? 'Updating agents' : 'Disabling devices'),
            }}
          >
            <Button icon={<Icon name="more" size={14} />} aria-label="More actions" />
          </Dropdown>
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

      <DeviceOverview device={device} groups={groups} />
      <ProcessesCard device={device} />
    </div>
  )
}
