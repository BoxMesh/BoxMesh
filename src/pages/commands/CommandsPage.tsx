import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Checkbox, Form, Input, Modal, Popconfirm, Radio, Segmented, Table, Tag, Tooltip, type TableProps } from 'antd'
import { useState } from 'react'
import DevicePicker from '../../components/DevicePicker'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import ScopeFields from '../../components/ScopeFields'
import { t } from '../../i18n'
import { createCommandRule, deleteCommandRule, updateCommandRule, type NewCommandRule } from '../../services/adminService'
import { commandRulesQuery, devicesQuery, groupsQuery } from '../../services/queries'
import type { CommandMatch, CommandRule } from '../../types/admin'
import type { Device, DeviceGroup } from '../../types/device'
import type { Shell } from '../../types/remote'
import { blockedBy, regexError } from '../../utils/commands'
import { scopeOf, type Scope } from '../../utils/devices'

const SHELLS: Shell[] = ['PowerShell', 'CMD', 'Bash']
const MATCHES: { value: CommandMatch; label: string; short: string; help: string }[] = [
  {
    value: 'starts',
    label: t('Starts with'),
    short: t('Begins with these words'),
    help: t('The command begins with these words. "format" blocks "format C:", not "Format-Table".'),
  },
  {
    value: 'contains',
    label: t('Contains'),
    short: t('Anywhere in the line'),
    help: t('These words appear anywhere, so it also catches "echo hi && shutdown".'),
  },
  { value: 'regex', label: t('Regex'), short: t('A regular expression'), help: t('A regular expression, not case-sensitive.') },
]
const matchLabel = (m: CommandMatch) => MATCHES.find((x) => x.value === m)!.label
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
      message.success(t('"{pattern}" is no longer blocked', { pattern: rule.pattern }))
    },
    onError: (error) => message.error(error.message),
  })

  const hit = testCommand.trim() && testDevice ? blockedBy(rules, testDevice, testShell, testCommand) : undefined
  // One key keeps the Japanese word order; the pattern's <code> goes where {pattern} is.
  const [beforeHit, afterHit] = hit
    ? t('by {pattern} ({match}).', { match: matchLabel(hit.match).toLowerCase() }).split('{pattern}')
    : []

  const columns: TableProps<CommandRule>['columns'] = [
    { title: <Th icon="terminal" label={t('Command')} />, key: 'pattern', render: (_, r) => <code>{r.pattern}</code> },
    { title: <Th icon="search" label={t('Match')} />, key: 'match', render: (_, r) => matchLabel(r.match) },
    {
      title: <Th icon="chip" label={t('Shells')} />,
      key: 'shells',
      render: (_, r) =>
        r.shells.length ? (
          <span className="device-groups">
            {r.shells.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </span>
        ) : (
          <span className="muted">{t('All shells')}</span>
        ),
    },
    {
      title: <Th icon="devices" label={t('Applies to')} />,
      key: 'scope',
      render: (_, r) => {
        const scope = scopeOf(r)
        if (scope === 'all') return <span className="muted">{t('All devices')}</span>
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
    { title: <Th icon="warning" label={t('Reason')} />, key: 'reason', render: (_, r) => r.reason || <span className="muted">—</span> },
    {
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, r) => (
        <div className="row-actions">
          <Tooltip title={t('Edit "{name}"', { name: r.pattern })}>
            <button type="button" className="icon-btn" aria-label={t('Edit "{name}"', { name: r.pattern })} onClick={() => setEditing(r)}>
              <Icon name="edit" size={14} />
            </button>
          </Tooltip>
          <Popconfirm
            title={t('Stop blocking "{pattern}"?', { pattern: r.pattern })}
            description={t('The rule is deleted and anyone can run this command again.')}
            okText={t('Delete')}
            okButtonProps={{ danger: true }}
            onConfirm={() => remove.mutate(r)}
          >
            <button type="button" className="icon-btn" aria-label={t('Delete "{name}"', { name: r.pattern })}>
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
        title={t('Command rules')}
        subtitle={t(
          'Commands nobody can run in Remote Terminal, the Admin included: on every device, or only on some groups or devices. EdgePanel refuses a matching command before it reaches the device, and the terminal shows the reason.',
        )}
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setEditing('new')}>
            {t('Add rule')}
          </Button>
        }
      />

      <Card title={t('Test a command')}>
        <div className="rule-test">
          <DevicePicker devices={devices} host={testHost} onChange={setTestHost} />
          <Segmented<Shell> aria-label={t('Shell to test in')} options={SHELLS} value={testShell} onChange={setTestShell} />
          <Input
            className="mono"
            placeholder={t('e.g. shutdown /r /t 0')}
            aria-label={t('Command to test')}
            allowClear
            value={testCommand}
            onChange={(e) => setTestCommand(e.target.value)}
          />
        </div>
        <div className="rule-test-result" aria-live="polite">
          {!testCommand.trim() ? (
            <span className="muted">{t('Type a command to see whether a rule blocks it.')}</span>
          ) : hit ? (
            <>
              <Tag color="error">{t('Blocked')}</Tag>
              <span>
                {beforeHit}
                <code>{hit.pattern}</code>
                {afterHit} {hit.reason}
              </span>
            </>
          ) : (
            <>
              <Tag color="success">{t('Allowed')}</Tag>
              <span className="muted">{t('No rule matches it in {shell} on {host}.', { shell: testShell, host: testHost })}</span>
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
          locale={{ emptyText: <span className="muted">{t('Nothing is blocked. Add the first rule.')}</span> }}
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

const MATCH_VERB: Record<CommandMatch, string> = { starts: t('starts with'), contains: t('contains'), regex: t('matches') }

function RuleDialog({ rule, rules, groups, devices, onClose }: DialogProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<Fields>()
  const match = Form.useWatch('match', form) ?? 'starts'
  const pattern = Form.useWatch('pattern', form) ?? ''
  const shells = Form.useWatch('shells', form) ?? []
  const scope = Form.useWatch('scope', form) ?? 'all'
  const groupIds = Form.useWatch('groupIds', form) ?? []
  const hosts = Form.useWatch('hosts', form) ?? []
  const isNew = rule === 'new'
  const current = rule && rule !== 'new' ? rule : null

  const save = useMutation({
    mutationFn: (values: NewCommandRule) => (current ? updateCommandRule(current.id, values) : createCommandRule(values)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['command-rules'] })
      message.success(isNew ? t('"{pattern}" is blocked', { pattern: saved.pattern }) : t('Rule saved'))
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

  const n = scope === 'groups' ? groupIds.length : hosts.length
  const where =
    scope === 'groups'
      ? n ? (n === 1 ? t('on {n} group', { n }) : t('on {n} groups', { n })) : t('on the groups you pick')
      : scope === 'hosts'
        ? n ? (n === 1 ? t('on {n} device', { n }) : t('on {n} devices', { n })) : t('on the devices you pick')
        : t('on every device')
  const sentence = t('Blocks any command that {verb} "{pattern}", in {shells}, {where}.', {
    verb: MATCH_VERB[match],
    pattern: pattern.trim() || '…',
    shells: shells.length ? shells.join(', ') : t('every shell'),
    where,
  })

  return (
    <Modal
      title={isNew ? t('Add a command rule') : t('Edit "{name}"', { name: current?.pattern ?? '' })}
      open={Boolean(rule)}
      onCancel={onClose}
      width={680}
      destroyOnHidden
      footer={null}
    >
      <Form<Fields>
        form={form}
        className="dialog-form"
        layout="vertical"
        requiredMark={false}
        initialValues={{ ...(current ?? EMPTY), scope: scopeOf(current ?? EMPTY) }}
        onFinish={submit}
      >
        <section className="form-section">
          <h3>{t('Command')}</h3>
          <p className="section-hint" aria-live="polite">
            {sentence}
          </p>
          <Form.Item
            name="pattern"
            label={match === 'regex' ? t('Pattern') : t('Command')}
            dependencies={['match', 'scope', 'groupIds', 'hosts']}
            rules={[
              { required: true, whitespace: true, message: t('Enter a command.') },
              ({ getFieldValue }) => ({
                validator: (_, value: string) => {
                  if (!value?.trim()) return Promise.resolve()
                  const kind = getFieldValue('match') as CommandMatch
                  const error = kind === 'regex' ? regexError(value) : null
                  if (error) return Promise.reject(new Error(t('Not a valid regex: {error}', { error })))
                  const scoped = getFieldValue('scope') as Scope
                  const groupKey = scoped === 'groups' ? key(getFieldValue('groupIds') ?? []) : ''
                  const hostKey = scoped === 'hosts' ? key(getFieldValue('hosts') ?? []) : ''
                  const twin = rules.find(
                    (r) => r.id !== current?.id && r.match === kind && same(r.pattern, value) && key(r.groupIds) === groupKey && key(r.hosts) === hostKey,
                  )
                  return twin ? Promise.reject(new Error(t('There is already a rule for this.'))) : Promise.resolve()
                },
              }),
            ]}
          >
            <Input
              className="mono"
              placeholder={match === 'regex' ? t('e.g. {example}', { example: String.raw`rm\s+-rf\s+/` }) : t('e.g. shutdown')}
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item name="match" label={t('Match')} extra={MATCHES.find((m) => m.value === match)?.help}>
            <Radio.Group className="choice-cards">
              {MATCHES.map((m) => (
                <Radio key={m.value} value={m.value} className="choice-card">
                  <span className="choice-title">{m.label}</span>
                  <span className="choice-desc">{m.short}</span>
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </section>

        <section className="form-section">
          <h3>{t('Where')}</h3>
          <p className="section-hint">{t('Which devices and shells refuse it. Leave every shell unticked to block it in all of them.')}</p>
          <ScopeFields scope={scope} groups={groups} devices={devices} label={t('Devices')} />
          <Form.Item name="shells" label={t('Shells')}>
            <Checkbox.Group className="choice-cards">
              {SHELLS.map((s) => (
                <Checkbox key={s} value={s} className="choice-card">
                  <span className="choice-title mono">{s}</span>
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </section>

        <section className="form-section">
          <h3>{t('Reason')}</h3>
          <p className="section-hint">{t('Shown in the terminal to whoever runs it, so they know what to do instead.')}</p>
          <Form.Item name="reason">
            <Input.TextArea rows={2} maxLength={200} placeholder={t('e.g. Restarts the machine. Ask IT to schedule it.')} aria-label={t('Reason')} />
          </Form.Item>
        </section>

        <div className="dialog-footer">
          <span className="dialog-buttons">
            <Button onClick={onClose}>{t('Cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              {isNew ? t('Add rule') : t('Save changes')}
            </Button>
          </span>
        </div>
      </Form>
    </Modal>
  )
}
