import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { Alert, App, Button, Card, Checkbox, Drawer, Form, Popconfirm, Select, Table, Tag, type TableProps } from 'antd'
import { useState } from 'react'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { createToken, revokeCertificate, type NewToken } from '../../services/adminService'
import { certificatesQuery, devicesQuery, tokensQuery } from '../../services/queries'
import type { Certificate, EnrollmentToken } from '../../types/admin'
import { daysLeft, daysLeftLabel, formatDate } from '../../utils/time'

const LIFETIMES = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
]

export default function CertificatesPage() {
  const [{ data: certificates }, { data: tokens }, { data: devices }] = useSuspenseQueries({
    queries: [certificatesQuery, tokensQuery, devicesQuery],
  })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  // The panel returns the secret once; keep it on screen until the drawer is closed.
  const [issued, setIssued] = useState<EnrollmentToken | null>(null)

  const groups = [...new Set(devices.map((d) => d.group))].sort()

  const revoke = useMutation({
    mutationFn: revokeCertificate,
    onSuccess: (cert) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
      message.success(`${cert.host} can no longer connect`)
    },
    onError: (error) => message.error(error.message),
  })

  const issue = useMutation({
    mutationFn: (input: NewToken) => createToken(input),
    onSuccess: (token) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-tokens'] })
      setIssued(token)
    },
    onError: (error) => message.error(error.message),
  })

  const certColumns: TableProps<Certificate>['columns'] = [
    { title: <Th icon="devices" label="Device" />, key: 'host', render: (_, c) => <span className="strong">{c.host}</span> },
    { title: <Th icon="lock" label="Serial" />, key: 'serial', render: (_, c) => <code>{c.serial}</code> },
    { title: <Th icon="clock" label="Issued" />, key: 'issued', render: (_, c) => formatDate(c.issuedAt) },
    {
      title: <Th icon="clock" label="Expires" />,
      key: 'expires',
      render: (_, c) => {
        const days = daysLeft(c.expiresAt)
        return (
          <>
            {formatDate(c.expiresAt)}{' '}
            {days <= 14 ? <Tag color={days <= 0 ? 'error' : 'warning'}>{daysLeftLabel(days)}</Tag> : null}
          </>
        )
      },
    },
    {
      title: <Th icon="pulse" label="Status" />,
      key: 'status',
      render: (_, c) => <Tag color={c.revoked ? 'error' : 'success'}>{c.revoked ? 'revoked' : 'trusted'}</Tag>,
    },
    {
      title: <Th icon="more" label="Actions" />,
      key: 'actions',
      render: (_, c) => (
        <Popconfirm
          title={`Revoke ${c.host}?`}
          description="Its tunnel closes at once and the agent must enrol again."
          okText="Revoke"
          okButtonProps={{ danger: true }}
          onConfirm={() => revoke.mutate(c.host)}
        >
          <Button size="small" danger disabled={c.revoked}>
            Revoke
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const tokenColumns: TableProps<EnrollmentToken>['columns'] = [
    { title: <Th icon="lock" label="Token" />, key: 'token', render: (_, t) => <code>{t.token}</code> },
    { title: <Th icon="tag" label="Group" />, key: 'group', render: (_, t) => <Tag color="processing">{t.group}</Tag> },
    {
      title: <Th icon="clock" label="Expires" />,
      key: 'expires',
      render: (_, t) => {
        const days = daysLeft(t.expiresAt)
        return days <= 0 ? <Tag>expired</Tag> : formatDate(t.expiresAt)
      },
    },
    {
      title: <Th icon="check" label="Approval" />,
      key: 'approval',
      render: (_, t) => (t.requiresApproval ? 'Admin approves' : <span className="muted">Automatic</span>),
    },
    {
      title: <Th icon="devices" label="Used by" />,
      key: 'used',
      render: (_, t) => (t.usedBy.length ? t.usedBy.join(', ') : <span className="muted">—</span>),
    },
  ]

  const expiring = certificates.filter((c) => !c.revoked && daysLeft(c.expiresAt) <= 14)

  return (
    <div className="stack">
      <PageHeader
        title="Security & Certificates"
        subtitle="Agent certificates and enrollment tokens. Revoking a certificate cuts a device off immediately."
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setOpen(true)}>
            Create token
          </Button>
        }
      />

      {expiring.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          icon={<Icon name="warning" />}
          title={`${expiring.length} certificate${expiring.length === 1 ? '' : 's'} expire within 14 days`}
          description={expiring.map((c) => `${c.host} (${daysLeftLabel(daysLeft(c.expiresAt))})`).join(' · ')}
        />
      ) : null}

      <Card className="table-card" title="Agent certificates" styles={{ body: { padding: 0 } }}>
        <Table<Certificate>
          columns={certColumns}
          dataSource={certificates}
          rowKey="host"
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card className="table-card" title="Enrollment tokens" styles={{ body: { padding: 0 } }}>
        <Table<EnrollmentToken>
          columns={tokenColumns}
          dataSource={tokens}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <span className="muted">No tokens have been created.</span> }}
        />
      </Card>

      <Drawer
        title="Create an enrollment token"
        open={open}
        size={520}
        onClose={() => {
          setOpen(false)
          setIssued(null)
        }}
      >
        {issued ? (
          <div className="stack">
            <Alert
              type="success"
              showIcon
              title="Token created"
              description="This is the only time the whole token is shown. Copy it now."
            />
            <pre className="code">{issued.token}</pre>
            <div className="page-actions">
              <Button
                type="primary"
                onClick={() =>
                  navigator.clipboard.writeText(issued.token).then(
                    () => message.success('Token copied'),
                    () => message.error('Copy failed. Select the token and copy it manually.'),
                  )
                }
              >
                Copy token
              </Button>
              <Button onClick={() => setIssued(null)}>Create another</Button>
            </div>
          </div>
        ) : (
          <Form<NewToken>
            layout="vertical"
            requiredMark={false}
            initialValues={{ lifetime: '24h', group: groups[0], requiresApproval: true }}
            onFinish={(values) => issue.mutate(values)}
          >
            <Form.Item name="lifetime" label="Token lifetime">
              <Select options={LIFETIMES} />
            </Form.Item>
            <Form.Item name="group" label="Default group">
              <Select options={groups.map((g) => ({ value: g, label: g }))} />
            </Form.Item>
            <Form.Item name="requiresApproval" valuePropName="checked">
              <Checkbox>Require admin approval before issuing certificates</Checkbox>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={issue.isPending}>
              Create token
            </Button>
          </Form>
        )}
      </Drawer>
    </div>
  )
}
