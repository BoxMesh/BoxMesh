import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, Modal, Table, Tag, Tooltip, type TableProps } from 'antd'
import { Link } from 'react-router'
import { useState } from 'react'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { inviteUser } from '../../services/adminService'
import { devicesQuery, groupsQuery, usersQuery } from '../../services/queries'
import type { Account, DeviceAccess, Role } from '../../types/admin'
import { t } from '../../i18n'
import { ago } from '../../utils/time'
import { AccessFields, AccessTags, RoleName } from './Access'

const ROLES: { value: Role; label: string; help: string }[] = [
  { value: 'Admin', label: t('Admin'), help: t('Everything, plus managing users') },
  { value: 'Operator', label: t('Operator'), help: t('Runs commands and opens remote sessions') },
]

// The table only shows; every change happens on the person's own page (/users/:id). There is exactly one Admin, so roles are not
// edited: everyone invited joins as an Operator, and the Admin can't be turned off or deleted, or the console
// would be left with nobody to manage it.
export default function UsersPage() {
  const [{ data: accounts }, { data: groups }, { data: devices }] = useSuspenseQueries({
    queries: [usersQuery, groupsQuery, devicesQuery],
  })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<{ email: string; access: DeviceAccess }>()

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const invite = useMutation({
    mutationFn: inviteUser,
    onSuccess: (account) => {
      refresh()
      setOpen(false)
      form.resetFields()
      message.success(t('Invitation sent to {email}', { email: account.email }))
    },
    onError: (error) => message.error(error.message),
  })

  const columns: TableProps<Account>['columns'] = [
    {
      title: <Th icon="users" label={t('Name')} />,
      key: 'name',
      render: (_, a) => (
        <Link to={`/users/${a.id}`} className="strong">
          {a.name}
        </Link>
      ),
    },
    { title: <Th icon="mail" label={t('Email')} />, key: 'email', render: (_, a) => a.email },
    {
      title: <Th icon="security" label={t('Role')} />,
      key: 'role',
      render: (_, a) => <Tag color={a.role === 'Admin' ? 'processing' : 'default'}><RoleName role={a.role} /></Tag>,
    },
    ...(['groups', 'hosts'] as const).map((part) => ({
      title: part === 'groups' ? <Th icon="tag" label={t('Groups')} /> : <Th icon="devices" label={t('Devices')} />,
      key: part,
      render: (_: unknown, a: Account) => <AccessTags account={a} part={part} groups={groups} />,
    })),
    {
      title: <Th icon="pulse" label={t('Status')} />,
      key: 'status',
      render: (_, a) => (a.disabled ? <Tag>{t('Disabled')}</Tag> : <Tag color="success">{t('Active')}</Tag>),
    },
    {
      title: <Th icon="clock" label={t('Last sign-in')} />,
      key: 'last',
      render: (_, a) => (a.lastSignIn ? ago(a.lastSignIn) : <span className="muted">{t('Never')}</span>),
    },
    {
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, a) => (
        <Tooltip title={t('Open {name}', { name: a.name })}>
          <Link to={`/users/${a.id}`} className="icon-btn" aria-label={t('Open {name}', { name: a.name })}>
            <Icon name="edit" size={14} />
          </Link>
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title={t('Users & Access')}
        subtitle={t('Who can sign in, what they may do, and which devices each Operator can reach.')}
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setOpen(true)}>
            {t('Invite person')}
          </Button>
        }
      />

      <div className="grid-stats">
        {ROLES.map((r) => (
          <Card key={r.value}>
            <div className="muted">{r.label}</div>
            <div className="kv-value">{accounts.filter((a) => a.role === r.value).length}</div>
            <div className="sub">{r.help}</div>
          </Card>
        ))}
      </div>

      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <Table<Account>
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          rowClassName={(a) => (a.disabled ? 'row-off' : '')}
        />
      </Card>

      <Modal
        title={t('Invite a person')}
        open={open}
        onCancel={() => setOpen(false)}
        width={880}
        footer={
          <div className="drawer-footer">
            <span className="screen-spacer" />
            <Button onClick={() => setOpen(false)}>{t('Cancel')}</Button>
            <Button type="primary" loading={invite.isPending} onClick={() => form.submit()}>
              {t('Send invitation')}
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ access: { groupIds: [], hosts: [] } }}
          onFinish={(values) => invite.mutate({ email: values.email, role: 'Operator', access: values.access })}
        >
          <Form.Item
            name="email"
            label={t('Work email')}
            extra={t('They join as an Operator: they can run commands and open remote sessions.')}
            normalize={(v: string) => v.trim()}
            rules={[
              { required: true, message: t('Enter their email.') },
              { type: 'email', message: t('Enter a valid email.') },
            ]}
          >
            <Input type="email" autoComplete="off" placeholder="name@company.com" />
          </Form.Item>
          <Form.Item name="access" label={t('What they can reach')}>
            {/* Form.Item passes value and onChange; until something is picked they reach no device. */}
            <AccessFields groups={groups} devices={devices} />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  )
}
