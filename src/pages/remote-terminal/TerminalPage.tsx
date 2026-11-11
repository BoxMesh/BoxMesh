import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { Card, Segmented } from 'antd'
import { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import DevicePicker, { DeviceOffline, PickFirst } from '../../components/DevicePicker'
import PageHeader from '../../components/PageHeader'
import Status from '../../components/Status'
import { useDeviceParam } from '../../hooks/useDeviceParam'
import { useThemeMode } from '../../hooks/useThemeMode'
import { userMessage } from '../../services/http'
import { runCommand } from '../../services/remoteService'
import type { Device, OsFamily } from '../../types/device'
import type { Shell } from '../../types/remote'

const SHELLS: Record<OsFamily, Shell[]> = { Windows: ['PowerShell', 'CMD'], Linux: ['Bash'], macOS: ['Bash'] }

const promptFor = (shell: Shell, host: string) =>
  shell === 'Bash' ? `root@${host.toLowerCase()}:~#` : shell === 'CMD' ? 'C:\\>' : 'PS C:\\>'

// The palette lives in CSS variables, so the terminal reads the same tokens as everything else rather
// than hard-coding a second set that would drift.
function paletteFrom(root: HTMLElement) {
  const css = getComputedStyle(root)
  const token = (name: string) => css.getPropertyValue(name).trim()
  return {
    theme: {
      background: token('--bg-page'),
      foreground: token('--text'),
      cursor: token('--accent'),
      cursorAccent: token('--bg-page'),
      selectionBackground: token('--border-hover'),
      green: token('--accent'),
      red: token('--error'),
      brightBlack: token('--text-secondary'),
    },
    fontFamily: token('--mono') || 'monospace',
  }
}

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
  const { mode } = useThemeMode()

  const mount = useRef<HTMLDivElement>(null)
  const term = useRef<Terminal | null>(null)
  // xterm owns what is on screen, so none of this belongs in React state: a re-render per keystroke
  // would do nothing but cost frames.
  const draft = useRef('')
  const history = useRef<string[]>([])
  const recall = useRef<number | null>(null)
  const busy = useRef(false)
  const shellRef = useRef(shell)
  const firstShell = useRef(true)

  useEffect(() => {
    const element = mount.current
    if (!element) return
    const { theme, fontFamily } = paletteFrom(document.documentElement)
    const terminal = new Terminal({
      theme,
      fontFamily,
      fontSize: 13,
      lineHeight: 1.35,
      cursorBlink: true,
      // The agent sends bare \n; without this every line would stair-step to the right.
      convertEol: true,
      scrollback: 2000,
    })
    const fit = new FitAddon()
    terminal.loadAddon(fit)
    terminal.open(element)
    term.current = terminal

    const resize = () => {
      try {
        fit.fit()
      } catch {
        // The card is hidden or has no size yet; the next resize will fit it.
      }
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)

    const prompt = () => terminal.write(`\x1b[32m${promptFor(shellRef.current, device.host)}\x1b[0m `)

    terminal.writeln(`\x1b[90mConnected to ${device.host} over the agent tunnel.\x1b[0m`)
    terminal.writeln('\x1b[90mTry whoami, hostname, uptime, df, ipconfig, ls or get-service.\x1b[0m')
    terminal.writeln('')
    prompt()

    const submit = async () => {
      const command = draft.current.trim()
      terminal.write('\r\n')
      draft.current = ''
      recall.current = null
      if (!command) return prompt()

      history.current.push(command)
      busy.current = true
      try {
        const result = await runCommand(device.host, shellRef.current, command)
        if (result.output) terminal.writeln(result.exitCode === 0 ? result.output : `\x1b[31m${result.output}\x1b[0m`)
      } catch (error) {
        // A blocked command comes back as 403 with the rule's reason; show that, not a generic permission error.
        const refused = isAxiosError<{ error?: string }>(error) && error.response?.status === 403 && error.response.data?.error
        terminal.writeln(`\x1b[31m${refused || userMessage(error)}\x1b[0m`)
      } finally {
        busy.current = false
        prompt()
      }
    }

    // Replace what is typed with an earlier command: \r returns to column 0, \x1b[2K wipes the row.
    const replaceLine = (next: string) => {
      draft.current = next
      terminal.write('\r\x1b[2K')
      prompt()
      terminal.write(next)
    }

    const step = (delta: number) => {
      if (history.current.length === 0) return
      const at = recall.current ?? history.current.length
      const next = Math.min(history.current.length, Math.max(0, at + delta))
      recall.current = next === history.current.length ? null : next
      replaceLine(next === history.current.length ? '' : history.current[next])
    }

    const listener = terminal.onData((data) => {
      if (busy.current) return
      switch (data) {
        case '\r':
          void submit()
          return
        case '\u007f': // Backspace
          if (draft.current) {
            draft.current = draft.current.slice(0, -1)
            terminal.write('\b \b')
          }
          return
        case '\u0003': // Ctrl+C
          terminal.write('^C\r\n')
          draft.current = ''
          recall.current = null
          prompt()
          return
        case '\u001b[A':
          return step(-1)
        case '\u001b[B':
          return step(1)
        case '\u001b[C':
        case '\u001b[D':
          // shortcut: the line editor is append-only, so left/right are ignored. Give it a cursor
          // position if anyone needs to edit mid-line.
          return
        default:
          // Printable only: drop the remaining control and escape sequences.
          if (data >= ' ') {
            draft.current += data
            terminal.write(data)
          }
      }
    })

    terminal.focus()
    return () => {
      listener.dispose()
      observer.disconnect()
      terminal.dispose()
      term.current = null
    }
  }, [device.host])

  // Follow the app's theme; xterm paints to a canvas, so CSS alone cannot reach it.
  useEffect(() => {
    if (term.current) term.current.options.theme = paletteFrom(document.documentElement).theme
  }, [mode])

  // A new shell means a new prompt: clear whatever is half-typed and redraw it.
  useEffect(() => {
    shellRef.current = shell
    if (firstShell.current) {
      firstShell.current = false
      return
    }
    const terminal = term.current
    if (!terminal || busy.current) return
    draft.current = ''
    terminal.write(`\r\x1b[2K\x1b[32m${promptFor(shell, device.host)}\x1b[0m `)
    terminal.focus()
  }, [shell, device.host])

  return (
    <Card
      title={`${device.host} · ${device.os} ${device.osVersion}`}
      extra={<Segmented<Shell> aria-label="Shell" options={shells} value={shell} onChange={setShell} />}
      styles={{ body: { padding: 0 } }}
    >
      <div className="terminal-host" ref={mount} />
    </Card>
  )
}
