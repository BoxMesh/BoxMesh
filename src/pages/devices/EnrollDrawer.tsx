import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, App, Button, Drawer, Form, InputNumber, Popconfirm, Radio, Segmented, Spin } from 'antd'
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
    ? 'boxagent.exe install `\n  --server https://[SERVER_DOMAIN] `\n  --token ' + token
    : 'sudo ./boxagent install \\\n  --server https://[SERVER_DOMAIN] \\\n  --token ' + token

type TokenForm = { lifetime: string; limit: number | 'custom' | 'unlimited'; custom: number }

const LIFETIMES = () => [
  { value: '1h', label: t('1 hour') },
  { value: '24h', label: t('24 hours') },
  { value: '7d', label: t('7 days') },
]

const LIMITS = (): { value: TokenForm['limit']; label: string }[] => [
  { value: 3, label: '3' },
  { value: 'unlimited', label: t('Unlimited') },
  { value: 'custom', label: t('Custom') },
]

export default function EnrollDrawer({ open, onClose, tokenOnly = false }: { open: boolean; onClose: () => void; tokenOnly?: boolean }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [os, setOs] = useState<OsFamily>('Windows')
  // Held only while the drawer is open: BoxServer shows a token in full exactly once.
  const [issued, setIssued] = useState<EnrollmentToken | null>(null)
  const [form] = Form.useForm<TokenForm>()
  const limit = Form.useWatch('limit', form)
  const custom = Form.useWatch('custom', form)
  const pending = useQuery({ ...pendingEnrollmentsQuery, enabled: open && !tokenOnly })

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
          ? t('{host} approved; its tunnel is opening', { host })
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
    <Drawer title={tokenOnly ? t('Create token') : t('Add a new agent')} open={open} onClose={onClose} size={520}>
      <ol className="steps">
        <li>
          {tokenOnly ? null : (
            <h3>
              <span className="step-num">1</span>
              {t('Create a token')}
            </h3>
          )}
          {issued ? (
            <>
              <Alert
                type="success"
                showIcon
                title={t('Token created')}
                description={tokenOnly ? undefined : t('It is already in the command below.')}
              />
              {tokenOnly ? (
                <>
                  <pre className="code" style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", width: "100%" }}>{issued.token}</pre>
                  <Button onClick={() => navigator.clipboard.writeText(issued.token).then(() => message.success(t('Token copied')), () => message.error(t('Copy failed. Select the command and copy it manually.')))}>
                    {t('Copy token')}
                  </Button>
                </>
              ) : null}
              <Button onClick={() => setIssued(null)}>{t('Create another')}</Button>
            </>
          ) : (
            <Form<TokenForm>
              form={form}
              layout="vertical"
              requiredMark={false}
              initialValues={{ lifetime: '24h', limit: 3, custom: 10 }}
              onFinish={({ lifetime, limit, custom }) => create.mutate({ lifetime, maxDevices: limit === 'custom' ? custom : limit === 'unlimited' ? null : limit })}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <section className="form-section">
                <h3>{t('Valid for')}</h3>
                <p className="section-hint">{t('Once it expires, no new device can enroll with it. Devices already enrolled are not affected.')}</p>
                <Form.Item name="lifetime" noStyle>
                  <Radio.Group className="choice-cards">
                    {LIFETIMES().map((l) => (
                      <Radio key={l.value} value={l.value} className="choice-card">
                        <span className="choice-title">{l.label}</span>
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
              </section>
              <section className="form-section">
                <h3>{t('Devices allowed')}</h3>
                <p className="section-hint" aria-live="polite">
                  {limit === 'unlimited' ? t('Any number of devices can enroll with it.') : (limit === 'custom' && !custom ? t('Enter how many devices.') : t('Up to {n} devices can enroll with it.', { n: limit === 'custom' ? custom : limit }))}
                </p>
                <Form.Item name="limit" noStyle>
                  <Radio.Group className="choice-cards">
                    {LIMITS().map((l) => (
                      <Radio key={l.value} value={l.value} className="choice-card">
                        <span className="choice-title">{l.label}</span>
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
                {limit === 'custom' ? (
                  <Form.Item name="custom" rules={[{ required: true, message: t('Enter how many devices.') }, { type: 'integer', min: 1, max: 1_000_000, message: t('Enter a whole number from 1 to 1,000,000.') }]} style={{ marginTop: 12, marginBottom: 0 }}>
                    <InputNumber min={1} max={1_000_000} precision={0} suffix={t('devices')} style={{ width: '100%' }} aria-label={t('Devices allowed')} />
                  </Form.Item>
                ) : null}
              </section>
              <Button type="primary" htmlType="submit" loading={create.isPending} style={{ alignSelf: "flex-start" }}>
                {t('Create token')}
              </Button>
            </Form>
          )}
        </li>
        {tokenOnly ? null : (
        <>
        <li>
          <h3>
            <span className="step-num">2</span>
            {t('Run this on the device')}
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
              'The agent connects to BoxServer over TLS with the token. Once approved, its tunnel opens.',
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
                  description={t("It can't connect. It can ask again with a new token.")}
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
        </>
        )}
      </ol>
    </Drawer>
  )
}
