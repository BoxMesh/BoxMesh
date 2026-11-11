import { useMutation } from '@tanstack/react-query'
import { App, Button, Card, Segmented, Switch, Tag } from 'antd'
import { useState } from 'react'
import DevicePicker, { DeviceOffline, PickFirst } from '../../components/DevicePicker'
import { Icon } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { useDeviceParam } from '../../hooks/useDeviceParam'
import { useNotSupported } from '../../hooks/useNotSupported'
import { t } from '../../i18n'
import { startDesktop } from '../../services/remoteService'
import type { Device } from '../../types/device'
import type { DesktopSession } from '../../types/remote'
import { ago } from '../../utils/time'

const QUALITY_LABEL = (): Record<DesktopSession['quality'], string> => ({
  auto: t('auto'),
  high: t('high'),
  balanced: t('balanced'),
  low: t('low'),
})
const QUALITY = () => Object.entries(QUALITY_LABEL()).map(([value, label]) => ({ value: value as DesktopSession['quality'], label }))

export default function DesktopPage() {
  const { devices, host, device, setHost } = useDeviceParam()

  return (
    <div className="stack">
      <PageHeader
        title={t('Remote Desktop')}
        subtitle={t("See and control a device's screen over its agent tunnel.")}
        actions={<DevicePicker devices={devices} host={host} onChange={setHost} />}
      />
      {!device ? (
        <Card>
          <PickFirst icon="desktop" what={t('view the screen of')} />
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
  const notSupported = useNotSupported()
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
          <span>
            {t('{host} is reachable. Connecting opens a screen session and records it in the audit log.', { host: device.host })}
          </span>
          <Button type="primary" loading={connect.isPending} onClick={() => connect.mutate()}>
            {t('Connect to {host}', { host: device.host })}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      title={
        <>
          {device.host} <Tag color="success">{t('Live')}</Tag>
        </>
      }
      extra={
        <span className="muted">
          {session.resolution} · {session.fps} fps · {t('started {when}', { when: ago(session.startedAt) })}
        </span>
      }
      styles={{ body: { padding: 0 } }}
    >
      <div className="screen-bar">
        <Segmented<DesktopSession['quality']> aria-label={t('Quality')} options={QUALITY()} value={quality} onChange={setQuality} />
        <label className="screen-toggle">
          <Switch size="small" checked={clipboard} onChange={setClipboard} />
          {t('Clipboard sync')}
        </label>
        <span className="screen-spacer" />
        <Button size="small" onClick={() => notSupported(t('Sending Ctrl+Alt+Del'))}>
          Ctrl+Alt+Del
        </Button>
        <Button size="small" onClick={() => notSupported(t('Screenshots'))}>
          {t('Screenshot')}
        </Button>
        <Button
          size="small"
          onClick={() => {
            setSession(null)
            message.success(t('Session ended'))
          }}
        >
          {t('Disconnect')}
        </Button>
      </div>

      {/* Stand-in for the agent's video stream: the demo has no frames, so the frame states what the
          session is instead of pretending to be a picture of a desktop. */}
      <div
        className="screen"
        role="img"
        aria-label={t('Screen of {host}, {resolution}', { host: device.host, resolution: session.resolution })}
      >
        <div className="screen-inner">
          <Icon name="desktop" size={44} />
          <div className="screen-host">{device.host}</div>
          <div className="screen-note">
            {device.os} {device.osVersion} · {session.resolution}
          </div>
          <div className="screen-note muted">{t('Demo mode has no video stream. A real session draws frames here.')}</div>
        </div>
        <div className="screen-taskbar">
          <span>{device.alias}</span>
          <span>
            {clipboard
              ? t('{quality} quality · clipboard on', { quality: QUALITY_LABEL()[quality] })
              : t('{quality} quality · clipboard off', { quality: QUALITY_LABEL()[quality] })}
          </span>
        </div>
      </div>
    </Card>
  )
}
