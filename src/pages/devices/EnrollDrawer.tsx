import { useQuery } from '@tanstack/react-query'
import { App, Button, Checkbox, Drawer, Segmented, Select, Spin } from 'antd'
import { useState } from 'react'
import { useNotSupported } from '../../hooks/useNotSupported'
import { pendingEnrollmentsQuery } from '../../services/queries'
import type { OsFamily } from '../../types/device'

const INSTALL: Record<OsFamily, string> = {
  Windows: 'edgeagent.exe install `\n  --server https://[VPS_DOMAIN] `\n  --token [ENROLLMENT_TOKEN]',
  Linux: 'sudo ./edgeagent install \\\n  --server https://[VPS_DOMAIN] \\\n  --token [ENROLLMENT_TOKEN]',
}

const LIFETIMES = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
]

export default function EnrollDrawer({ open, onClose, groups }: { open: boolean; onClose: () => void; groups: string[] }) {
  const { message } = App.useApp()
  const notSupported = useNotSupported()
  const [os, setOs] = useState<OsFamily>('Windows')
  const pending = useQuery({ ...pendingEnrollmentsQuery, enabled: open })

  const copy = () =>
    navigator.clipboard.writeText(INSTALL[os]).then(
      () => message.success('Command copied'),
      () => message.error('Copy failed. Select the command and copy it manually.'),
    )

  return (
    <Drawer title="Enroll new agent" open={open} onClose={onClose} size={520}>
      <ol className="steps">
        <li>
          <h3>
            <span className="step-num">1</span>Create an enrollment token
          </h3>
          <label className="field">
            <span>Token lifetime</span>
            <Select defaultValue="24h" options={LIFETIMES} />
          </label>
          <label className="field">
            <span>Default group</span>
            <Select defaultValue={groups[0]} options={groups.map((g) => ({ value: g, label: g }))} />
          </label>
          <Checkbox defaultChecked>Require admin approval before issuing certificates</Checkbox>
          <Button type="primary" onClick={() => notSupported('Creating enrollment tokens')}>
            Create token
          </Button>
        </li>
        <li>
          <h3>
            <span className="step-num">2</span>Install EdgeAgent on the device
          </h3>
          <Segmented<OsFamily> aria-label="Operating system" options={['Windows', 'Linux']} value={os} onChange={setOs} />
          <pre className="code">{INSTALL[os]}</pre>
          <Button onClick={copy}>Copy command</Button>
        </li>
        <li>
          <h3>
            <span className="step-num">3</span>Approve the agent
          </h3>
          <p className="muted" style={{ margin: 0 }}>
            The agent creates its private key and sends a certificate request. Once approved, EdgePanel signs the
            certificate and opens the mTLS tunnel.
          </p>
          {pending.isPending ? <Spin /> : null}
          {pending.error ? <p className="muted">Couldn't load waiting agents: {pending.error.message}</p> : null}
          {pending.data?.length === 0 ? <p className="muted">No agents are waiting for approval.</p> : null}
          {pending.data?.map((p) => (
            <div key={p.host} className="pending">
              <span>
                <b>{p.host}</b> · {p.os} · {p.ip}
              </span>
              <span className="pending-actions">
                <Button type="primary" onClick={() => notSupported('Approving agents')}>
                  Approve
                </Button>
                <Button danger onClick={() => notSupported('Rejecting agents')}>
                  Reject
                </Button>
              </span>
            </div>
          ))}
        </li>
      </ol>
    </Drawer>
  )
}
