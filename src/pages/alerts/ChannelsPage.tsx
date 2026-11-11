import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Radio, Select, Table, Tooltip, type TableProps } from 'antd'
import { useState } from 'react'
import ChannelIcon from '../../components/ChannelIcon'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { t } from '../../i18n'
import { createChannel, deleteChannel, testChannel, updateChannel } from '../../services/alertService'
import { alertChannelsQuery, alertsQuery } from '../../services/queries'
import type { AlertChannel, ChannelInput, ChannelKind } from '../../types/alert'
import { isChatId, isDiscordWebhook, isEmail, KIND_LABEL } from '../../utils/alerts'

const KINDS: ChannelKind[] = ['telegram', 'discord', 'email']
const EMPTY: ChannelInput = { kind: 'telegram', name: '', smtpHost: 'smtp.gmail.com', smtpPort: 587, to: [] }

export default function ChannelsPage() {
  const [{ data: channels }, { data: alerts }] = useSuspenseQueries({ queries: [alertChannelsQuery, alertsQuery] })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<AlertChannel | 'new' | null>(null)
  const usedBy = (id: string) => alerts.filter((a) => a.channelIds.includes(id)).length

  const remove = useMutation({
    mutationFn: (channel: AlertChannel) => deleteChannel(channel.id),
    onSuccess: (_, channel) => {
      queryClient.invalidateQueries({ queryKey: alertChannelsQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: alertsQuery.queryKey })
      message.success(t('"{name}" deleted', { name: channel.name }))
    },
    onError: (error) => message.error(error.message),
  })

  const test = useMutation({
    mutationFn: (channel: AlertChannel) => testChannel(channel.id),
    onSuccess: (_, channel) => message.success(t('Test message sent to {name}. Check that it arrived.', { name: channel.name })),
    onError: (error, channel) => message.error(`${channel.name}: ${error.message}`),
  })

  const columns: TableProps<AlertChannel>['columns'] = [
    { title: <Th icon="mail" label={t('Channel')} />, dataIndex: 'name', render: (name: string) => <span className="strong">{name}</span> },
    { title: <Th icon="tag" label={t('Type')} />, dataIndex: 'kind', render: (kind: ChannelKind) => (
        <span className="channel-kind">
          <ChannelIcon kind={kind} />
          {KIND_LABEL()[kind]}
        </span>
      ),
    },
    {
      title: <Th icon="bell" label={t('Used by')} />,
      key: 'used',
      render: (_, c) => {
        const n = usedBy(c.id)
        return n ? (n === 1 ? t('{n} alert', { n }) : t('{n} alerts', { n })) : <span className="muted">{t('No alerts')}</span>
      },
    },
    {
      title: <Th icon="mail" label={t('Test')} />,
      key: 'test',
      render: (_, c) => (
        <Button
          size="small"
          aria-label={t('Send a test message to {name}', { name: c.name })}
          loading={test.isPending && test.variables?.id === c.id}
          onClick={() => test.mutate(c)}
        >
          {t('Send test')}
        </Button>
      ),
    },
    {
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, c) => {
        const n = usedBy(c.id)
        return (
          <div className="row-actions">
            <Tooltip title={t('Edit "{name}"', { name: c.name })}>
              <button type="button" className="icon-btn" aria-label={t('Edit "{name}"', { name: c.name })} onClick={() => setEditing(c)}>
                <Icon name="edit" size={14} />
              </button>
            </Tooltip>
            <Popconfirm
              title={t('Delete "{name}"?', { name: c.name })}
              description={n ? (n === 1 ? t('{n} alert stop sending here.', { n }) : t('{n} alerts stop sending here.', { n })) : t('No alert sends here.')}
              okText={t('Delete')}
              okButtonProps={{ danger: true }}
              onConfirm={() => remove.mutate(c)}
            >
              <button type="button" className="icon-btn" aria-label={t('Delete "{name}"', { name: c.name })}>
                <Icon name="trash" size={14} />
              </button>
            </Popconfirm>
          </div>
        )
      },
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title={t('Channels')}
        subtitle={t(
          'Where alert messages go: a Telegram chat, a Discord channel or email. Bot tokens, webhook URLs and passwords are kept on EdgePanel and never shown again.',
        )}
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setEditing('new')}>
            {t('Add channel')}
          </Button>
        }
      />
      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <Table<AlertChannel>
          columns={columns}
          dataSource={channels}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <span className="muted">{t('No channels yet. Add one, then send a test.')}</span> }}
        />
      </Card>
      <ChannelDialog channel={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

const SETUP = (): Record<ChannelKind, string> => ({
  telegram: t('Create a bot with @BotFather, add it to the chat, then paste its token and the chat ID.'),
  discord: t('In Discord: channel settings → Integrations → Webhooks → New webhook → Copy webhook URL.'),
  email: t('For Gmail: turn on 2-Step Verification, then create an app password for this account.'),
})

function ChannelDialog({ channel, onClose }: { channel: AlertChannel | 'new' | null; onClose: () => void }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<ChannelInput>()
  const [smtpOpen, setSmtpOpen] = useState(false)
  const kind = Form.useWatch('kind', form) ?? 'telegram'
  const smtpHost = Form.useWatch('smtpHost', form)
  const smtpPort = Form.useWatch('smtpPort', form)
  const current = channel && channel !== 'new' ? channel : null
  const keep = current ? t('Saved. Leave empty to keep it.') : undefined

  const save = useMutation({
    mutationFn: (values: ChannelInput) => (current ? updateChannel(current.id, values) : createChannel(values)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: alertChannelsQuery.queryKey })
      message.success(current ? t('Channel saved') : t('"{name}" added. Send a test to check it.', { name: saved.name }))
      onClose()
    },
    onError: (error) => message.error(error.message),
  })

  // Only the fields of the chosen type go out; an empty secret means "keep the saved one".
  const submit = (values: ChannelInput) => {
    const common = { kind: values.kind, name: values.name.trim() }
    const secret = (key: 'botToken' | 'webhookUrl' | 'password') => (values[key]?.trim() ? { [key]: values[key]!.trim() } : {})
    if (values.kind === 'telegram') return save.mutate({ ...common, chatId: values.chatId?.trim(), ...secret('botToken') })
    if (values.kind === 'discord') return save.mutate({ ...common, ...secret('webhookUrl') })
    save.mutate({
      ...common,
      smtpHost: values.smtpHost?.trim(),
      smtpPort: values.smtpPort,
      username: values.username?.trim(),
      to: values.to?.map((address) => address.trim()),
      ...secret('password'),
    })
  }

  return (
    <Modal
      title={current ? t('Edit "{name}"', { name: current.name }) : t('Add a channel')}
      open={Boolean(channel)}
      onCancel={onClose}
      width={680}
      destroyOnHidden
      footer={null}
    >
      <Form<ChannelInput>
        form={form}
        className="dialog-form"
        layout="vertical"
        requiredMark={false}
        initialValues={{ ...EMPTY, ...(current ?? {}) }}
        onFinish={submit}
        onFinishFailed={({ errorFields }) => {
          if (errorFields.some((f) => f.name[0] === 'smtpHost' || f.name[0] === 'smtpPort')) setSmtpOpen(true)
        }}
      >
        <Form.Item name="kind" label={t('Type')} extra={current ? t("The type can't change. Add a new channel instead.") : undefined}>
          <Radio.Group className="choice-cards" disabled={Boolean(current)}>
            {KINDS.map((k) => (
              <Radio key={k} value={k} className="choice-card">
                <span className="choice-title">
                  <ChannelIcon kind={k} />
                  {KIND_LABEL()[k]}
                </span>
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
        <Form.Item name="name" label={t('Name')} rules={[{ required: true, whitespace: true, message: t('Name the channel.') }]}>
          <Input
            maxLength={60}
            placeholder={kind === 'email' ? t('e.g. IT mailbox') : kind === 'discord' ? t('e.g. #server-alerts') : t('e.g. IT on-call')}
          />
        </Form.Item>

        <section className="form-section">
          <h3>{kind === 'email' ? t('Recipients and sender') : t('Connection')}</h3>
          <p className="section-hint">{SETUP()[kind]}</p>

          {kind === 'telegram' ? (
            <>
              <Form.Item
                name="botToken"
                label={t('Bot token')}
                extra={keep}
                rules={[
                  { required: !current, whitespace: true, message: t('Paste the bot token.') },
                  { pattern: /^\s*(\d+:[\w-]{20,})?\s*$/, message: t('A bot token looks like 123456789:AA…') },
                ]}
              >
                <Input.Password className="mono" autoComplete="off" placeholder={current ? '••••••••' : '123456789:AA…'} />
              </Form.Item>
              <Form.Item
                name="chatId"
                label={t('Chat ID')}
                extra={t('Group ids start with -100. A public channel can be @name.')}
                rules={[
                  { required: true, whitespace: true, message: t('Enter the chat ID.') },
                  { validator: (_, v: string) => (!v?.trim() || isChatId(v) ? Promise.resolve() : Promise.reject(new Error(t('Not a chat ID.')))) },
                ]}
              >
                <Input className="mono" autoComplete="off" placeholder="-1002233445566" />
              </Form.Item>
            </>
          ) : null}

          {kind === 'discord' ? (
            <Form.Item
              name="webhookUrl"
              label="Webhook URL"
              extra={keep}
              rules={[
                { required: !current, whitespace: true, message: t('Paste the webhook URL.') },
                {
                  validator: (_, v: string) =>
                    !v?.trim() || isDiscordWebhook(v) ? Promise.resolve() : Promise.reject(new Error(t('Not a Discord webhook URL.'))),
                },
              ]}
            >
              <Input.Password className="mono" autoComplete="off" placeholder={current ? '••••••••' : 'https://discord.com/api/webhooks/…'} />
            </Form.Item>
          ) : null}

          {kind === 'email' ? (
            <>
              <Form.Item
                name="to"
                label={t('Send to')}
                extra={t('Type an address and press Enter. Add as many as you need.')}
                rules={[
                  { required: true, type: 'array', min: 1, message: t('Add at least one address.') },
                  {
                    validator: (_, v: string[] = []) => {
                      const bad = v.find((a) => !isEmail(a))
                      return bad ? Promise.reject(new Error(t('"{address}" is not an email address.', { address: bad }))) : Promise.resolve()
                    },
                  },
                ]}
              >
                <Select mode="tags" open={false} suffixIcon={null} tokenSeparators={[',', ' ', ';']} placeholder="it@company.com" aria-label={t('Send to')} />
              </Form.Item>
              <div className="kv">
                <Form.Item
                  name="username"
                  label={t('Send from')}
                  rules={[
                    { required: true, whitespace: true, message: t('Enter the sending account.') },
                    {
                      validator: (_, v: string) =>
                        !v?.trim() || isEmail(v) ? Promise.resolve() : Promise.reject(new Error(t('Not an email address.'))),
                    },
                  ]}
                >
                  <Input autoComplete="off" placeholder="alerts.company@gmail.com" />
                </Form.Item>
                <Form.Item
                  name="password"
                  label={t('App password')}
                  extra={keep}
                  rules={[{ required: !current, whitespace: true, message: t('Enter the app password.') }]}
                >
                  <Input.Password autoComplete="new-password" placeholder={current ? '••••••••' : t('16 characters')} />
                </Form.Item>
              </div>
              <div className="smtp-row">
                <span className="muted">
                  {t('SMTP server')} <span className="mono">{smtpHost || '—'}:{smtpPort || '—'}</span>
                </span>
                <Button type="link" size="small" onClick={() => setSmtpOpen((v) => !v)} aria-expanded={smtpOpen}>
                  {smtpOpen ? t('Hide') : t('Change')}
                </Button>
              </div>
              <div className="kv" hidden={!smtpOpen}>
                <Form.Item name="smtpHost" label={t('SMTP server')} rules={[{ required: true, whitespace: true, message: t('Enter the SMTP server.') }]}>
                  <Input className="mono" autoComplete="off" />
                </Form.Item>
                <Form.Item name="smtpPort" label={t('Port')} rules={[{ required: true, message: t('Enter the port.') }]}>
                  <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </>
          ) : null}
        </section>

        <div className="dialog-footer">
          <span className="dialog-buttons">
            <Button onClick={onClose}>{t('Cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              {current ? t('Save changes') : t('Add channel')}
            </Button>
          </span>
        </div>
      </Form>
    </Modal>
  )
}
