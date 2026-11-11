import { useQuery } from '@tanstack/react-query'
import { Button, Input, Table, Tag, type TableProps } from 'antd'
import { useState } from 'react'
import { Th } from '../../components/Icon'
import { useNotSupported } from '../../hooks/useNotSupported'
import { t } from '../../i18n'
import { userMessage } from '../../services/http'
import { processesQuery } from '../../services/queries'
import type { Device, DeviceProcess, ProcessStatus } from '../../types/device'

const STATUS = (): Record<ProcessStatus, { label: string; color: string }> => ({
  running: { label: t('Running'), color: 'success' },
  suspended: { label: t('Suspended'), color: 'default' },
  'not-responding': { label: t('Not responding'), color: 'warning' },
})

const memory = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`)

/** The Processes tab of the device page, like Task Manager. It polls only while it is the open tab. */
export default function ProcessesPanel({ device }: { device: Device }) {
  const notSupported = useNotSupported()
  const [q, setQ] = useState('')
  const list = useQuery({ ...processesQuery(device.host), enabled: device.online, refetchInterval: 5000 })
  const query = q.trim().toLowerCase()
  const rows = (list.data ?? []).filter(
    (p) => !query || p.name.toLowerCase().includes(query) || p.user.toLowerCase().includes(query) || String(p.pid).includes(query),
  )

  if (!device.online) {
    return (
      <p className="muted" style={{ padding: 16, margin: 0 }}>
        {t('Processes show while the device is online. {host} has no open tunnel right now.', { host: device.host })}
      </p>
    )
  }

  const columns: TableProps<DeviceProcess>['columns'] = [
    {
      title: <Th icon="box" label={t('Name')} />,
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <span className="strong">{name}</span>,
    },
    { title: <Th icon="hash" label="PID" />, dataIndex: 'pid', align: 'right', sorter: (a, b) => a.pid - b.pid },
    {
      title: <Th icon="check" label={t('Status')} />,
      dataIndex: 'status',
      render: (status: ProcessStatus) => <Tag color={STATUS()[status].color}>{STATUS()[status].label}</Tag>,
    },
    { title: <Th icon="users" label={t('User')} />, dataIndex: 'user' },
    {
      title: <Th icon="pulse" label="CPU" />,
      dataIndex: 'cpu',
      align: 'right',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.cpu - b.cpu,
      render: (cpu: number) => `${cpu.toFixed(1)}%`,
    },
    { title: <Th icon="chip" label={t('Memory')} />, dataIndex: 'memoryMb', align: 'right', sorter: (a, b) => a.memoryMb - b.memoryMb, render: memory },
    {
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, p) => (
        <Button size="small" aria-label={t('End {name} (PID {pid})', { name: p.name, pid: p.pid })}
          onClick={() => notSupported(t('Ending processes'))}
        >
          {t('End task')}
        </Button>
      ),
    },
  ]

  return (
    <>
      <div className="filters filters-split">
        <Input
          allowClear
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('Search name, PID or user')}
          aria-label={t('Search processes')}
          style={{ maxWidth: 280 }}
        />
        <span className="sub">{t('Updates every 5 s')}</span>
      </div>
      <Table<DeviceProcess>
        columns={columns}
        dataSource={rows}
        loading={list.isPending}
        rowKey="pid"
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 10, hideOnSinglePage: true, showTotal: (total, [from, to]) => `${from}–${to} / ${total}` }}
        locale={{
          emptyText: (
            <span className="muted">
              {list.isError
                ? `${t("Processes didn't load.")} ${userMessage(list.error)}`
                : query
                  ? t('No process matches this search.')
                  : t('No processes reported.')}
            </span>
          ),
        }}
      />
    </>
  )
}
