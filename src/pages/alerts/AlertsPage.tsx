import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Checkbox, Form, Input, Modal, Popconfirm, Table, Tag, Tooltip, type TableProps } from 'antd'
import type { TextAreaRef } from 'antd/es/input/TextArea'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import ChannelIcon from '../../components/ChannelIcon'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import ScopeFields from '../../components/ScopeFields'
import { t } from '../../i18n'
import { createAlert, deleteAlert, updateAlert, type NewAlert } from '../../services/alertService'
import { alertChannelsQuery, alertRulesQuery, alertsQuery, devicesQuery, groupsQuery } from '../../services/queries'
import type { Alert, AlertChannel, AlertRule } from '../../types/alert'
import type { Device, DeviceGroup } from '../../types/device'
import { conditionOf, DEFAULT_MESSAGE, destinationOf, KIND_LABEL, PLACEHOLDERS, renderMessage, unknownPlaceholders } from '../../utils/alerts'
import { scopeOf, type Scope } from '../../utils/devices'
import { formatDateTime } from '../../utils/time'

const EMPTY: NewAlert = { name: '', ruleIds: [], groupIds: [], hosts: [], channelIds: [], message: DEFAULT_MESSAGE }

export default function AlertsPage() {
  const [{ data: alerts }, { data: rules }, { data: channels }, { data: groups }, { data: devices }] = useSuspenseQueries({
    queries: [alertsQuery, alertRulesQuery, alertChannelsQuery, groupsQuery, devicesQuery],
  })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Alert | 'new' | null>(null)
  const ruleById = new Map(rules.map((r) => [r.id, r]))
  const channelById = new Map(channels.map((c) => [c.id, c]))
  const groupNames = new Map(groups.map((g) => [g.id, g.name]))

  const remove = useMutation({
    mutationFn: (alert: Alert) => deleteAlert(alert.id),
    onSuccess: (_, alert) => {
      queryClient.invalidateQueries({ queryKey: alertsQuery.queryKey })
      message.success(t('"{name}" deleted', { name: alert.name }))
    },
    onError: (error) => message.error(error.message),
  })

  const columns: TableProps<Alert>['columns'] = [
    { title: <Th icon="bell" label={t('Alert')} />, dataIndex: 'name', render: (name: string) => <span className="strong">{name}</span> },
    {
      title: <Th icon="warning" label={t('Rules')} />,
      key: 'rules',
      render: (_, a) => {
        const list = a.ruleIds.map((id) => ruleById.get(id)).filter((r): r is AlertRule => Boolean(r))
        return list.length ? (
          <span className="queue-tags">
            {list.map((r) => (
              <Tooltip key={r.id} title={conditionOf(r)}>
                <Tag>{r.name}</Tag>
              </Tooltip>
            ))}
          </span>
        ) : (
          <Tag color="warning">{t('No rule')}</Tag>
        )
      },
    },
    {
      title: <Th icon="devices" label={t('Applies to')} />,
      key: 'scope',
      render: (_, a) =>
        a.groupIds.length ? (
          <span className="queue-tags">
            {a.groupIds.map((id) => (
              <Tag key={id} color="processing">
                {groupNames.get(id) ?? id}
              </Tag>
            ))}
          </span>
        ) : a.hosts.length ? (
          <span className="queue-tags">
            {a.hosts.map((h) => (
              <Tag key={h}>{h}</Tag>
            ))}
          </span>
        ) : (
          <span className="muted">{t('All devices')}</span>
        ),
    },
    {
      title: <Th icon="mail" label={t('Send to')} />,
      key: 'channels',
      render: (_, a) => {
        const list = a.channelIds.map((id) => channelById.get(id)).filter((c): c is AlertChannel => Boolean(c))
        return list.length ? (
          <span className="queue-tags">
            {list.map((c) => (
              <Tag key={c.id} className="channel-tag">
                <ChannelIcon kind={c.kind} size={12} named />
                {c.name}
              </Tag>
            ))}
          </span>
        ) : (
          <Tag color="warning">{t('No channel')}</Tag>
        )
      },
    },
    {
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, a) => (
        <div className="row-actions">
          <Tooltip title={t('Edit "{name}"', { name: a.name })}>
            <button type="button" className="icon-btn" aria-label={t('Edit "{name}"', { name: a.name })} onClick={() => setEditing(a)}>
              <Icon name="edit" size={14} />
            </button>
          </Tooltip>
          <Popconfirm
            title={t('Delete "{name}"?', { name: a.name })}
            description={t('Its rules and channels stay; only this alert stops.')}
            okText={t('Delete')}
            okButtonProps={{ danger: true }}
            onConfirm={() => remove.mutate(a)}
          >
            <button type="button" className="icon-btn" aria-label={t('Delete "{name}"', { name: a.name })}>
              <Icon name="trash" size={14} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  const missing = [!rules.length && { to: '/alert-rules', text: t('a rule') }, !channels.length && { to: '/alert-channels', text: t('a channel') }].filter(
    (m): m is { to: string; text: string } => Boolean(m),
  )
  // One key keeps the Japanese word order; the links go where {items} is.
  const [beforeMissing, afterMissing] = t('Before an alert, add {items}.').split('{items}')

  return (
    <div className="stack">
      <PageHeader
        title={t('Alerts')}
        subtitle={t(
          'An alert applies rules to groups or devices and sends a message to your channels when one fires. EdgePanel checks every heartbeat, so alerts go out even when nobody has BoxMesh open.',
        )}
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setEditing('new')} disabled={missing.length > 0}>
            {t('Add alert')}
          </Button>
        }
      />
      {missing.length ? (
        <Card>
          <span className="muted">
            {beforeMissing}
            {missing.map((m, i) => (
              <span key={m.to}>
                {i ? t(' and ') : ''}
                <Link to={m.to}>{m.text}</Link>
              </span>
            ))}
            {afterMissing}
          </span>
        </Card>
      ) : null}
      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <Table<Alert>
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <span className="muted">{t('No alerts yet. Add one to hear about a device running hot or going offline.')}</span> }}
        />
      </Card>
      <AlertDialog alert={editing} rules={rules} channels={channels} groups={groups} devices={devices} onClose={() => setEditing(null)} />
    </div>
  )
}

type Fields = NewAlert & { scope: Scope }

function AlertDialog({
  alert,
  rules,
  channels,
  groups,
  devices,
  onClose,
}: {
  alert: Alert | 'new' | null
  rules: AlertRule[]
  channels: AlertChannel[]
  groups: DeviceGroup[]
  devices: Device[]
  onClose: () => void
}) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<Fields>()
  const [openedAt] = useState(() => formatDateTime(new Date().toISOString()))
  const textArea = useRef<TextAreaRef>(null)
  const current = alert && alert !== 'new' ? alert : null
  const scope = Form.useWatch('scope', form) ?? 'all'
  const ruleIds = Form.useWatch('ruleIds', form) ?? []
  const groupIds = Form.useWatch('groupIds', form) ?? []
  const hosts = Form.useWatch('hosts', form) ?? []
  const template = Form.useWatch('message', form) ?? ''

  const save = useMutation({
    mutationFn: (values: NewAlert) => (current ? updateAlert(current.id, values) : createAlert(values)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: alertsQuery.queryKey })
      message.success(current ? t('Alert saved') : t('"{name}" added', { name: saved.name }))
      onClose()
    },
    onError: (error) => message.error(error.message),
  })

  const submit = ({ scope, ...values }: Fields) =>
    save.mutate({
      ...values,
      name: values.name.trim(),
      groupIds: scope === 'groups' ? values.groupIds : [],
      hosts: scope === 'hosts' ? values.hosts : [],
    })

  // The preview fills the template from a real device in scope and the first ticked rule.
  const rule = rules.find((r) => ruleIds.includes(r.id)) ?? rules[0]
  const sample =
    devices.find((d) => (scope === 'groups' ? d.groups.some((g) => groupIds.includes(g)) : scope === 'hosts' ? hosts.includes(d.host) : true)) ??
    devices[0]
  const names = new Map(groups.map((g) => [g.id, g.name]))
  const preview =
    rule && sample
      ? renderMessage(template, {
          device: sample.host,
          alias: sample.alias,
          rule: rule.name,
          condition: conditionOf(rule),
          value: rule.metric === 'offline' ? 'offline' : `${sample[rule.metric]}%`,
          groups: sample.groups.map((id) => names.get(id) ?? id).join(', ') || '—',
          time: openedAt,
        })
      : template

  const insert = (key: string) => {
    const el = textArea.current?.resizableTextArea?.textArea
    const text = `{${key}}`
    const at = el?.selectionStart ?? template.length
    const end = el?.selectionEnd ?? at
    form.setFieldValue('message', template.slice(0, at) + text + template.slice(end))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(at + text.length, at + text.length)
    })
  }

  return (
    <Modal
      title={current ? t('Edit "{name}"', { name: current.name }) : t('Add an alert')}
      open={Boolean(alert)}
      onCancel={onClose}
      width={720}
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
        <Form.Item name="name" label={t('Alert name')} rules={[{ required: true, whitespace: true, message: t('Name the alert.') }]}>
          <Input maxLength={60} placeholder={t('e.g. Servers')} />
        </Form.Item>

        <section className="form-section">
          <h3>{t('Rules')}</h3>
          <p className="section-hint">{t('A message goes out when any ticked rule fires on a device below.')}</p>
          <Form.Item name="ruleIds" rules={[{ required: true, type: 'array', min: 1, message: t('Tick at least one rule.') }]}>
            <Checkbox.Group className="choice-cards">
              {rules.map((r) => (
                <Checkbox key={r.id} value={r.id} className="choice-card">
                  <span className="choice-title">{r.name}</span>
                  <span className="choice-desc">{conditionOf(r)}</span>
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </section>

        <section className="form-section">
          <h3>{t('Devices')}</h3>
          <p className="section-hint">{t('Which groups or devices the rules watch.')}</p>
          <ScopeFields scope={scope} groups={groups} devices={devices} label={null} />
        </section>

        <section className="form-section">
          <h3>{t('Send to')}</h3>
          <p className="section-hint">{t('Every ticked channel gets the message.')}</p>
          <Form.Item name="channelIds" rules={[{ required: true, type: 'array', min: 1, message: t('Tick at least one channel.') }]}>
            <Checkbox.Group className="choice-list">
              {channels.map((c) => (
                <Checkbox key={c.id} value={c.id} className="choice-card">
                  <span className="choice-title">
                    <ChannelIcon kind={c.kind} />
                    {c.name}
                    <Tag>{KIND_LABEL()[c.kind]}</Tag>
                  </span>
                  <span className="choice-desc mono">{destinationOf(c)}</span>
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </section>

        <section className="form-section">
          <h3>{t('Message')}</h3>
          <p className="section-hint">{t('What the channels receive. Click a field to insert it where the cursor is.')}</p>
          <div className="placeholder-chips" role="group" aria-label={t('Insert a field')}>
            {PLACEHOLDERS.map((key) => (
              <Button key={key} size="small" className="mono" onClick={() => insert(key)}>
                {`{${key}}`}
              </Button>
            ))}
          </div>
          <Form.Item
            name="message"
            rules={[
              { required: true, whitespace: true, message: t('Write the message.') },
              {
                validator: (_, v: string = '') => {
                  const bad = unknownPlaceholders(v)
                  return bad.length ? Promise.reject(new Error(t('Unknown field: {field}', { field: `{${bad[0]}}` }))) : Promise.resolve()
                },
              },
            ]}
          >
            <Input.TextArea ref={textArea} rows={4} maxLength={1000} className="mono" aria-label={t('Message')} />
          </Form.Item>
          <div className="message-preview" aria-live="polite">
            <span className="sub">
              {t('Preview')}
              {sample ? ` · ${sample.host}` : ''}
            </span>
            <p>{preview}</p>
          </div>
        </section>

        <div className="dialog-footer">
          <span className="dialog-buttons">
            <Button onClick={onClose}>{t('Cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              {current ? t('Save changes') : t('Add alert')}
            </Button>
          </span>
        </div>
      </Form>
    </Modal>
  )
}
