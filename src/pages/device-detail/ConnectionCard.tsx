import { useQuery } from '@tanstack/react-query'
import { Card, Table, type TableProps } from 'antd'
import { connectionHistoryQuery } from '../../services/queries'
import type { ConnectionEvent, Device } from '../../types/device'
import { ago, formatDateTime } from '../../utils/time'

const columns: TableProps<ConnectionEvent>['columns'] = [
  { title: 'Event', dataIndex: 'event' },
  { title: 'Time', key: 'at', render: (_, r) => formatDateTime(r.at) },
  { title: 'Public IP', dataIndex: 'publicIp' },
  { title: 'Duration', dataIndex: 'duration' },
]

export default function ConnectionCard({ device: d }: { device: Device }) {
  // Not a suspense query: a failed history request only affects this card, not the whole page.
  const history = useQuery(connectionHistoryQuery(d.host))

  return (
    <Card title="Tunnel and connection history" styles={{ body: { padding: 0 } }}>
      <div className="kv" style={{ padding: '20px 24px' }}>
        <div>
          <div className="muted">Latency</div>
          <div className="kv-value">{d.online ? `${d.latencyMs} ms` : '—'}</div>
        </div>
        <div>
          <div className="muted">Last heartbeat</div>
          <div className="kv-value">{ago(d.lastSeen)}</div>
        </div>
      </div>
      <Table<ConnectionEvent>
        columns={columns}
        dataSource={history.data}
        loading={history.isPending}
        rowKey="at"
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <span className="muted">
              {history.error
                ? `Connection history didn't load (${history.error.message}). Reload the page to try again.`
                : 'No connections recorded yet.'}
            </span>
          ),
        }}
      />
    </Card>
  )
}
