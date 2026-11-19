import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { App, Button, Card, Popconfirm, Table, Tag, Tooltip, type TableProps } from 'antd'
import { useState } from 'react'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { revokeToken } from '../../services/adminService'
import { tokensQuery } from '../../services/queries'
import type { EnrollmentToken } from '../../types/admin'
import { t } from '../../i18n'
import { formatDateTime } from '../../utils/time'
import EnrollDrawer from '../devices/EnrollDrawer'

const tail = (token: string) => token.slice(-4)
const short = (token: string) => (token.length > 16 ? `${token.slice(0, 8)}…${tail(token)}` : token)

export default function TokensPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const { data: tokens } = useSuspenseQuery(tokensQuery)
  const [creating, setCreating] = useState(false)

  const revoke = useMutation({
    mutationFn: (token: EnrollmentToken) => revokeToken(token.id),
    onSuccess: (_, token) => {
      queryClient.invalidateQueries({ queryKey: tokensQuery.queryKey })
      message.success(t('Token …{tail} revoked', { tail: tail(token.token) }))
    },
    onError: (error) => message.error(error.message),
  })

  const copy = (token: string) =>
    navigator.clipboard.writeText(token).then(
      () => message.success(t('Token copied')),
      () => message.error(t('Copy failed. Select the command and copy it manually.')),
    )

  const columns: TableProps<EnrollmentToken>['columns'] = [
    {
      title: <Th icon="hash" label={t('Token')} />,
      key: 'token',
      render: (_, tok) => <code>{short(tok.token)}</code>,
    },
    {
      title: <Th icon="check" label={t('Status')} />,
      key: 'status',
      render: (_, tok) =>
        Date.parse(tok.expiresAt) > Date.now() ? <Tag color="success">{t('Active')}</Tag> : <Tag>{t('Expired')}</Tag>,
    },
    { title: <Th icon="devices" label={t('Devices')} />, dataIndex: 'maxDevices', render: (n: number | null) => (n === null ? t('Unlimited') : t('up to {n}', { n })) },
    { title: <Th icon="clock" label={t('Expires')} />, dataIndex: 'expiresAt', render: (at: string) => formatDateTime(at) },
    {
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, tok) => (
        <div className="row-actions">
          <Tooltip title={t('Copy token')}>
            <button type="button" className="icon-btn" aria-label={t('Copy token …{tail}', { tail: tail(tok.token) })} onClick={() => copy(tok.token)}>
              <Icon name="copy" size={14} />
            </button>
          </Tooltip>
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
        subtitle={t('A token lets a new BoxAgent enroll. Copy it from here whenever you need it.')}
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
      <EnrollDrawer tokenOnly open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
