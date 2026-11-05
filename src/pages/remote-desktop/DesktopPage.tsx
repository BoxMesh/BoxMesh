import { useMutation } from '@tanstack/react-query'
import { App, Button, Card, Segmented, Switch, Tag } from 'antd'
import { useState } from 'react'
import DevicePicker, { DeviceOffline, PickFirst } from '../../components/DevicePicker'
import { Icon } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { useDeviceParam } from '../../hooks/useDeviceParam'
import { startDesktop } from '../../services/remoteService'
import type { Device } from '../../types/device'
import type { DesktopSession } from '../../types/remote'
import { ago } from '../../utils/time'

const QUALITY: DesktopSession['quality'][] = ['auto', 'high', 'balanced', 'low']

export default function DesktopPage() {
  const { devices, host, device, setHost } = useDeviceParam()

  return (
    <div className="stack">
      <PageHeader
        title="Remote Desktop"
        subtitle="See and control a device's screen over its agent tunnel."
        actions={<DevicePicker devices={devices} host={host} onChange={setHost} />}
      />
      {!device ? (
        <Card>
          <PickFirst icon="desktop" what="view the screen of" />
        </Card>
      ) : !device.online ? (
        <Card>
          <DeviceOffline device={device} />
        </Card>
      ) : (
        // Keyed by host: switching device ends the session rather than relabelling it.
        <Viewer key={device.host} device={device} />
      )}
    </div>
  )
}

function Viewer({ device }: { device: Device }) {
  const { message } = App.useApp()
  const [session, setSession] = useState<DesktopSession | null>(null)
  const [quality, setQuality] = useState<DesktopSession['quality']>('auto')
  const [clipboard, setClipboard] = useState(true)

  const connect = useMutation({
    mutationFn: () => startDesktop(device.host),
    onSuccess: setSession,
    onError: (error) => message.error(error.message),
  })

  if (!session) {
    return (
      <Card>
        <div className="empty">
          <span>{device.host} is reachable. Connecting opens a screen session and records it in the audit log.</span>
          <Button type="primary" loading={connect.isPending} onClick={() => connect.mutate()}>
            Connect to {device.host}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      title={
        <>
          {device.host} <Tag color="success">Live</Tag>
        </>
      }
      extra={
        <span className="muted">
          {session.resolution} · {session.fps} fps · started {ago(session.startedAt)}
        </span>
      }
      styles={{ body: { padding: 0 } }}
    >
      <div className="screen-bar">
        <Segmented<DesktopSession['quality']> aria-label="Quality" options={QUALITY} value={quality} onChange={setQuality} />
        <label className="screen-toggle">
          <Switch size="small" checked={clipboard} onChange={setClipboard} />
          Clipboard sync
        </label>
        <span className="screen-spacer" />
        <Button size="small" onClick={() => message.info('Ctrl+Alt+Del sent')}>
          Ctrl+Alt+Del
        </Button>
        <Button size="small" onClick={() => message.info('Screenshot saved to your downloads')}>
          Screenshot
        </Button>
        <Button
          size="small"
          danger
          onClick={() => {
            setSession(null)
            message.success('Session ended')
          }}
        >
          Disconnect
        </Button>
      </div>

      {/* Stand-in for the agent's video stream: the demo has no frames, so the frame states what the
          session is instead of pretending to be a picture of a desktop. */}
      <div className="screen" role="img" aria-label={`Screen of ${device.host}, ${session.resolution}`}>
        <div className="screen-inner">
          <Icon name="desktop" size={44} />
          <div className="screen-host">{device.host}</div>
          <div className="screen-note">
            {device.os} {device.osVersion} · {session.resolution}
          </div>
          <div className="screen-note muted">Demo mode has no video stream. A real session draws frames here.</div>
        </div>
        <div className="screen-taskbar">
          <span>{device.alias}</span>
          <span>
            {quality} quality · clipboard {clipboard ? 'on' : 'off'}
          </span>
        </div>
      </div>
    </Card>
  )
}
