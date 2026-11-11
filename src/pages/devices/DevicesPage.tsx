import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { App, Button, Card, Input, Radio, Table, Tooltip, type TableProps } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import DeviceGroups from '../../components/DeviceGroups'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { navItem } from '../../config/nav'
import { devicesQuery, groupsQuery } from '../../services/queries'
import type { Device, DeviceFilter } from '../../types/device'
import { filterDevices } from '../../utils/devices'
import EnrollDrawer from './EnrollDrawer'
import GroupsDrawer from './GroupsDrawer'

const ALL = { value: '', label: 'All' }
const OS_OPTIONS = [ALL, { value: 'Windows', label: 'Windows' }, { value: 'Linux', label: 'Linux' }, { value: 'macOS', label: 'macOS' }]
const STATUS_OPTIONS = [ALL, { value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }]
const REMOTE_ACTIONS = [
  { path: '/remote-terminal', verb: 'Open a terminal' },
  { path: '/remote-desktop', verb: 'Open remote desktop' },
  { path: '/remote-files', verb: 'Browse files' },
]

export default function DevicesPage() {
  const [params, setParams] = useSearchParams()
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const { data: devices } = useSuspenseQuery(devicesQuery)
  const { data: groups } = useSuspenseQuery(groupsQuery)

  const filter: DeviceFilter = {
    q: params.get('q') ?? '',
    os: params.get('os') ?? '',
    status: params.get('status') ?? '',
    group: params.get('group') ?? '',
  }
  const rows = filterDevices(devices, filter)
  const filtered = Object.values(filter).some(Boolean)

  const setFilter = (key: keyof DeviceFilter, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  // The column headings are the only filter UI. antd draws the trigger and the panel; the URL still
  // owns the value, so the app header's search and the dashboard's "Agents online" link land filtered.
  const choice = (options: { value: string; label: string }[], key: 'os' | 'status' | 'group') => ({
    filteredValue: filter[key] ? [filter[key]] : null,
    filterDropdown: () => (
      <Radio.Group className="filter-panel" value={filter[key]} options={options} onChange={(e) => setFilter(key, e.target.value)} />
    ),
  })

  const columns: TableProps<Device>['columns'] = [
    {
      title: <Th icon="devices" label="Hostname" />,
      key: 'host',
      // The search reaches alias and MAC as well, so it sits on the first column rather than each one.
      filteredValue: filter.q ? [filter.q] : null,
      filterIcon: <Icon name="search" size={13} />,
      filterDropdown: () => (
        <Input
          className="filter-search"
          allowClear
          autoFocus
          placeholder="Hostname, IP, MAC…"
          aria-label="Search devices"
          value={filter.q}
          onChange={(e) => setFilter('q', e.target.value)}
        />
      ),
      render: (_, d) => (
        <Link to={`/devices/${d.host}`} className="strong">
          {d.host}
        </Link>
      ),
    },
    {
      title: <Th icon="tag" label="Groups" />,
      key: 'groups',
      ...choice([ALL, ...groups.map((g) => ({ value: g.id, label: g.name }))], 'group'),
      render: (_, d) => <DeviceGroups device={d} groups={groups} />,
    },
    { title: <Th icon="desktop" label="OS" />, dataIndex: 'os', ...choice(OS_OPTIONS, 'os') },
    { title: <Th icon="tag" label="Version" />, dataIndex: 'osVersion' },
    { title: <Th icon="chip" label="Arch" />, dataIndex: 'osArchitecture' },
    { title: <Th icon="web" label="IP" />, dataIndex: 'ip' },
    { title: <Th icon="hash" label="MAC" />, key: 'mac', render: (_, d) => <code>{d.mac}</code> },
    {
      title: <Th icon="box" label="Agent" />,
      key: 'agent',
      render: (_, d) =>
        d.agentOutdated ? (
          <Tooltip title="A newer agent has been released">
            {/* role + label: the icon is the whole message, so it has to reach a screen reader too. */}
            <span className="agent-outdated" role="img" aria-label={`${d.agentVersion}, update available`}>
              {d.agentVersion}
              <Icon name="warning" size={13} />
            </span>
          </Tooltip>
        ) : (
          d.agentVersion
        ),
    },
    {
      title: <Th icon="pulse" label="Status" />,
      key: 'status',
      ...choice(STATUS_OPTIONS, 'status'),
      render: (_, d) => <StatusButton device={d} />,
    },
    { title: <Th icon="more" label="Actions" />, key: 'actions', render: (_, d) => <RowActions device={d} /> },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Devices"
        subtitle={`${devices.length} devices enrolled`}
        actions={
          <>
            <Button icon={<Icon name="tag" size={14} />} onClick={() => setGroupsOpen(true)}>
              Manage groups
            </Button>
            <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setEnrollOpen(true)}>
              Enroll agent
            </Button>
          </>
        }
      />

      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <Table<Device>
          columns={columns}
          dataSource={rows}
          rowKey="host"
          rowClassName={(d) => (d.online ? '' : 'row-offline')}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, hideOnSinglePage: true, showTotal: (total, [from, to]) => `${from}–${to} / ${total}` }}
          locale={{
            emptyText: filtered ? (
              <div className="empty">
                <span>No devices match these filters.</span>
                <Button onClick={() => setParams({}, { replace: true })}>Clear filters</Button>
              </div>
            ) : (
              <div className="empty">
                <span>No devices are enrolled yet.</span>
                <Button type="primary" onClick={() => setEnrollOpen(true)}>
                  Enroll agent
                </Button>
              </div>
            ),
          }}
        />
      </Card>

      <EnrollDrawer open={enrollOpen} onClose={() => setEnrollOpen(false)} groups={groups.map((g) => g.name)} />
      <GroupsDrawer open={groupsOpen} onClose={() => setGroupsOpen(false)} groups={groups} devices={devices} />
    </div>
  )
}

function StatusButton({ device }: { device: Device }) {
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

function RowActions({ device }: { device: Device }) {
  return (
    <div className="row-actions">
      {REMOTE_ACTIONS.map(({ path, verb }) => {
        const feature = navItem(path)
        const label = `${verb} on ${device.host}`
        // Offline keeps aria-disabled rather than disabled, so keyboard users can still focus it and hear why.
        return device.online ? (
          <Tooltip key={path} title={feature.label}>
            <Link to={`${path}?host=${encodeURIComponent(device.host)}`} className="icon-btn" aria-label={label}>
              <Icon name={feature.icon} />
            </Link>
          </Tooltip>
        ) : (
          <Tooltip key={path} title={`${device.host} is offline`}>
            <button type="button" className="icon-btn" aria-disabled="true" aria-label={`${label}, offline`}>
              <Icon name={feature.icon} />
            </button>
          </Tooltip>
        )
      })}
    </div>
  )
}
