import { useSuspenseQuery } from '@tanstack/react-query'
import { Button, Card, Dropdown, Input, Select, Table, Tag, Tooltip, type MenuProps, type TableProps } from 'antd'
import { useState, type Key } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Icon } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import Status from '../../components/Status'
import { navItem } from '../../config/nav'
import { useNotSupported } from '../../hooks/useNotSupported'
import { devicesQuery } from '../../services/queries'
import type { Device, DeviceFilter } from '../../types/device'
import { filterDevices, toCsv } from '../../utils/devices'
import { ago } from '../../utils/time'
import EnrollDrawer from './EnrollDrawer'

const ALL = { value: '', label: 'All' }
const OS_OPTIONS = [ALL, { value: 'Windows', label: 'Windows' }, { value: 'Linux', label: 'Linux' }]
const STATUS_OPTIONS = [ALL, { value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }]
// `subject` names the action in its "… isn't available yet" message.
const BULK_ACTIONS = [
  { label: 'Assign group', subject: 'Assigning groups' },
  { label: 'Assign tag', subject: 'Assigning tags' },
  { label: 'Run command', subject: 'Running commands' },
  { label: 'Update agent', subject: 'Updating agents' },
]
// Menu keys double as that message subject.
const MORE_ACTIONS: MenuProps['items'] = [
  { key: 'Renaming devices', label: 'Rename' },
  { key: 'Disabling devices', label: 'Disable' },
  { type: 'divider' },
  { key: 'Deleting devices', label: 'Delete', danger: true },
]
const REMOTE_ACTIONS = [
  { path: '/remote-terminal', verb: 'Open a terminal' },
  { path: '/remote-desktop', verb: 'Open remote desktop' },
  { path: '/remote-files', verb: 'Browse files' },
]

const columns: TableProps<Device>['columns'] = [
  {
    title: 'Hostname',
    key: 'host',
    render: (_, d) => (
      <>
        <Link to={`/devices/${d.host}`} className="strong">
          {d.host}
        </Link>
        <div className="sub">{d.alias}</div>
      </>
    ),
  },
  { title: 'OS', dataIndex: 'os' },
  {
    title: 'IP / MAC',
    key: 'ip',
    render: (_, d) => (
      <>
        {d.ip}
        <div className="sub">
          <code>{d.mac}</code>
        </div>
      </>
    ),
  },
  { title: 'Status', key: 'status', render: (_, d) => <Status online={d.online} /> },
  {
    title: 'Agent',
    key: 'agent',
    render: (_, d) => (
      <>
        {d.agentVersion} {d.agentOutdated ? <Tag color="warning">outdated</Tag> : null}
      </>
    ),
  },
  {
    title: 'Group · Tag',
    key: 'group',
    render: (_, d) => (
      <>
        <Tag color="processing">{d.group}</Tag>
        <Tag>{d.tag}</Tag>
      </>
    ),
  },
  { title: 'Last seen', key: 'seen', render: (_, d) => ago(d.lastSeen) },
  { title: 'Actions', key: 'actions', render: (_, d) => <RowActions device={d} /> },
]

export default function DevicesPage() {
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<Key[]>([])
  const [enrollOpen, setEnrollOpen] = useState(false)
  const notSupported = useNotSupported()
  const { data: devices } = useSuspenseQuery(devicesQuery)
  const groups = [...new Set(devices.map((d) => d.group))].sort()

  const filter: DeviceFilter = {
    q: params.get('q') ?? '',
    os: params.get('os') ?? '',
    group: params.get('group') ?? '',
    status: params.get('status') ?? '',
  }
  const rows = filterDevices(devices, filter)
  const picked = rows.filter((d) => selected.includes(d.host))
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

  const exportCsv = () => {
    // BOM so Excel reads the file as UTF-8.
    const url = URL.createObjectURL(new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'devices.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url))
  }

  return (
    <div className="stack">
      <PageHeader
        title="Devices"
        subtitle={`${devices.length} Windows and Linux devices enrolled`}
        actions={
          <>
            <Button onClick={exportCsv} disabled={rows.length === 0}>
              Export CSV
            </Button>
            <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setEnrollOpen(true)}>
              Enroll agent
            </Button>
          </>
        }
      />

      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <div className="filters">
          <Input
            className="search"
            allowClear
            prefix={<Icon name="search" size={14} />}
            placeholder="Hostname, IP, MAC…"
            aria-label="Search devices"
            value={filter.q}
            onChange={(e) => setFilter('q', e.target.value)}
          />
          <FilterSelect label="OS" value={filter.os} options={OS_OPTIONS} onChange={(v) => setFilter('os', v)} />
          <FilterSelect
            label="Group"
            value={filter.group}
            options={[ALL, ...groups.map((g) => ({ value: g, label: g }))]}
            onChange={(v) => setFilter('group', v)}
          />
          <FilterSelect label="Status" value={filter.status} options={STATUS_OPTIONS} onChange={(v) => setFilter('status', v)} />
        </div>

        {picked.length > 0 ? (
          <div className="bulk-bar">
            <span>
              <b>{picked.length}</b> {picked.length === 1 ? 'device' : 'devices'} selected
            </span>
            {BULK_ACTIONS.map(({ label, subject }) => (
              <Button key={label} type="link" onClick={() => notSupported(subject)}>
                {label}
              </Button>
            ))}
          </div>
        ) : null}

        <Table<Device>
          columns={columns}
          dataSource={rows}
          rowKey="host"
          rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, showTotal: (total, [from, to]) => `${from}–${to} / ${total}` }}
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

      <EnrollDrawer open={enrollOpen} onClose={() => setEnrollOpen(false)} groups={groups} />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="filter">
      <span>{label}</span>
      <Select value={value} options={options} onChange={onChange} style={{ minWidth: 120 }} popupMatchSelectWidth={false} />
    </label>
  )
}

function RowActions({ device }: { device: Device }) {
  const notSupported = useNotSupported()
  return (
    <div className="row-actions">
      {REMOTE_ACTIONS.map(({ path, verb }) => {
        const feature = navItem(path)
        // aria-disabled rather than disabled, so keyboard users can still focus it and hear why.
        return (
          <Tooltip key={path} title={`${feature.label} isn't available yet`}>
            <button
              type="button"
              className="icon-btn"
              aria-disabled="true"
              aria-label={`${verb} on ${device.host}, not available yet`}
            >
              <Icon name={feature.icon} />
            </button>
          </Tooltip>
        )
      })}
      <Dropdown trigger={['click']} menu={{ items: MORE_ACTIONS, onClick: ({ key }) => notSupported(key) }}>
        <button type="button" className="icon-btn" aria-label={`More actions for ${device.host}`}>
          <Icon name="more" />
        </button>
      </Dropdown>
    </div>
  )
}
