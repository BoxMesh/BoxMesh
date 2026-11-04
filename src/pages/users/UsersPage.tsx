import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Drawer, Form, Input, Select, Switch, Table, Tag, type TableProps } from 'antd'
import { useState } from 'react'
import { Icon } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { inviteUser, updateUser } from '../../services/adminService'
import { devicesQuery, usersQuery } from '../../services/queries'
import type { Account, Role } from '../../types/admin'
import { ago } from '../../utils/time'

const ROLES: { value: Role; label: string; help: string }[] = [
  { value: 'Admin', label: 'Admin', help: 'Everything, plus users, certificates and settings' },
  { value: 'Operator', label: 'Operator', help: 'Runs commands and opens remote sessions' },
  { value: 'Viewer', label: 'Viewer', help: 'Read-only' },
]
const ROLE_COLOR: Record<Role, string> = { Admin: 'error', Operator: 'processing', Viewer: 'default' }

export default function UsersPage() {
  const [{ data: accounts }, { data: devices }] = useSuspenseQueries({ queries: [usersQuery, devicesQuery] })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<{ email: string; role: Role; scope: string[] }>()

  const groups = [...new Set(devices.map((d) => d.group))].sort()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const invite = useMutation({
    mutationFn: inviteUser,
    onSuccess: (account) => {
      refresh()
      setOpen(false)
      form.resetFields()
      message.success(`Invitation sent to ${account.email}`)
    },
    onError: (error) => message.error(error.message),
  })

  const change = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Account> }) => updateUser(id, patch),
    onSuccess: () => refresh(),
    onError: (error) => message.error(error.message),
  })

  const columns: TableProps<Account>['columns'] = [
    {
      title: 'Person',
      key: 'person',
      render: (_, a) => (
        <>
          <span className="strong">{a.name}</span>
          <div className="sub">{a.email}</div>
        </>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_, a) => (
        <Select
          value={a.role}
          size="small"
          style={{ minWidth: 120 }}
          aria-label={`Role for ${a.email}`}
          options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
          onChange={(role) => change.mutate({ id: a.id, patch: { role } })}
        />
      ),
    },
    {
      title: 'Can reach',
      key: 'scope',
      render: (_, a) =>
        a.scope.length === 0 ? (
          <Tag color={ROLE_COLOR[a.role]}>Every group</Tag>
        ) : (
          a.scope.map((g) => <Tag key={g}>{g}</Tag>)
        ),
    },
    {
      title: 'Last sign-in',
      key: 'last',
      render: (_, a) => (a.lastSignIn ? ago(a.lastSignIn) : <span className="muted">Never</span>),
    },
    {
      title: 'Active',
      key: 'active',
      render: (_, a) => (
        <Switch
          size="small"
          checked={!a.disabled}
          aria-label={`${a.email} can sign in`}
          onChange={(on) => change.mutate({ id: a.id, patch: { disabled: !on } })}
        />
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Users & Access"
        subtitle="Who can sign in, what they may do, and which groups they can reach."
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setOpen(true)}>
            Invite person
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

      <Drawer title="Invite a person" open={open} onClose={() => setOpen(false)} size={480}>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ role: 'Viewer', scope: [] }}
          onFinish={(values) => invite.mutate(values)}
        >
          <Form.Item
            name="email"
            label="Work email"
            normalize={(v: string) => v.trim()}
            rules={[
              { required: true, message: 'Enter their email.' },
              { type: 'email', message: 'Enter a valid email.' },
            ]}
          >
            <Input prefix={<Icon name="mail" />} autoComplete="off" />
          </Form.Item>
          <Form.Item name="role" label="Role">
            <Select options={ROLES.map((r) => ({ value: r.value, label: `${r.label} — ${r.help}` }))} />
          </Form.Item>
          <Form.Item name="scope" label="Groups they can reach" extra="Leave empty for every group.">
            <Select mode="multiple" placeholder="Every group" options={groups.map((g) => ({ value: g, label: g }))} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={invite.isPending}>
            Send invitation
          </Button>
        </Form>
      </Drawer>
    </div>
  )
}
