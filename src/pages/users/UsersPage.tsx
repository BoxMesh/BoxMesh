import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { App, Button, Card, Form, Input, Modal, Table, Tag, Tooltip, type TableProps } from 'antd'
import { Link } from 'react-router'
import { useState } from 'react'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { createUser } from '../../services/adminService'
import { devicesQuery, groupsQuery, usersQuery } from '../../services/queries'
import type { Account } from '../../types/admin'
import { t } from '../../i18n'
import { MAX_EMAIL, MAX_NAME, MIN_PASSWORD } from '../../utils/account'
import { ago } from '../../utils/time'
import { AccessTags, RoleName } from './Access'

// The table only shows; every change happens on the person's own page (/users/:id). There is exactly one System account, so roles are not
// edited: every account created is a User, and the System account can't be turned off or deleted, or the console
// would be left with nobody to manage it.
export default function UsersPage() {
  const [{ data: accounts }, { data: groups }, { data: devices }] = useSuspenseQueries({
    queries: [usersQuery, groupsQuery, devicesQuery],
  })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<{ name: string; email: string; password: string }>()

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: (account) => {
      refresh()
      setOpen(false)
      form.resetFields()
      message.success(t('Account created for {email}', { email: account.email }))
    },
    onError: (error) => {
      // 409 means the email is taken: say so under the field instead of a toast.
      if (isAxiosError(error) && error.response?.status === 409) {
        form.setFields([{ name: 'email', errors: [t('An account with this email already exists.')] }])
      } else {
        message.error(error.message)
      }
    },
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
      render: (_, a) => <Tag color={a.role === 'System' ? 'processing' : 'default'}><RoleName role={a.role} /></Tag>,
    },
    ...(['groups', 'devices'] as const).map((part) => ({
      title: part === 'groups' ? <Th icon="tag" label={t('Groups')} /> : <Th icon="devices" label={t('Devices')} />,
      key: part,
      render: (_: unknown, a: Account) => <AccessTags account={a} part={part} groups={groups} devices={devices} />,
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
        subtitle={t('Who can sign in, what they may do, and which devices each User can reach.')}
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setOpen(true)}>
            {t('Create user')}
          </Button>
        }
      />

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

      <Modal title={t('Create a user')} open={open} onCancel={() => setOpen(false)} width={560} destroyOnHidden footer={null}>
        <Form
          form={form}
          className="dialog-form"
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => create.mutate({ name: values.name.trim(), email: values.email, password: values.password, role: 'User' })}
        >
          <section className="form-section">
            <h3>{t('Account')}</h3>
            <p className="section-hint">{t('They join as a User with no devices. Grant access on their page afterwards.')}</p>
            <Form.Item
              name="name"
              label={t('Name')}
              rules={[
                { required: true, whitespace: true, message: t('Enter their name.') },
                { max: MAX_NAME, message: t('Keep the name to {max} characters or fewer.', { max: MAX_NAME }) },
              ]}
            >
              <Input autoComplete="off" />
            </Form.Item>
            <Form.Item
              name="email"
              label={t('Email')}
              normalize={(v: string) => v.trim()}
              rules={[
                { required: true, message: t('Enter their email.') },
                { type: 'email', max: MAX_EMAIL, message: t('Enter a valid email.') },
              ]}
            >
              <Input type="email" autoComplete="off" placeholder="name@company.com" />
            </Form.Item>
          </section>

          <section className="form-section">
            <h3>{t('Password')}</h3>
            <p className="section-hint">{t('You set it and share it with them; no email is sent. At least {min} characters.', { min: MIN_PASSWORD })}</p>
            <Form.Item
              name="password"
              label={t('Password')}
              rules={[
                { required: true, message: t('Enter a password.') },
                { min: MIN_PASSWORD, message: t('The password needs at least {min} characters.', { min: MIN_PASSWORD }) },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </section>

          <div className="dialog-footer">
            <span className="dialog-buttons">
              <Button onClick={() => setOpen(false)}>{t('Cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={create.isPending}>
                {t('Create user')}
              </Button>
            </span>
          </div>
        </Form>
      </Modal>

    </div>
  )
}
