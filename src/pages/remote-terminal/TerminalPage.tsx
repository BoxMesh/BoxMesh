import { useMutation } from '@tanstack/react-query'
import { Button, Card, Input, Segmented } from 'antd'
import { useEffect, useRef, useState } from 'react'
import DevicePicker, { DeviceOffline, PickFirst } from '../../components/DevicePicker'
import { Icon } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import Status from '../../components/Status'
import { useDeviceParam } from '../../hooks/useDeviceParam'
import { runCommand } from '../../services/remoteService'
import type { Device, OsFamily } from '../../types/device'
import type { Shell, ShellResult } from '../../types/remote'

const SHELLS: Record<OsFamily, Shell[]> = { Windows: ['PowerShell', 'CMD'], Linux: ['Bash'] }

const promptFor = (shell: Shell, host: string) =>
  shell === 'Bash' ? `root@${host.toLowerCase()}:~#` : shell === 'CMD' ? 'C:\\>' : 'PS C:\\>'

export default function TerminalPage() {
  const { devices, host, device, setHost } = useDeviceParam()

  return (
    <div className="stack">
      <PageHeader
        title="Remote Terminal"
        subtitle="Run a command through the device's own tunnel. Every command is written to the audit log."
        actions={
          <>
            <DevicePicker devices={devices} host={host} onChange={setHost} />
            {device ? <Status online={device.online} /> : null}
          </>
        }
      />
      {!device ? (
        <Card>
          <PickFirst icon="terminal" what="open a terminal on" />
        </Card>
      ) : !device.online ? (
        <Card>
          <DeviceOffline device={device} />
        </Card>
      ) : (
        // Keyed by host: another device is another session, and its scrollback starts empty.
        <Session key={device.host} device={device} />
      )}
    </div>
  )
}

function Session({ device }: { device: Device }) {
  const shells = SHELLS[device.osFamily]
  const [shell, setShell] = useState<Shell>(shells[0])
  const [draft, setDraft] = useState('')
  const [lines, setLines] = useState<ShellResult[]>([])
  // Commands already sent, newest last; ArrowUp walks back through them like a real shell.
  const [recall, setRecall] = useState<number | null>(null)
  const pane = useRef<HTMLDivElement>(null)

  const run = useMutation({
    mutationFn: (command: string) => runCommand(device.host, shell, command),
    onSuccess: (result) => setLines((prev) => [...prev, result]),
    onError: (error, command) =>
      setLines((prev) => [...prev, { command, output: error.message, exitCode: 1, at: new Date().toISOString() }]),
  })

  useEffect(() => {
    pane.current?.scrollTo({ top: pane.current.scrollHeight })
  }, [lines, run.isPending])

  const submit = () => {
    if (!draft.trim() || run.isPending) return
    run.mutate(draft)
    setDraft('')
    setRecall(null)
  }

  const history = lines.map((l) => l.command)
  const stepHistory = (delta: number) => {
    if (history.length === 0) return
    const at = recall === null ? history.length : recall
    const next = Math.min(history.length, Math.max(0, at + delta))
    setRecall(next === history.length ? null : next)
    setDraft(next === history.length ? '' : history[next])
  }

  const prompt = promptFor(shell, device.host)

  return (
    <Card
      title={`${device.host} · ${device.os}`}
      extra={
        <Segmented<Shell> aria-label="Shell" options={shells} value={shell} onChange={setShell} disabled={run.isPending} />
      }
      styles={{ body: { padding: 0 } }}
    >
      <div className="terminal" ref={pane}>
        <div className="terminal-intro">
          Connected to {device.host} over the agent tunnel. Try <code>whoami</code>, <code>uptime</code>, <code>df</code>,{' '}
          <code>ipconfig</code> or <code>get-service</code>.
        </div>
        {lines.map((line, i) => (
          <div key={`${line.at}-${i}`}>
            <div className="terminal-echo">
              <span className="terminal-prompt">{prompt}</span> {line.command}
            </div>
            {line.output ? (
              <pre className={line.exitCode === 0 ? 'terminal-out' : 'terminal-out terminal-bad'}>{line.output}</pre>
            ) : null}
          </div>
        ))}
        {run.isPending ? <div className="terminal-echo muted">Running…</div> : null}
      </div>
      <div className="terminal-input">
        <span className="terminal-prompt">{prompt}</span>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPressEnter={submit}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              stepHistory(-1)
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              stepHistory(1)
            }
          }}
          placeholder="Type a command and press Enter"
          aria-label="Command"
          variant="borderless"
          autoFocus
        />
        <Button type="primary" onClick={submit} loading={run.isPending} disabled={!draft.trim()}>
          Run
          <Icon name="arrow" size={14} />
        </Button>
      </div>
    </Card>
  )
}
