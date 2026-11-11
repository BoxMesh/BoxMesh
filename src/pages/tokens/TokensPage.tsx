import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Popconfirm, Table, Tag, Tooltip, type TableProps } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { revokeToken } from '../../services/adminService'
import { groupsQuery, tokensQuery } from '../../services/queries'
import type { EnrollmentToken } from '../../types/admin'
import { t } from '../../i18n'
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
      message.success(t('Token …{tail} revoked', { tail: tail(token.token) }))
    },
    onError: (error) => message.error(error.message),
  })

  const columns: TableProps<EnrollmentToken>['columns'] = [
    {
      title: <Th icon="hash" label={t('Token')} />,
      key: 'token',
      render: (_, tok) => <code>…{tail(tok.token)}</code>,
    },
    {
      title: <Th icon="check" label={t('Status')} />,
      key: 'status',
      render: (_, tok) =>
        Date.parse(tok.expiresAt) > Date.now() ? <Tag color="success">{t('Active')}</Tag> : <Tag>{t('Expired')}</Tag>,
    },
    { title: <Th icon="tag" label={t('Default group')} />, dataIndex: 'group', render: (group: string) => <Tag color="processing">{group}</Tag> },
    { title: <Th icon="clock" label={t('Expires')} />, dataIndex: 'expiresAt', render: (at: string) => formatDateTime(at) },
    {
      title: <Th icon="security" label={t('Approval')} />,
      dataIndex: 'requiresApproval',
      render: (approval: boolean) => (approval ? t('An admin approves each agent') : <span className="muted">{t('Automatic')}</span>),
    },
    {
      title: <Th icon="devices" label={t('Used by')} />,
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
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, tok) => (
        <div className="row-actions">
          <Popconfirm
            title={t('Revoke token …{tail}?', { tail: tail(tok.token) })}
            description={t('Agents can no longer enroll with it. Devices already enrolled keep working.')}
            okText={t('Revoke')}
            okButtonProps={{ danger: true }}
            onConfirm={() => revoke.mutate(tok)}
          >
            <Tooltip title={t('Revoke')}>
              <button type="button" className="icon-btn" aria-label={t('Revoke token …{tail}', { tail: tail(tok.token) })}>
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
        title={t('Enrollment tokens')}
        subtitle={t('A token lets a new BoxAgent enroll. It is shown in full only once, when it is created; here you see its last characters.')}
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setCreating(true)}>
            {t('Create token')}
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
          locale={{ emptyText: <span className="muted">{t('No tokens yet. Create one to enroll an agent.')}</span> }}
        />
      </Card>
      <EnrollDrawer open={creating} onClose={() => setCreating(false)} groups={groups.map((g) => g.name)} />
    </div>
  )
}
