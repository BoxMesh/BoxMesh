import { useSuspenseQuery } from '@tanstack/react-query'
import { Card, Input, Select, Table, Tag, type TableProps } from 'antd'
import { useState } from 'react'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { auditLogQuery } from '../../services/queries'
import type { AuditEntry } from '../../types/ops'
import { formatDateTime } from '../../utils/time'

const ALL = { value: '', label: 'All' }
const OUTCOMES = [ALL, { value: 'ok', label: 'Succeeded' }, { value: 'failed', label: 'Failed' }]

const columns: TableProps<AuditEntry>['columns'] = [
  { title: <Th icon="clock" label="When" />, key: 'at', render: (_, e) => formatDateTime(e.at) },
  { title: <Th icon="users" label="Who" />, dataIndex: 'actor' },
  { title: <Th icon="jobs" label="Action" />, dataIndex: 'action' },
  { title: <Th icon="devices" label="Target" />, key: 'target', render: (_, e) => <code>{e.target}</code> },
  {
    title: <Th icon="check" label="Outcome" />,
    key: 'outcome',
    render: (_, e) => <Tag color={e.outcome === 'ok' ? 'success' : 'error'}>{e.outcome === 'ok' ? 'ok' : 'failed'}</Tag>,
  },
  { title: <Th icon="web" label="From" />, dataIndex: 'ip' },
]

export default function AuditPage() {
  const { data: log } = useSuspenseQuery(auditLogQuery)
  const [q, setQ] = useState('')
  const [actor, setActor] = useState('')
  const [outcome, setOutcome] = useState('')

  const actors = [...new Set(log.map((e) => e.actor))].sort()
  const needle = q.trim().toLowerCase()
  const rows = log.filter(
    (e) =>
      (!needle || [e.action, e.target, e.actor].some((v) => v.toLowerCase().includes(needle))) &&
      (!actor || e.actor === actor) &&
      (!outcome || e.outcome === outcome),
  )

  return (
    <div className="stack">
      <PageHeader title="Audit" subtitle="Who did what, on which device." />

      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <div className="filters">
          <Input
            className="search"
            allowClear
            prefix={<Icon name="search" size={14} />}
            placeholder="Action, target…"
            aria-label="Search the audit log"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <label className="filter">
            <span>Who</span>
            <Select
              value={actor}
              onChange={setActor}
              style={{ minWidth: 180 }}
              options={[ALL, ...actors.map((a) => ({ value: a, label: a }))]}
            />
          </label>
          <label className="filter">
            <span>Outcome</span>
            <Select value={outcome} onChange={setOutcome} style={{ minWidth: 130 }} options={OUTCOMES} />
          </label>
        </div>
        <Table<AuditEntry>
          columns={columns}
          dataSource={rows}
          rowKey="id"
          pagination={{ pageSize: 10, hideOnSinglePage: true, showTotal: (t, [from, to]) => `${from}–${to} / ${t}` }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <span className="muted">No entries match these filters.</span> }}
        />
      </Card>
    </div>
  )
}
