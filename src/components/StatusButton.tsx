import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Button, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import { devicesQuery } from '../services/queries'
import type { Device } from '../types/device'

/** Online / Offline that pings the agent when clicked. Used in the Devices table and on the device page. */
export default function StatusButton({ device }: { device: Device }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  // The device list carries what a machine is; whether its agent is actually there is only known once
  // that agent reports in. So a row starts Offline and turns Online when its own check lands, and the
  // waits are spread out, the way a thousand agents report in rather than all at once.
  // shortcut: EdgePanel has no /ws/events yet, so reporting in is a timer that resolves to what the
  // list already said. Swap the timeout for that subscription once the endpoint exists.
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setOnline(device.online), 500 + Math.random() * 2500)
    return () => clearTimeout(timer)
  }, [device.online])
  // EdgePanel has no ping endpoint. The fleet list already says whether a device answers and how fast,
  // so a ping re-reads that list past the cache: the row's own dot and the message then agree.
  const ping = useMutation({
    mutationFn: async () => {
      const fresh = await queryClient.fetchQuery({ ...devicesQuery, staleTime: 0 })
      return fresh.find((d) => d.host === device.host) ?? null
    },
    onSuccess: (fresh) => {
      setOnline(Boolean(fresh?.online))
      // The device page reads its own copy; refresh it so its tabs follow the answer.
      queryClient.invalidateQueries({ queryKey: ['devices', device.host] })
      if (fresh?.online) message.success(`${device.host} answered in ${fresh.latencyMs} ms`)
      else message.warning(`${device.host} did not answer`)
    },
    onError: (error) => message.error(error.message),
  })

  // One control for both jobs: it reads the current state and clicking it checks that state again.
  // The word carries the state, so colour is the second signal rather than the only one.
  const waiting = online === null
  const state = online ? 'Online' : 'Offline'
  const busy = waiting || ping.isPending
  return (
    <Tooltip title={waiting ? `Waiting for ${device.host} to report in` : `Ping ${device.host}`}>
      <Button
        size="small"
        loading={busy}
        onClick={() => ping.mutate()}
        aria-label={waiting ? `Waiting for ${device.host} to report in` : `${state} — ping ${device.host}`}
        // Online and Offline differ in shape, not only hue (index.css): a filled pill with a solid dot against an
        // empty grey one with a ring. Offline is grey, not red: a switched-off machine is not an error.
        className={`status-btn ${online ? 'is-online' : 'is-offline'}`}
      >
        {busy ? null : <span className="status-dot" aria-hidden="true" />}
        {state}
      </Button>
    </Tooltip>
  )
}
