import { useSuspenseQuery } from '@tanstack/react-query'
import { Button, Card, Input, Radio, Table, Tooltip, type TableProps } from 'antd'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import DeviceGroups from '../../components/DeviceGroups'
import AgentVersion from '../../components/AgentVersion'
import StatusButton from '../../components/StatusButton'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { navItem } from '../../config/nav'
import { devicesQuery, groupsQuery } from '../../services/queries'
import type { Device, DeviceFilter } from '../../types/device'
import { filterDevices } from '../../utils/devices'
import EnrollDrawer from './EnrollDrawer'

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
      render: (_, d) => <AgentVersion device={d} />,
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
            <Link to="/groups">
              <Button icon={<Icon name="tag" size={14} />}>Manage groups</Button>
            </Link>
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
    </div>
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
