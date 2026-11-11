import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, App, Button, Checkbox, Drawer, Form, Popconfirm, Segmented, Select, Spin } from 'antd'
import { useState } from 'react'
import { t } from '../../i18n'
import { createToken, type NewToken } from '../../services/adminService'
import { decideEnrollment } from '../../services/deviceService'
import { userMessage } from '../../services/http'
import { pendingEnrollmentsQuery } from '../../services/queries'
import type { EnrollmentToken } from '../../types/admin'
import type { OsFamily } from '../../types/device'

const install = (os: OsFamily, token: string) =>
  os === 'Windows'
    ? 'boxagent.exe install `\n  --server https://[VPS_DOMAIN] `\n  --token ' + token
    : 'sudo ./boxagent install \\\n  --server https://[VPS_DOMAIN] \\\n  --token ' + token

const LIFETIMES = [
  { value: '1h', label: t('1 hour') },
  { value: '24h', label: t('24 hours') },
  { value: '7d', label: t('7 days') },
]

export default function EnrollDrawer({ open, onClose, groups }: { open: boolean; onClose: () => void; groups: string[] }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [os, setOs] = useState<OsFamily>('Windows')
  // Held only while the drawer is open: EdgePanel shows a token in full exactly once.
  const [issued, setIssued] = useState<EnrollmentToken | null>(null)
  const pending = useQuery({ ...pendingEnrollmentsQuery, enabled: open })

  const create = useMutation({
    mutationFn: (input: NewToken) => createToken(input),
    onSuccess: (token) => {
      setIssued(token)
      queryClient.invalidateQueries({ queryKey: ['enrollment-tokens'] })
      message.success(t('Token created'))
    },
    onError: (error) => message.error(error.message),
  })

  const decide = useMutation({
    mutationFn: ({ host, outcome }: { host: string; outcome: 'approve' | 'reject' }) => decideEnrollment(host, outcome),
    onSuccess: (_data, { host, outcome }) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      message.success(
        outcome === 'approve'
          ? t('{host} approved; its certificate is being signed', { host })
          : t('{host} rejected', { host }),
      )
    },
    onError: (error) => message.error(error.message),
  })

  const command = install(os, issued?.token ?? '[ENROLLMENT_TOKEN]')
  const copy = () =>
    navigator.clipboard.writeText(command).then(
      () => message.success(t('Command copied')),
      () => message.error(t('Copy failed. Select the command and copy it manually.')),
    )

  return (
    <Drawer title={t('Enroll new agent')} open={open} onClose={onClose} size={520}>
      <ol className="steps">
        <li>
          <h3>
            <span className="step-num">1</span>
            {t('Create an enrollment token')}
          </h3>
          {issued ? (
            <>
              <Alert
                type="success"
                showIcon
                title={t('Token created')}
                description={t('It is already in the command below. This is the only time it is shown in full.')}
              />
              <Button onClick={() => setIssued(null)}>{t('Create another')}</Button>
            </>
          ) : (
            <Form<NewToken>
              layout="vertical"
              requiredMark={false}
              initialValues={{ lifetime: '24h', group: groups[0], requiresApproval: true }}
              onFinish={(values) => create.mutate(values)}
              style={{ width: '100%' }}
            >
              <Form.Item name="lifetime" label={t('Token lifetime')}>
                <Select options={LIFETIMES} />
              </Form.Item>
              <Form.Item name="group" label={t('Default group')}>
                <Select options={groups.map((g) => ({ value: g, label: g }))} />
              </Form.Item>
              <Form.Item name="requiresApproval" valuePropName="checked">
                <Checkbox>{t('Require admin approval before issuing certificates')}</Checkbox>
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={create.isPending}>
                {t('Create token')}
              </Button>
            </Form>
          )}
        </li>
        <li>
          <h3>
            <span className="step-num">2</span>
            {t('Install BoxAgent on the device')}
          </h3>
          <Segmented<OsFamily> aria-label={t('Operating system')} options={['Windows', 'Linux', 'macOS']} value={os} onChange={setOs} />
          <pre className="code">{command}</pre>
          <Button onClick={copy}>{t('Copy command')}</Button>
        </li>
        <li>
          <h3>
            <span className="step-num">3</span>
            {t('Approve the agent')}
          </h3>
          <p className="muted" style={{ margin: 0 }}>
            {t(
              'The agent creates its private key and sends a certificate request. Once approved, EdgePanel signs the certificate and opens the mTLS tunnel.',
            )}
          </p>
          {pending.isPending ? <Spin /> : null}
          {pending.error ? <p className="muted">{t("Waiting agents didn't load.")} {userMessage(pending.error)}</p> : null}
          {pending.data?.length === 0 ? <p className="muted">{t('No agents are waiting for approval.')}</p> : null}
          {pending.data?.map((p) => (
            <div key={p.host} className="pending">
              <span>
                <b>{p.host}</b> · {p.os} · {p.ip}
              </span>
              <span className="pending-actions">
                <Button
                  type="primary"
                  loading={decide.isPending && decide.variables?.host === p.host}
                  onClick={() => decide.mutate({ host: p.host, outcome: 'approve' })}
                >
                  {t('Approve')}
                </Button>
                <Popconfirm
                  title={t('Reject {host}?', { host: p.host })}
                  description={t("It gets no certificate and can't connect. It can ask again with a new token.")}
                  okText={t('Reject')}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => decide.mutate({ host: p.host, outcome: 'reject' })}
                >
                  <Button>{t('Reject')}</Button>
                </Popconfirm>
              </span>
            </div>
          ))}
        </li>
      </ol>
    </Drawer>
  )
}
