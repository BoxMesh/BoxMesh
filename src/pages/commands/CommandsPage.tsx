import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, Modal, Popconfirm, Segmented, Select, Table, Tag, Tooltip, type TableProps } from 'antd'
import { useState } from 'react'
import DevicePicker from '../../components/DevicePicker'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { createCommandRule, deleteCommandRule, updateCommandRule, type NewCommandRule } from '../../services/adminService'
import { commandRulesQuery, devicesQuery, groupsQuery } from '../../services/queries'
import type { CommandMatch, CommandRule } from '../../types/admin'
import type { Device, DeviceGroup } from '../../types/device'
import type { Shell } from '../../types/remote'
import { blockedBy, regexError } from '../../utils/commands'

const SHELLS: Shell[] = ['PowerShell', 'CMD', 'Bash']
const MATCHES: { value: CommandMatch; label: string; help: string }[] = [
  { value: 'starts', label: 'Starts with', help: 'The command begins with these words. "format" blocks "format C:", not "Format-Table".' },
  { value: 'contains', label: 'Contains', help: 'These words appear anywhere, so it also catches "echo hi && shutdown".' },
  { value: 'regex', label: 'Regex', help: 'A regular expression, not case-sensitive.' },
]
const matchLabel = (m: CommandMatch) => MATCHES.find((x) => x.value === m)!.label
type Scope = 'all' | 'groups' | 'hosts'
const scopeOf = (r: Pick<CommandRule, 'groupIds' | 'hosts'>): Scope => (r.groupIds.length ? 'groups' : r.hosts.length ? 'hosts' : 'all')
const EMPTY: NewCommandRule = { pattern: '', match: 'starts', shells: [], reason: '', groupIds: [], hosts: [] }

// Records only show; adding and changing a rule happen in the rule dialog, like users.
export default function CommandsPage() {
  const [{ data: rules }, { data: groups }, { data: devices }] = useSuspenseQueries({
    queries: [commandRulesQuery, groupsQuery, devicesQuery],
  })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<CommandRule | 'new' | null>(null)
  const [testShell, setTestShell] = useState<Shell>('PowerShell')
  const [testCommand, setTestCommand] = useState('')
  const [testHost, setTestHost] = useState(devices[0]?.host ?? '')
  const testDevice = devices.find((d) => d.host === testHost)
  const names = new Map(groups.map((g) => [g.id, g.name]))
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['command-rules'] })

  const remove = useMutation({
    mutationFn: (rule: CommandRule) => deleteCommandRule(rule.id),
    onSuccess: (_, rule) => {
      refresh()
      message.success(`"${rule.pattern}" is no longer blocked`)
    },
    onError: (error) => message.error(error.message),
  })

  const hit = testCommand.trim() && testDevice ? blockedBy(rules, testDevice, testShell, testCommand) : undefined

  const columns: TableProps<CommandRule>['columns'] = [
    { title: <Th icon="terminal" label="Command" />, key: 'pattern', render: (_, r) => <code>{r.pattern}</code> },
    { title: <Th icon="search" label="Match" />, key: 'match', render: (_, r) => matchLabel(r.match) },
    {
      title: <Th icon="chip" label="Shells" />,
      key: 'shells',
      render: (_, r) =>
        r.shells.length ? (
          <span className="device-groups">
            {r.shells.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </span>
        ) : (
          <span className="muted">All shells</span>
        ),
    },
    {
      title: <Th icon="devices" label="Applies to" />,
      key: 'scope',
      render: (_, r) => {
        const scope = scopeOf(r)
        if (scope === 'all') return <span className="muted">All devices</span>
        // A group deleted since keeps its id on the rule until it is saved again; it has no name to show.
        const labels = scope === 'groups' ? r.groupIds.filter((id) => names.has(id)).map((id) => names.get(id)!) : r.hosts
        return (
          <span className="device-groups">
            {labels.map((label) => (
              <Tag key={label} color={scope === 'groups' ? 'processing' : 'default'}>
                {label}
              </Tag>
            ))}
          </span>
        )
      },
    },
    { title: <Th icon="warning" label="Reason" />, key: 'reason', render: (_, r) => r.reason || <span className="muted">—</span> },
    {
      title: <Th icon="more" label="Actions" />,
      key: 'actions',
      render: (_, r) => (
        <div className="row-actions">
          <Tooltip title={`Edit "${r.pattern}"`}>
            <button type="button" className="icon-btn" aria-label={`Edit "${r.pattern}"`} onClick={() => setEditing(r)}>
              <Icon name="edit" size={14} />
            </button>
          </Tooltip>
          <Popconfirm
            title={`Stop blocking "${r.pattern}"?`}
            description="The rule is deleted and anyone can run this command again."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => remove.mutate(r)}
          >
            <button type="button" className="icon-btn" aria-label={`Delete "${r.pattern}"`}>
              <Icon name="trash" size={14} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Commands"
        subtitle="Commands nobody can run in Remote Terminal, the Admin included: on every device, or only on some groups or devices. EdgePanel refuses a matching command before it reaches the device, and the terminal shows the reason."
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setEditing('new')}>
            Add rule
          </Button>
        }
      />

      <Card title="Test a command">
        <div className="rule-test">
          <DevicePicker devices={devices} host={testHost} onChange={setTestHost} />
          <Segmented<Shell> aria-label="Shell to test in" options={SHELLS} value={testShell} onChange={setTestShell} />
          <Input
            className="mono"
            prefix={<Icon name="terminal" size={14} />}
            placeholder="e.g. shutdown /r /t 0"
            aria-label="Command to test"
            allowClear
            value={testCommand}
            onChange={(e) => setTestCommand(e.target.value)}
          />
        </div>
        <div className="rule-test-result" aria-live="polite">
          {!testCommand.trim() ? (
            <span className="muted">Type a command to see whether a rule blocks it.</span>
          ) : hit ? (
            <>
              <Tag color="error">Blocked</Tag>
              <span>
                by <code>{hit.pattern}</code> ({matchLabel(hit.match).toLowerCase()}). {hit.reason}
              </span>
            </>
          ) : (
            <>
              <Tag color="success">Allowed</Tag>
              <span className="muted">
                No rule matches it in {testShell} on {testHost}.
              </span>
            </>
          )}
        </div>
      </Card>

      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <Table<CommandRule>
          columns={columns}
          dataSource={rules}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <span className="muted">Nothing is blocked. Add the first rule.</span> }}
        />
      </Card>

      <RuleDialog rule={editing} rules={rules} groups={groups} devices={devices} onClose={() => setEditing(null)} />
    </div>
  )
}

interface DialogProps {
  rule: CommandRule | 'new' | null
  rules: CommandRule[]
  groups: DeviceGroup[]
  devices: Device[]
  onClose: () => void
}

type Fields = NewCommandRule & { scope: Scope }

function RuleDialog({ rule, rules, groups, devices, onClose }: DialogProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<Fields>()
  const match = Form.useWatch('match', form) ?? 'starts'
  const scope = Form.useWatch('scope', form) ?? 'all'
  const isNew = rule === 'new'
  const current = rule && rule !== 'new' ? rule : null

  const save = useMutation({
    mutationFn: (values: NewCommandRule) => (current ? updateCommandRule(current.id, values) : createCommandRule(values)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['command-rules'] })
      message.success(isNew ? `"${saved.pattern}" is blocked` : 'Rule saved')
      onClose()
    },
    onError: (error) => message.error(error.message),
  })

  const same = (a: string, b: string) => a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase()
  const key = (ids: string[]) => [...ids].sort().join('|')
  // One scope at a time: whatever the other picker still holds is dropped on save.
  const submit = ({ scope, ...values }: Fields) =>
    save.mutate({
      ...values,
      pattern: values.pattern.trim(),
      reason: values.reason?.trim() ?? '',
      groupIds: scope === 'groups' ? values.groupIds : [],
      hosts: scope === 'hosts' ? values.hosts : [],
    })

  return (
    <Modal
      title={isNew ? 'Add a rule' : `Edit "${current?.pattern}"`}
      open={Boolean(rule)}
      onCancel={onClose}
      width={640}
      destroyOnHidden
      footer={
        <div className="drawer-footer">
          <span className="screen-spacer" />
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={save.isPending} onClick={() => form.submit()}>
            {isNew ? 'Add rule' : 'Save changes'}
          </Button>
        </div>
      }
    >
      <Form<Fields>
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ ...(current ?? EMPTY), scope: scopeOf(current ?? EMPTY) }}
        onFinish={submit}
      >
        <Form.Item label="Match" name="match" extra={MATCHES.find((m) => m.value === match)?.help}>
          <Segmented<CommandMatch> block options={MATCHES.map(({ value, label }) => ({ value, label }))} />
        </Form.Item>
        <Form.Item
          name="pattern"
          label="Command"
          dependencies={['match', 'scope', 'groupIds', 'hosts']}
          rules={[
            { required: true, whitespace: true, message: 'Enter a command.' },
            ({ getFieldValue }) => ({
              validator: (_, value: string) => {
                if (!value?.trim()) return Promise.resolve()
                const kind = getFieldValue('match') as CommandMatch
                const error = kind === 'regex' ? regexError(value) : null
                if (error) return Promise.reject(new Error(`Not a valid regex: ${error}`))
                const where = getFieldValue('scope') as Scope
                const groupIds = where === 'groups' ? key(getFieldValue('groupIds') ?? []) : ''
                const hosts = where === 'hosts' ? key(getFieldValue('hosts') ?? []) : ''
                const twin = rules.find(
                  (r) =>
                    r.id !== current?.id &&
                    r.match === kind &&
                    same(r.pattern, value) &&
                    key(r.groupIds) === groupIds &&
                    key(r.hosts) === hosts,
                )
                return twin ? Promise.reject(new Error('There is already a rule for this.')) : Promise.resolve()
              },
            }),
          ]}
        >
          <Input className="mono" placeholder={match === 'regex' ? String.raw`e.g. rm\s+-rf\s+/` : 'e.g. shutdown'} autoComplete="off" />
        </Form.Item>
        <Form.Item name="shells" label="Shells">
          <Select
            mode="multiple"
            allowClear
            placeholder="All shells"
            aria-label="Shells"
            options={SHELLS.map((s) => ({ value: s, label: s }))}
          />
        </Form.Item>
        <Form.Item name="scope" label="Applies to">
          <Segmented<Scope>
            block
            options={[
              { value: 'all', label: 'All devices' },
              { value: 'groups', label: 'Groups' },
              { value: 'hosts', label: 'Devices' },
            ]}
          />
        </Form.Item>
        {scope === 'groups' ? (
          <Form.Item name="groupIds" rules={[{ required: true, type: 'array', min: 1, message: 'Pick at least one group.' }]}>
            <Select
              mode="multiple"
              allowClear
              placeholder="Pick groups"
              aria-label="Groups"
              optionFilterProp="label"
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
            />
          </Form.Item>
        ) : null}
        {scope === 'hosts' ? (
          <Form.Item name="hosts" rules={[{ required: true, type: 'array', min: 1, message: 'Pick at least one device.' }]}>
            <Select
              mode="multiple"
              allowClear
              placeholder="Pick devices"
              aria-label="Devices"
              optionFilterProp="label"
              options={devices.map((d) => ({ value: d.host, label: `${d.host} · ${d.alias}` }))}
            />
          </Form.Item>
        ) : null}
        <Form.Item name="reason" label="Reason" extra="Shown in the terminal to whoever runs it.">
          <Input.TextArea rows={2} maxLength={200} placeholder="e.g. Restarts the machine. Ask IT to schedule it." />
        </Form.Item>
      </Form>
    </Modal>
  )
}
