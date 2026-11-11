import { useQuery } from '@tanstack/react-query'
import { Button, Card, Input, Table, Tag, type TableProps } from 'antd'
import { useState } from 'react'
import { Th } from '../../components/Icon'
import { useNotSupported } from '../../hooks/useNotSupported'
import { userMessage } from '../../services/http'
import { processesQuery } from '../../services/queries'
import type { Device, DeviceProcess, ProcessStatus } from '../../types/device'

const STATUS: Record<ProcessStatus, { label: string; color: string }> = {
  running: { label: 'Running', color: 'success' },
  suspended: { label: 'Suspended', color: 'default' },
  'not-responding': { label: 'Not responding', color: 'warning' },
}

const memory = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`)

export default function ProcessesCard({ device }: { device: Device }) {
  const notSupported = useNotSupported()
  const [q, setQ] = useState('')
  const list = useQuery({ ...processesQuery(device.host), enabled: device.online, refetchInterval: 5000 })
  const query = q.trim().toLowerCase()
  const rows = (list.data ?? []).filter(
    (p) => !query || p.name.toLowerCase().includes(query) || p.user.toLowerCase().includes(query) || String(p.pid).includes(query),
  )

  const columns: TableProps<DeviceProcess>['columns'] = [
    {
      title: <Th icon="box" label="Name" />,
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <span className="strong">{name}</span>,
    },
    { title: <Th icon="hash" label="PID" />, dataIndex: 'pid', align: 'right', sorter: (a, b) => a.pid - b.pid },
    {
      title: <Th icon="check" label="Status" />,
      dataIndex: 'status',
      render: (status: ProcessStatus) => <Tag color={STATUS[status].color}>{STATUS[status].label}</Tag>,
    },
    { title: <Th icon="users" label="User" />, dataIndex: 'user' },
    {
      title: <Th icon="pulse" label="CPU" />,
      dataIndex: 'cpu',
      align: 'right',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.cpu - b.cpu,
      render: (cpu: number) => `${cpu.toFixed(1)}%`,
    },
    { title: <Th icon="chip" label="Memory" />, dataIndex: 'memoryMb', align: 'right', sorter: (a, b) => a.memoryMb - b.memoryMb, render: memory },
    {
      title: <Th icon="more" label="Actions" />,
      key: 'actions',
      render: (_, p) => (
        <Button size="small" aria-label={`End ${p.name} (PID ${p.pid})`} onClick={() => notSupported('Ending processes')}>
          End task
        </Button>
      ),
    },
  ]

  return (
    <Card
      className="table-card"
      title={device.online && list.data ? `Processes (${list.data.length})` : 'Processes'}
      extra={device.online ? <span className="muted">Updates every 5 s</span> : null}
      styles={{ body: { padding: 0 } }}
    >
      {!device.online ? (
        <p className="muted" style={{ padding: 16, margin: 0 }}>
          Processes show while the device is online. {device.host} has no open tunnel right now.
        </p>
      ) : (
        <>
          <div className="filters">
            <Input
              allowClear
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, PID or user"
              aria-label="Search processes"
              style={{ maxWidth: 280 }}
            />
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
                  {list.isError ? `Processes didn't load. ${userMessage(list.error)}` : query ? 'No process matches this search.' : 'No processes reported.'}
                </span>
              ),
            }}
          />
        </>
      )}
    </Card>
  )
}
