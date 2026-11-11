import { Tooltip } from 'antd'
import type { Device } from '../types/device'
import { t } from '../i18n'
import { Icon } from './Icon'

/** The agent version, with a warning icon and tooltip when a newer agent has been released. */
export default function AgentVersion({ device }: { device: Pick<Device, 'agentVersion' | 'agentOutdated'> }) {
  if (!device.agentOutdated) return <>{device.agentVersion}</>
  return (
    <Tooltip title={t('A newer agent has been released')}>
      {/* role + label: the icon is the whole message, so it has to reach a screen reader too. */}
      <span className="agent-outdated" role="img" aria-label={t('{version}, update available', { version: device.agentVersion })}>
        {device.agentVersion}
        <Icon name="warning" size={13} />
      </span>
    </Tooltip>
  )
}
