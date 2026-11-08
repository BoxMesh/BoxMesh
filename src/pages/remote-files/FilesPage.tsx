import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Tooltip, Upload } from 'antd'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import DevicePicker, { DeviceOffline, PickFirst } from '../../components/DevicePicker'
import { Icon } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { useDeviceParam } from '../../hooks/useDeviceParam'
import { filesQuery, transferQuery } from '../../services/queries'
import { startTransfer } from '../../services/remoteService'
import type { Device } from '../../types/device'
import type { ConflictChoice, FileLocation } from '../../types/remote'
import { compareListings, namesToSync, rootOf } from '../../utils/files'
import FileBrowser from './FileBrowser'
import Transfers, { type PendingCopy } from './Transfers'

export default function FilesPage() {
  const { devices, host, device, setHost } = useDeviceParam()
  const [params, setParams] = useSearchParams()
  // The second device lives in `?with=` beside `?host=`; an empty value means "opened, none picked yet".
  const other = params.get('with')
  const otherDevice = devices.find((d) => d.host === other) ?? null
  const [comparing, setComparing] = useState(false)

  const setOther = (next: string | null) =>
    setParams(
      (current) => {
        const p = new URLSearchParams(current)
        if (next === null) p.delete('with')
        else p.set('with', next)
        return p
      },
      { replace: true },
    )

  const dual = other !== null && device !== null

  return (
    <div className="stack">
      <PageHeader
        title="Remote Files"
        subtitle={
          dual
            ? 'Copy files between two devices, each through its own agent tunnel.'
            : 'Browse, download and upload files on a device through its agent tunnel.'
        }
        actions={
          dual ? (
            <Button
              aria-pressed={comparing}
              className={comparing ? 'is-pressed' : undefined}
              icon={<Icon name="swap" size={14} />}
              onClick={() => setComparing(!comparing)}
            >
              {comparing ? 'Comparing folders' : 'Compare folders'}
            </Button>
          ) : (
            <>
              <DevicePicker devices={devices} host={host} onChange={setHost} />
              <Button icon={<Icon name="columns" size={14} />} disabled={!device?.online} onClick={() => setOther('')}>
                Add a second device
              </Button>
            </>
          )
        }
      />
      {!device ? (
        <Card>
          <PickFirst icon="files" what="browse files on" />
        </Card>
      ) : !device.online ? (
        <Card>
          <DeviceOffline device={device} />
        </Card>
      ) : dual ? (
        // Keyed by both hosts: each device opens at its own root again when either side changes.
        <TwoDevices
          key={`${device.host}|${other}`}
          left={device}
          right={otherDevice}
          devices={devices}
          comparing={comparing}
          onLeft={setHost}
          onRight={(next) => setOther(next)}
          onClose={() => {
            setOther(null)
            setComparing(false)
          }}
        />
      ) : (
        <OneDevice key={device.host} device={device} />
      )}
    </div>
  )
}

function OneDevice({ device }: { device: Device }) {
  const { message } = App.useApp()
  const [path, setPath] = useState(rootOf(device))
  return (
    <FileBrowser
      device={device}
      path={path}
      onPath={setPath}
      tools={
        <Upload
          beforeUpload={(file) => {
            message.success(`${file.name} uploaded to ${path}`)
            return false
          }}
          showUploadList={false}
        >
          <Button type="primary" icon={<Icon name="plus" size={14} />}>
            Upload
          </Button>
        </Upload>
      }
    />
  )
}

interface TwoProps {
  left: Device
  right: Device | null
  devices: Device[]
  comparing: boolean
  onLeft: (host: string) => void
  onRight: (host: string) => void
  onClose: () => void
}

function TwoDevices({ left, right, devices, comparing, onLeft, onRight, onClose }: TwoProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [leftPath, setLeftPath] = useState(rootOf(left))
  const [rightPath, setRightPath] = useState(right ? rootOf(right) : '')
  const [leftSel, setLeftSel] = useState<string[]>([])
  const [rightSel, setRightSel] = useState<string[]>([])
  const [pending, setPending] = useState<PendingCopy | null>(null)
  const [transfers, setTransfers] = useState<string[]>([])
  // Files being dragged from one pane; the other pane turns into a drop target while it lasts.
  const [drag, setDrag] = useState<{ toRight: boolean; names: string[] } | null>(null)

  const ready = right?.online ? right : null
  const leftList = useQuery(filesQuery(left.host, leftPath)).data?.entries
  const rightList = useQuery({
    ...filesQuery(right?.host ?? '', rightPath),
    enabled: Boolean(ready),
  }).data?.entries
  const loaded = Boolean(leftList && rightList)

  const leftCmp = comparing && leftList && rightList ? compareListings(leftList, rightList) : undefined
  const rightCmp = comparing && leftList && rightList ? compareListings(rightList, leftList) : undefined

  const send = useMutation({
    mutationFn: startTransfer,
    onSuccess: (transfer) => {
      queryClient.setQueryData(transferQuery(transfer.id).queryKey, transfer)
      setTransfers((list) => [transfer.id, ...list])
      setLeftSel([])
      setRightSel([])
    },
    onError: (error) => message.error(error.message),
  })

  const place = (toRight: boolean) => {
    const a: FileLocation = { host: left.host, path: leftPath }
    const b: FileLocation = { host: ready!.host, path: rightPath }
    return toRight
      ? { from: a, to: b, source: leftList ?? [], target: rightList ?? [] }
      : { from: b, to: a, source: rightList ?? [], target: leftList ?? [] }
  }

  // Copying asks first about names the other folder already has; it never overwrites on its own.
  const copy = (toRight: boolean, names = toRight ? leftSel : rightSel) => {
    const { from, to, source, target } = place(toRight)
    const conflicts = names.filter((name) => target.some((e) => e.kind === 'file' && e.name === name))
    if (conflicts.length) setPending({ from, to, names, conflicts, source, target })
    else
      send.mutate({
        from,
        to,
        items: names.map((name) => ({ name, onConflict: 'skip' })),
      })
  }

  const resolve = (choices: Record<string, ConflictChoice>) => {
    if (!pending) return
    send.mutate({
      from: pending.from,
      to: pending.to,
      items: pending.names.map((name) => ({
        name,
        onConflict: choices[name] ?? 'skip',
      })),
    })
    setPending(null)
  }

  // A sync copies what is newer or missing on the other side; the other side's newer copies win, so it never
  // overwrites anything newer, and it deletes nothing.
  const sync = (toRight: boolean) => {
    const names = namesToSync((toRight ? leftCmp : rightCmp) ?? new Map())
    const { from, to } = place(toRight)
    send.mutate({
      from,
      to,
      items: names.map((name) => ({ name, onConflict: 'replace' })),
    })
  }

  const toRightCount = comparing ? namesToSync(leftCmp ?? new Map()).length : leftSel.length
  const toLeftCount = comparing ? namesToSync(rightCmp ?? new Map()).length : rightSel.length
  const busy = send.isPending || pending !== null
  const others = (except: string) => devices.filter((d) => d.host !== except)
  const files = (n: number) => `${n} ${n === 1 ? 'file' : 'files'}`

  // The arrows carry no words, so their tooltip and accessible name say exactly what a click does.
  const arrowLabel = (toRight: boolean) => {
    const count = toRight ? toRightCount : toLeftCount
    const target = toRight ? (ready?.host ?? 'the other device') : left.host
    if (comparing) return `Sync ${files(count)} to ${target}: copies newer and missing files, deletes nothing`
    return count ? `Copy ${files(count)} to ${target}` : `Tick files, or drag them across, to copy them to ${target}`
  }

  const dropOn = (toRight: boolean) => {
    if (!drag || drag.toRight !== toRight || !loaded || busy) return null
    const target = toRight ? { host: ready?.host, path: rightPath } : { host: left.host, path: leftPath }
    return {
      label: `Drop to copy ${files(drag.names.length)} to ${target.host} · ${target.path}`,
      onDrop: () => {
        copy(toRight, drag.names)
        setDrag(null)
      },
    }
  }

  return (
    <>
      <div className="files-duo">
        <FileBrowser
          device={left}
          path={leftPath}
          onPath={(p) => {
            setLeftPath(p)
            setLeftSel([])
          }}
          head={<DevicePicker devices={others(right?.host ?? '')} host={left.host} onChange={onLeft} />}
          selected={leftSel}
          onSelect={(names) => {
            setLeftSel(names)
            setRightSel([])
          }}
          comparison={leftCmp}
          onDragFiles={(names) => setDrag({ toRight: true, names })}
          onDragDone={() => setDrag(null)}
          drop={dropOn(false)}
        />

        <div className="files-mid">
          {[true, false].map((toRight) => {
            const count = toRight ? toRightCount : toLeftCount
            return (
              <Tooltip key={String(toRight)} title={arrowLabel(toRight)} placement={toRight ? 'top' : 'bottom'}>
                <Button
                  className="files-arrow"
                  type={count && (toRight || !toRightCount) ? 'primary' : 'default'}
                  disabled={!loaded || !count || busy}
                  aria-label={arrowLabel(toRight)}
                  icon={<Icon name={toRight ? 'arrow' : 'arrow-left'} size={16} />}
                  onClick={() => (comparing ? sync(toRight) : copy(toRight))}
                >
                  {count || null}
                </Button>
              </Tooltip>
            )
          })}
        </div>

        {right && ready ? (
          <FileBrowser
            device={right}
            path={rightPath}
            onPath={(p) => {
              setRightPath(p)
              setRightSel([])
            }}
            head={<SecondHead devices={others(left.host)} host={right.host} onChange={onRight} onClose={onClose} />}
            selected={rightSel}
            onSelect={(names) => {
              setRightSel(names)
              setLeftSel([])
            }}
            comparison={rightCmp}
            onDragFiles={(names) => setDrag({ toRight: false, names })}
            onDragDone={() => setDrag(null)}
            drop={dropOn(true)}
          />
        ) : (
          <Card className="table-card" styles={{ body: { padding: 0 } }}>
            <div className="files-head">
              <SecondHead devices={others(left.host)} host={right?.host ?? ''} onChange={onRight} onClose={onClose} />
            </div>
            {right ? <DeviceOffline device={right} /> : <PickFirst icon="files" what="copy files to" />}
          </Card>
        )}
      </div>

      <Transfers
        pending={pending}
        onResolve={resolve}
        onAbandon={() => setPending(null)}
        transfers={transfers}
        onClear={(ids) => setTransfers((list) => list.filter((id) => !ids.includes(id)))}
      />
    </>
  )
}

function SecondHead({
  devices,
  host,
  onChange,
  onClose,
}: {
  devices: Device[]
  host: string
  onChange: (host: string) => void
  onClose: () => void
}) {
  return (
    <>
      <DevicePicker devices={devices} host={host} onChange={onChange} />
      <span className="screen-spacer" />
      <Tooltip title="Close the second device">
        <button type="button" className="icon-btn files-close" aria-label="Close the second device" onClick={onClose}>
          <Icon name="close" />
        </button>
      </Tooltip>
    </>
  )
}
