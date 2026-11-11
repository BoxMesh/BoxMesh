import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Popconfirm, Table, Tag, Tooltip, type TableProps } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { revokeToken } from '../../services/adminService'
import { groupsQuery, tokensQuery } from '../../services/queries'
import type { EnrollmentToken } from '../../types/admin'
import { formatDateTime } from '../../utils/time'
import EnrollDrawer from '../devices/EnrollDrawer'

const tail = (token: string) => token.slice(-4)

export default function TokensPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [{ data: tokens }, { data: groups }] = useSuspenseQueries({ queries: [tokensQuery, groupsQuery] })
  const [creating, setCreating] = useState(false)

  const revoke = useMutation({
    mutationFn: (token: EnrollmentToken) => revokeToken(token.id),
    onSuccess: (_, token) => {
      queryClient.invalidateQueries({ queryKey: tokensQuery.queryKey })
      message.success(`Token …${tail(token.token)} revoked`)
    },
    onError: (error) => message.error(error.message),
  })

  const columns: TableProps<EnrollmentToken>['columns'] = [
    {
      title: <Th icon="hash" label="Token" />,
      key: 'token',
      render: (_, t) => <code>…{tail(t.token)}</code>,
    },
    {
      title: <Th icon="check" label="Status" />,
      key: 'status',
      render: (_, t) =>
        Date.parse(t.expiresAt) > Date.now() ? <Tag color="success">Active</Tag> : <Tag>Expired</Tag>,
    },
    { title: <Th icon="tag" label="Default group" />, dataIndex: 'group', render: (group: string) => <Tag color="processing">{group}</Tag> },
    { title: <Th icon="clock" label="Expires" />, dataIndex: 'expiresAt', render: (at: string) => formatDateTime(at) },
    {
      title: <Th icon="security" label="Approval" />,
      dataIndex: 'requiresApproval',
      render: (approval: boolean) => (approval ? 'An admin approves each agent' : <span className="muted">Automatic</span>),
    },
    {
      title: <Th icon="devices" label="Used by" />,
      dataIndex: 'usedBy',
      render: (hosts: string[]) =>
        hosts.length ? (
          <span className="queue-tags">
            {hosts.map((h) => (
              <Link key={h} to={`/devices/${h}`}>
                <Tag>{h}</Tag>
              </Link>
            ))}
          </span>
        ) : (
          <span className="muted">—</span>
        ),
    },
    {
      title: <Th icon="more" label="Actions" />,
      key: 'actions',
      render: (_, t) => (
        <div className="row-actions">
          <Popconfirm
            title={`Revoke token …${tail(t.token)}?`}
            description="Agents can no longer enroll with it. Devices already enrolled keep working."
            okText="Revoke"
            okButtonProps={{ danger: true }}
            onConfirm={() => revoke.mutate(t)}
          >
            <Tooltip title="Revoke">
              <button type="button" className="icon-btn" aria-label={`Revoke token …${tail(t.token)}`}>
                <Icon name="trash" size={14} />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Enrollment tokens"
        subtitle="A token lets a new BoxAgent enroll. It is shown in full only once, when it is created; here you see its last characters."
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setCreating(true)}>
            Create token
          </Button>
        }
      />
      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <Table<EnrollmentToken>
          columns={columns}
          dataSource={tokens}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, hideOnSinglePage: true, showTotal: (total, [from, to]) => `${from}–${to} / ${total}` }}
          locale={{ emptyText: <span className="muted">No tokens yet. Create one to enroll an agent.</span> }}
        />
      </Card>
      <EnrollDrawer open={creating} onClose={() => setCreating(false)} groups={groups.map((g) => g.name)} />
    </div>
  )
}
