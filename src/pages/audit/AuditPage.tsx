import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Card, Input, Select, Switch, Table, Tag, type TableProps } from 'antd'
import { useState } from 'react'
import { Icon } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { setAlertRule } from '../../services/opsService'
import { alertRulesQuery, auditLogQuery } from '../../services/queries'
import type { AlertRule, AuditEntry } from '../../types/ops'
import { formatDateTime } from '../../utils/time'

const ALL = { value: '', label: 'All' }
const OUTCOMES = [ALL, { value: 'ok', label: 'Succeeded' }, { value: 'failed', label: 'Failed' }]

const columns: TableProps<AuditEntry>['columns'] = [
  { title: 'When', key: 'at', render: (_, e) => formatDateTime(e.at) },
  { title: 'Who', dataIndex: 'actor' },
  { title: 'Action', dataIndex: 'action' },
  { title: 'Target', key: 'target', render: (_, e) => <code>{e.target}</code> },
  {
    title: 'Outcome',
    key: 'outcome',
    render: (_, e) => <Tag color={e.outcome === 'ok' ? 'success' : 'error'}>{e.outcome === 'ok' ? 'ok' : 'failed'}</Tag>,
  },
  { title: 'From', dataIndex: 'ip' },
]

export default function AuditPage() {
  const [{ data: log }, { data: rules }] = useSuspenseQueries({ queries: [auditLogQuery, alertRulesQuery] })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [actor, setActor] = useState('')
  const [outcome, setOutcome] = useState('')

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => setAlertRule(id, enabled),
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] })
      message.success(`${rule.name} ${rule.enabled ? 'enabled' : 'disabled'}`)
    },
    onError: (error) => message.error(error.message),
  })

  const actors = [...new Set(log.map((e) => e.actor))].sort()
  const needle = q.trim().toLowerCase()
  const rows = log.filter(
    (e) =>
      (!needle || [e.action, e.target, e.actor].some((v) => v.toLowerCase().includes(needle))) &&
      (!actor || e.actor === actor) &&
      (!outcome || e.outcome === outcome),
  )

  const ruleColumns: TableProps<AlertRule>['columns'] = [
    {
      title: 'Rule',
      key: 'name',
      render: (_, r) => (
        <>
          <span className="strong">{r.name}</span>
          <div className="sub">{r.condition}</div>
        </>
      ),
    },
    { title: 'Notify', dataIndex: 'channel' },
    {
      title: 'On',
      key: 'enabled',
      render: (_, r) => (
        <Switch
          size="small"
          checked={r.enabled}
          loading={toggle.isPending && toggle.variables?.id === r.id}
          onChange={(enabled) => toggle.mutate({ id: r.id, enabled })}
          aria-label={`${r.name} alerts`}
        />
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader title="Audit & Alerts" subtitle="Who did what, on which device — and what raises an alert." />

      <Card className="table-card" title="Audit log" styles={{ body: { padding: 0 } }}>
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

      <Card className="table-card" title="Alert rules" styles={{ body: { padding: 0 } }}>
        <Table<AlertRule> columns={ruleColumns} dataSource={rules} rowKey="id" pagination={false} scroll={{ x: 'max-content' }} />
      </Card>
    </div>
  )
}
