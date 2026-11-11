import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Radio, Table, Tooltip, type TableProps } from 'antd'
import { useState } from 'react'
import { Icon, Th, type IconName } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { t } from '../../i18n'
import { createAlertRule, deleteAlertRule, updateAlertRule, type NewAlertRule } from '../../services/alertService'
import { alertRulesQuery, alertsQuery } from '../../services/queries'
import type { AlertMetric, AlertRule } from '../../types/alert'
import { conditionOf, METRIC_LABEL, sentenceOf } from '../../utils/alerts'

const METRICS: AlertMetric[] = ['cpu', 'ram', 'disk', 'offline']
const DEFAULT_THRESHOLD: Record<AlertMetric, number> = { cpu: 90, ram: 90, disk: 85, offline: 0 }
const EMPTY: NewAlertRule = { name: '', metric: 'cpu', threshold: 90, minutes: 5 }
const METRIC_ICON: Record<AlertMetric, IconName> = { cpu: 'chip', ram: 'columns', disk: 'box', offline: 'pulse' }
const METRIC_HINT: Record<AlertMetric, string> = {
  cpu: t('Processor load'),
  ram: t('Memory in use'),
  disk: t('Space used'),
  offline: t('No heartbeat'),
}

export default function AlertRulesPage() {
  const [{ data: rules }, { data: alerts }] = useSuspenseQueries({ queries: [alertRulesQuery, alertsQuery] })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<AlertRule | 'new' | null>(null)
  const usedBy = (id: string) => alerts.filter((a) => a.ruleIds.includes(id))

  const remove = useMutation({
    mutationFn: (rule: AlertRule) => deleteAlertRule(rule.id),
    onSuccess: (_, rule) => {
      queryClient.invalidateQueries({ queryKey: alertRulesQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: alertsQuery.queryKey })
      message.success(t('"{name}" deleted', { name: rule.name }))
    },
    onError: (error) => message.error(error.message),
  })

  const columns: TableProps<AlertRule>['columns'] = [
    { title: <Th icon="warning" label={t('Rule')} />, dataIndex: 'name', render: (name: string) => <span className="strong">{name}</span> },
    { title: <Th icon="pulse" label={t('Condition')} />, key: 'when', render: (_, r) => conditionOf(r) },
    {
      title: <Th icon="bell" label={t('Used by')} />,
      key: 'used',
      render: (_, r) => {
        const list = usedBy(r.id)
        return list.length ? list.map((a) => a.name).join(', ') : <span className="muted">{t('No alert')}</span>
      },
    },
    {
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, r) => {
        const n = usedBy(r.id).length
        return (
          <div className="row-actions">
            <Tooltip title={t('Edit "{name}"', { name: r.name })}>
              <button type="button" className="icon-btn" aria-label={t('Edit "{name}"', { name: r.name })} onClick={() => setEditing(r)}>
                <Icon name="edit" size={14} />
              </button>
            </Tooltip>
            <Popconfirm
              title={t('Delete "{name}"?', { name: r.name })}
              description={n ? (n === 1 ? t('{n} alert stop checking it.', { n }) : t('{n} alerts stop checking it.', { n })) : t('No alert uses it.')}
              okText={t('Delete')}
              okButtonProps={{ danger: true }}
              onConfirm={() => remove.mutate(r)}
            >
              <button type="button" className="icon-btn" aria-label={t('Delete "{name}"', { name: r.name })}>
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
        title={t('Rules')}
        subtitle={t(
          'A rule is a condition with a name, such as CPU above 90% for 5 minutes. Use it in an alert to say which devices it watches and where the message goes.',
        )}
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setEditing('new')}>
            {t('Add rule')}
          </Button>
        }
      />
      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <Table<AlertRule>
          columns={columns}
          dataSource={rules}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <span className="muted">{t('No rules yet. Add one, such as CPU above 90% for 5 minutes.')}</span> }}
        />
      </Card>
      <RuleDialog rule={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function RuleDialog({ rule, onClose }: { rule: AlertRule | 'new' | null; onClose: () => void }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<NewAlertRule>()
  const metric = Form.useWatch('metric', form) ?? 'cpu'
  const threshold = Form.useWatch('threshold', form) ?? 0
  const minutes = Form.useWatch('minutes', form) ?? 0
  const current = rule && rule !== 'new' ? rule : null

  const save = useMutation({
    mutationFn: (values: NewAlertRule) => (current ? updateAlertRule(current.id, values) : createAlertRule(values)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: alertRulesQuery.queryKey })
      message.success(current ? t('Rule saved') : t('"{name}" added', { name: saved.name }))
      onClose()
    },
    onError: (error) => message.error(error.message),
  })

  return (
    <Modal
      title={current ? t('Edit "{name}"', { name: current.name }) : t('Add a rule')}
      open={Boolean(rule)}
      onCancel={onClose}
      width={680}
      destroyOnHidden
      footer={null}
    >
      <Form<NewAlertRule>
        form={form}
        className="dialog-form"
        layout="vertical"
        requiredMark={false}
        initialValues={current ?? EMPTY}
        onValuesChange={(changed: Partial<NewAlertRule>) => {
          if (changed.metric && changed.metric !== 'offline') form.setFieldValue('threshold', DEFAULT_THRESHOLD[changed.metric])
        }}
        onFinish={(values) => save.mutate({ ...values, name: values.name.trim(), threshold: values.metric === 'offline' ? 0 : values.threshold })}
      >
        <Form.Item name="name" label={t('Rule name')} rules={[{ required: true, whitespace: true, message: t('Name the rule.') }]}>
          <Input maxLength={60} placeholder={t('e.g. Disk almost full')} />
        </Form.Item>

        <section className="form-section">
          <h3>{t('Condition')}</h3>
          <p className="section-hint" aria-live="polite">
            {t('Fires when {condition}.', { condition: sentenceOf({ metric, threshold, minutes }) })}
          </p>
          <Form.Item name="metric" label={t('Watch')}>
            <Radio.Group className="choice-cards">
              {METRICS.map((m) => (
                <Radio key={m} value={m} className="choice-card">
                  <span className="choice-title">
                    <Icon name={METRIC_ICON[m]} size={14} />
                    {METRIC_LABEL[m]}
                  </span>
                  <span className="choice-desc">{METRIC_HINT[m]}</span>
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <div className="kv">
            {metric !== 'offline' ? (
              <Form.Item name="threshold" label={t('Goes above')} rules={[{ required: true, message: t('Enter a limit.') }]}>
                <InputNumber min={1} max={100} suffix="%" style={{ width: '100%' }} />
              </Form.Item>
            ) : null}
            <Form.Item
              name="minutes"
              label={metric === 'offline' ? t('Offline for') : t('For at least')}
              extra={t('A short spike sends nothing.')}
              rules={[{ required: true, message: t('Enter how long.') }]}
            >
              <InputNumber min={metric === 'offline' ? 1 : 0} max={1440} suffix="min" style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </section>

        <div className="dialog-footer">
          <span className="dialog-buttons">
            <Button onClick={onClose}>{t('Cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              {current ? t('Save changes') : t('Add rule')}
            </Button>
          </span>
        </div>
      </Form>
    </Modal>
  )
}
