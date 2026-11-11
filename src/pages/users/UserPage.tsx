import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Descriptions, Form, Popconfirm, Result, Switch, Table, Tag, type TableProps } from 'antd'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Icon, Th } from '../../components/Icon'
import Status from '../../components/Status'
import { deleteUser, updateUser } from '../../services/adminService'
import { t } from '../../i18n'
import { getSession } from '../../services/authService'
import { devicesQuery, groupsQuery, usersQuery } from '../../services/queries'
import type { DeviceAccess } from '../../types/admin'
import type { Device } from '../../types/device'
import { reachable } from '../../utils/devices'
import { ago, formatDateTime } from '../../utils/time'
import { AccessFields, RoleName } from './Access'

interface Fields {
  active: boolean
  access: DeviceAccess
}

/** Everything about one person, and the one place their account is changed: sign-in, what they can reach, delete. */
export default function UserPage() {
  const { id = '' } = useParams()
  const [{ data: accounts }, { data: groups }, { data: devices }] = useSuspenseQueries({
    queries: [usersQuery, groupsQuery, devicesQuery],
  })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [form] = Form.useForm<Fields>()
  const account = accounts.find((a) => a.id === id)

  // Show what is saved after a save, or after moving to another person.
  useEffect(() => {
    if (account) form.setFieldsValue({ active: !account.disabled, access: account.access })
  }, [account, form])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] })
  const save = useMutation({
    mutationFn: (values: Fields) =>
      updateUser(id, { disabled: !values.active, ...(account?.role === 'Operator' ? { access: values.access } : {}) }),
    onSuccess: () => {
      refresh()
      message.success(t('Changes saved'))
    },
    onError: (error) => message.error(error.message),
  })
  const remove = useMutation({
    mutationFn: () => deleteUser(id),
    onSuccess: () => {
      refresh()
      message.success(t('{name} no longer has an account', { name: account?.name ?? '' }))
      navigate('/users', { replace: true })
    },
    onError: (error) => message.error(error.message),
  })

  if (!account) {
    return (
      <Result
        status="404"
        title={t('User not found')}
        subTitle={t("This account doesn't exist, or it was deleted.")}
        extra={<Link to="/users">{t('Back to Users & Access')}</Link>}
      />
    )
  }

  const isAdmin = account.role === 'Admin'
  // Your own account would lock you out mid-session; the Admin's would leave nobody to manage users.
  const locked = isAdmin ? t('the Admin account') : account.email === getSession()?.email ? t('your own account') : null
  // From what is saved, not from unsaved picks in the form.
  const reach = isAdmin ? devices : reachable(account.access, devices)
  const names = new Map(groups.map((g) => [g.id, g.name]))

  const columns: TableProps<Device>['columns'] = [
    {
      title: <Th icon="devices" label={t('Device')} />,
      key: 'host',
      render: (_, d) => (
        <span>
          <Link to={`/devices/${encodeURIComponent(d.host)}`} className="strong">
            {d.host}
          </Link>{' '}
          <span className="muted">{d.alias}</span>
        </span>
      ),
    },
    { title: <Th icon="pulse" label={t('Status')} />, key: 'status', render: (_, d) => <Status online={d.online} /> },
    {
      title: <Th icon="tag" label={t('Groups')} />,
      key: 'groups',
      render: (_, d) => {
        const shown = d.groups.filter((g) => names.has(g))
        return shown.length ? (
          <span className="device-groups">
            {shown.map((g) => (
              <Tag key={g} color="processing">
                {names.get(g)}
              </Tag>
            ))}
          </span>
        ) : (
          <span className="muted">—</span>
        )
      },
    },
    {
      title: <Th icon="lock" label={t('Reached through')} />,
      key: 'via',
      render: (_, d) => (isAdmin ? t('Admin role') : account.access.hosts.includes(d.host) ? t('Single device') : t('Group')),
    },
  ]

  return (
    <div className="stack">
      <div className="page-header">
        <div className="title-row">
          <Link to="/users" className="icon-btn" aria-label={t('Back to Users & Access')}>
            <Icon name="back" />
          </Link>
          <h1 style={{ margin: 0 }}>{account.name}</h1>
          <Tag color={isAdmin ? 'processing' : 'default'}><RoleName role={account.role} /></Tag>
          {account.disabled ? <Tag>{t('Disabled')}</Tag> : <Tag color="success">{t('Active')}</Tag>}
        </div>
        <div className="page-actions">
          {locked ? (
            <span className="muted">{t("You can't delete {locked}.", { locked })}</span>
          ) : (
            <Popconfirm
              title={t('Delete {name}?', { name: account.name })}
              description={t("They lose access at once. This can't be undone.")}
              okText={t('Delete')}
              okButtonProps={{ danger: true }}
              onConfirm={() => remove.mutate()}
            >
              <Button danger icon={<Icon name="trash" size={14} />} loading={remove.isPending}>
                {t('Delete user')}
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      <Form<Fields>
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ active: !account.disabled, access: account.access }}
        onFinish={(values) => save.mutate(values)}
      >
        <div className="stack">
          <Card title={t('Account')}>
            <Descriptions
              column={{ xs: 1, md: 2 }}
              items={[
                { key: 'email', label: t('Email'), children: account.email },
                { key: 'role', label: t('Role'), children: <RoleName role={account.role} /> },
                {
                  key: 'last',
                  label: t('Last sign-in'),
                  children: account.lastSignIn ? `${formatDateTime(account.lastSignIn)} (${ago(account.lastSignIn)})` : t('Never'),
                },
                { key: 'reach', label: t('Devices reached'), children: isAdmin ? t('All') : reach.length },
              ]}
            />
            <Form.Item
              name="active"
              label={t('Can sign in')}
              valuePropName="checked"
              style={{ marginTop: 16, marginBottom: 0 }}
              extra={locked ? t("You can't turn off {locked}.", { locked }) : t('Turned off, they keep their account but can no longer sign in.')}
            >
              <Switch disabled={Boolean(locked)} aria-label={t('{email} can sign in', { email: account.email })} />
            </Form.Item>
          </Card>

          <Card title={t('What they can reach')}>
            {isAdmin ? (
              <span className="muted">{t('The Admin reaches every device.')}</span>
            ) : (
              <Form.Item name="access" style={{ marginBottom: 0 }}>
                <AccessFields groups={groups} devices={devices} />
              </Form.Item>
            )}
          </Card>

          {/* The Admin has nothing to change here: the switch is locked and they reach everything. */}
          {isAdmin ? null : (
            <div className="drawer-footer">
              <span className="screen-spacer" />
              {/* Not resetFields: that goes back to the values at first load, not the last save. */}
              <Button onClick={() => form.setFieldsValue({ active: !account.disabled, access: account.access })}>
                {t('Discard changes')}
              </Button>
              <Button type="primary" htmlType="submit" loading={save.isPending}>
                {t('Save changes')}
              </Button>
            </div>
          )}
        </div>
      </Form>

      <Card title={t('Devices they reach ({n})', { n: reach.length })} className="table-card" styles={{ body: { padding: 0 } }}>
        <Table<Device>
          columns={columns}
          dataSource={reach}
          rowKey="host"
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <span className="muted">{t('No device yet. Add groups or single devices above.')}</span> }}
        />
      </Card>
    </div>
  )
}
