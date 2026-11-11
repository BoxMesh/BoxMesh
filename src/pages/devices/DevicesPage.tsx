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
import { t } from '../../i18n'
import { devicesQuery, groupsQuery } from '../../services/queries'
import type { Device, DeviceFilter } from '../../types/device'
import { filterDevices } from '../../utils/devices'
import EnrollDrawer from './EnrollDrawer'

const ALL = () => ({ value: '', label: t('All') })
const OS_OPTIONS = () => [ALL(), { value: 'Windows', label: 'Windows' }, { value: 'Linux', label: 'Linux' }, { value: 'macOS', label: 'macOS' }]
const STATUS_OPTIONS = () => [ALL(), { value: 'online', label: t('Online') }, { value: 'offline', label: t('Offline') }]
const REMOTE_ACTIONS = [
  { path: '/remote-terminal', label: (host: string) => t('Open a terminal on {host}', { host }) },
  { path: '/remote-desktop', label: (host: string) => t('Open remote desktop on {host}', { host }) },
  { path: '/remote-files', label: (host: string) => t('Browse files on {host}', { host }) },
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
      title: <Th icon="devices" label={t('Hostname')} />,
      key: 'host',
      // The search reaches alias and MAC as well, so it sits on the first column rather than each one.
      filteredValue: filter.q ? [filter.q] : null,
      filterIcon: <Icon name="search" size={13} />,
      filterDropdown: () => (
        <Input
          className="filter-search"
          allowClear
          autoFocus
          placeholder={t('Hostname, IP, MAC…')}
          aria-label={t('Search devices')}
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
      title: <Th icon="tag" label={t('Groups')} />,
      key: 'groups',
      ...choice([ALL(), ...groups.map((g) => ({ value: g.id, label: g.name }))], 'group'),
      render: (_, d) => <DeviceGroups device={d} groups={groups} />,
    },
    { title: <Th icon="desktop" label="OS" />, dataIndex: 'os', ...choice(OS_OPTIONS(), 'os') },
    { title: <Th icon="tag" label={t('Version')} />, dataIndex: 'osVersion' },
    { title: <Th icon="chip" label={t('Arch')} />, dataIndex: 'osArchitecture' },
    { title: <Th icon="web" label="IP" />, dataIndex: 'ip' },
    { title: <Th icon="hash" label="MAC" />, key: 'mac', render: (_, d) => <code>{d.mac}</code> },
    {
      title: <Th icon="box" label={t('Agent')} />,
      key: 'agent',
      render: (_, d) => <AgentVersion device={d} />,
    },
    {
      title: <Th icon="pulse" label={t('Status')} />,
      key: 'status',
      ...choice(STATUS_OPTIONS(), 'status'),
      render: (_, d) => <StatusButton device={d} />,
    },
    { title: <Th icon="more" label={t('Actions')} />, key: 'actions', render: (_, d) => <RowActions device={d} /> },
  ]

  return (
    <div className="stack">
      <PageHeader
        title={t('Devices')}
        subtitle={t('{n} devices enrolled', { n: devices.length })}
        actions={
          <>
            <Link to="/groups">
              <Button icon={<Icon name="tag" size={14} />}>{t('Manage groups')}</Button>
            </Link>
            <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setEnrollOpen(true)}>
              {t('Enroll agent')}
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
                <span>{t('No devices match these filters.')}</span>
                <Button onClick={() => setParams({}, { replace: true })}>{t('Clear filters')}</Button>
              </div>
            ) : (
              <div className="empty">
                <span>{t('No devices are enrolled yet.')}</span>
                <Button type="primary" onClick={() => setEnrollOpen(true)}>
                  {t('Enroll agent')}
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
      {REMOTE_ACTIONS.map(({ path, label: labelFor }) => {
        const feature = navItem(path)
        const label = labelFor(device.host)
        // Offline keeps aria-disabled rather than disabled, so keyboard users can still focus it and hear why.
        return device.online ? (
          <Tooltip key={path} title={feature.label}>
            <Link to={`${path}?host=${encodeURIComponent(device.host)}`} className="icon-btn" aria-label={label}>
              <Icon name={feature.icon} />
            </Link>
          </Tooltip>
        ) : (
          <Tooltip key={path} title={t('{host} is offline', { host: device.host })}>
            <button type="button" className="icon-btn" aria-disabled="true" aria-label={t('{label}, offline', { label })}>
              <Icon name={feature.icon} />
            </button>
          </Tooltip>
        )
      })}
    </div>
  )
}
