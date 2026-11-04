import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Descriptions, Form, InputNumber, Switch, type DescriptionsProps } from 'antd'
import PageHeader from '../../components/PageHeader'
import { saveSettings } from '../../services/adminService'
import { healthQuery, settingsQuery } from '../../services/queries'
import type { Settings } from '../../types/admin'
import { ago } from '../../utils/time'

export default function SettingsPage() {
  const [{ data: settings }, { data: health }] = useSuspenseQueries({ queries: [settingsQuery, healthQuery] })
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      message.success('Settings saved')
    },
    onError: (error) => message.error(error.message),
  })

  const info: DescriptionsProps['items'] = [
    { key: 'version', label: 'Panel version', children: health.version },
    { key: 'uptime', label: 'Uptime', children: health.uptime },
    { key: 'agents', label: 'Agents connected', children: health.agentsConnected },
    { key: 'db', label: 'Database size', children: `${health.dbSizeMb} MB` },
    { key: 'backup', label: 'Last backup', children: ago(health.lastBackup) },
  ]

  return (
    <div className="stack">
      <PageHeader title="System Settings" subtitle="Heartbeat, retention, health and backups." />

      <Card title="Panel health">
        <Descriptions layout="vertical" colon={false} column={{ xs: 1, sm: 2, lg: 3, xl: 5 }} items={info} />
      </Card>

      <div className="grid-2">
        <Card title="Agents and retention">
          <Form<Settings>
            layout="vertical"
            requiredMark={false}
            initialValues={settings}
            onFinish={(values) => save.mutate(values)}
          >
            <div className="kv">
              <Form.Item
                name="heartbeatSeconds"
                label="Heartbeat every (s)"
                rules={[{ required: true, message: 'Set a heartbeat interval.' }]}
              >
                <InputNumber min={5} max={600} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="offlineAfterMinutes"
                label="Mark offline after (min)"
                rules={[{ required: true, message: 'Set when a device counts as offline.' }]}
              >
                <InputNumber min={1} max={120} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="logRetentionDays" label="Keep logs (days)">
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="metricRetentionDays" label="Keep metrics (days)">
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <Form.Item
              name="autoApproveEnrollment"
              label="Enrollment"
              valuePropName="checked"
              extra="Off means an admin approves every agent before its certificate is signed."
            >
              <Switch />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              Save settings
            </Button>
          </Form>
        </Card>

        <Card title="Backup and restore" extra={<span className="muted">Panel data only</span>}>
          <p className="muted">
            A backup holds the device registry, certificates, users, jobs and the audit log. Agent machines are not
            touched.
          </p>
          <div className="page-actions">
            <Button type="primary" onClick={() => message.success('Backup started; it appears in the panel data directory')}>
              Back up now
            </Button>
            <Button onClick={() => message.info('Restoring replaces the current data and needs the panel to restart.')}>
              Restore from file
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
