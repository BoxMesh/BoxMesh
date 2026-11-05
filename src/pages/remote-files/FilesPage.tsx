import { useQuery } from '@tanstack/react-query'
import { App, Breadcrumb, Button, Card, Dropdown, Table, Upload, type TableProps } from 'antd'
import { useState } from 'react'
import DevicePicker, { DeviceOffline, PickFirst } from '../../components/DevicePicker'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { useDeviceParam } from '../../hooks/useDeviceParam'
import { userMessage } from '../../services/http'
import { filesQuery } from '../../services/queries'
import type { Device } from '../../types/device'
import type { FileEntry } from '../../types/remote'
import { ago } from '../../utils/time'

const sepOf = (device: Device) => (device.osFamily === 'Linux' ? '/' : '\\')
const rootOf = (device: Device) => (device.osFamily === 'Linux' ? '/' : 'C:\\')

const join = (path: string, name: string, sep: string) => (path.endsWith(sep) ? path + name : path + sep + name)

const parentOf = (path: string, root: string, sep: string) => {
  const cut = path.lastIndexOf(sep)
  return cut <= 0 ? root : path.slice(0, cut) || root
}

const size = (bytes: number) => {
  if (bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function FilesPage() {
  const { devices, host, device, setHost } = useDeviceParam()

  return (
    <div className="stack">
      <PageHeader
        title="Remote Files"
        subtitle="Browse, download and upload files on a device through its agent tunnel."
        actions={<DevicePicker devices={devices} host={host} onChange={setHost} />}
      />
      {!device ? (
        <Card>
          <PickFirst icon="files" what="browse files on" />
        </Card>
      ) : !device.online ? (
        <Card>
          <DeviceOffline device={device} />
        </Card>
      ) : (
        // Keyed by host: each device has its own root, so browsing starts there again.
        <Browser key={device.host} device={device} />
      )}
    </div>
  )
}

function Browser({ device }: { device: Device }) {
  const { message } = App.useApp()
  const sep = sepOf(device)
  const root = rootOf(device)
  const [path, setPath] = useState(root)
  const listing = useQuery(filesQuery(device.host, path))

  const columns: TableProps<FileEntry>['columns'] = [
    {
      title: <Th icon="files" label="Name" />,
      key: 'name',
      render: (_, entry) =>
        entry.kind === 'folder' ? (
          <button type="button" className="link-cell" onClick={() => setPath(join(path, entry.name, sep))}>
            <Icon name="files" size={14} />
            {entry.name}
          </button>
        ) : (
          <span className="link-cell">
            <Icon name="audit" size={14} />
            {entry.name}
          </span>
        ),
    },
    { title: <Th icon="box" label="Size" />, key: 'size', render: (_, e) => size(e.size) },
    { title: <Th icon="clock" label="Modified" />, key: 'modified', render: (_, e) => ago(e.modified) },
    {
      title: <Th icon="more" label="Actions" />,
      key: 'actions',
      render: (_, entry) => (
        <div className="row-actions">
          {entry.kind === 'file' ? (
            <Button size="small" onClick={() => message.success(`Downloading ${entry.name}`)}>
              Download
            </Button>
          ) : null}
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'rename', label: 'Rename' },
                { key: 'copy', label: 'Copy path' },
                { type: 'divider' },
                { key: 'delete', label: 'Delete', danger: true },
              ],
              onClick: ({ key }) =>
                key === 'copy'
                  ? navigator.clipboard.writeText(join(path, entry.name, sep)).then(
                      () => message.success('Path copied'),
                      () => message.error('Copy failed. Select the path and copy it manually.'),
                    )
                  : message.info(`${key === 'delete' ? 'Deleting' : 'Renaming'} isn't available in the demo.`),
            }}
          >
            <button type="button" className="icon-btn" aria-label={`More actions for ${entry.name}`}>
              <Icon name="more" />
            </button>
          </Dropdown>
        </div>
      ),
    },
  ]

  const parts = path.slice(root.length).split(sep).filter(Boolean)
  const crumbs = [
    {
      title: (
        <button type="button" className="link-cell" onClick={() => setPath(root)}>
          {root}
        </button>
      ),
    },
    ...parts.map((part, i) => ({
      title: (
        <button type="button" className="link-cell" onClick={() => setPath(root + parts.slice(0, i + 1).join(sep))}>
          {part}
        </button>
      ),
    })),
  ]

  return (
    <Card className="table-card" styles={{ body: { padding: 0 } }}>
      <div className="filters">
        <Button onClick={() => setPath(parentOf(path, root, sep))} disabled={path === root} icon={<Icon name="back" size={14} />}>
          Up
        </Button>
        <Breadcrumb items={crumbs} separator={sep} />
        <span className="screen-spacer" />
        <Upload
          beforeUpload={(file) => {
            message.success(`${file.name} uploaded to ${path}`)
            return false
          }}
          showUploadList={false}
        >
          <Button type="primary" icon={<Icon name="plus" size={14} />}>
            Upload
          </Button>
        </Upload>
      </div>
      <Table<FileEntry>
        columns={columns}
        dataSource={listing.data?.entries}
        loading={listing.isPending}
        rowKey="name"
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <span className="muted">
              {listing.error ? `This folder didn't load. ${userMessage(listing.error)}` : 'This folder is empty.'}
            </span>
          ),
        }}
      />
    </Card>
  )
}
