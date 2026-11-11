import { Result, Select } from 'antd'
import type { Device } from '../types/device'
import { tone } from '../config/theme'
import { Icon, type IconName } from './Icon'

export default function DevicePicker({
  devices,
  host,
  onChange,
}: {
  devices: Device[]
  host: string
  onChange: (host: string) => void
}) {
  return (
    <Select
      value={host || undefined}
      onChange={onChange}
      placeholder="Pick a device"
      showSearch
      optionFilterProp="label"
      style={{ minWidth: 260 }}
      aria-label="Device"
      options={devices.map((d) => ({
        value: d.host,
        label: `${d.host} · ${d.alias}`,
        title: d.online ? 'Online' : 'Offline',
      }))}
      optionRender={({ data }) => {
        const device = devices.find((d) => d.host === data.value)!
        return (
          <span className="picker-option">
            <span className="status-dot" style={{ background: device.online ? tone.positive : tone.disabled }} />
            <span className="strong">{device.host}</span>
            <span className="muted">{device.alias}</span>
          </span>
        )
      }}
    />
  )
}

/** Shown by every remote screen until a device is chosen. */
export function PickFirst({ icon, what }: { icon: IconName; what: string }) {
  return (
    <Result
      icon={
        <span className="soon-icon">
          <Icon name={icon} size={36} />
        </span>
      }
      title={`Pick a device to ${what}`}
      subTitle="Choose one from the list above, or open a device and use its tab."
    />
  )
}

/** Shown when the chosen device has no tunnel: a remote action cannot reach it. */
export function DeviceOffline({ device }: { device: Device }) {
  return (
    <Result
      icon={
        <span className="soon-icon">
          <Icon name="devices" size={36} />
        </span>
      }
      title={`${device.host} is offline`}
      subTitle="Its agent has no open tunnel, so remote actions can't reach it. This screen works again when the agent reconnects."
    />
  )
}
