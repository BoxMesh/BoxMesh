import { useQuery } from '@tanstack/react-query'
import { App, Breadcrumb, Button, Card, Dropdown, Table, Tag, type TableProps } from 'antd'
import { useState, type ReactNode } from 'react'
import { Icon, Th } from '../../components/Icon'
import { useNotSupported } from '../../hooks/useNotSupported'
import { t } from '../../i18n'
import { userMessage } from '../../services/http'
import { filesQuery } from '../../services/queries'
import type { Device } from '../../types/device'
import type { FileEntry } from '../../types/remote'
import { formatSize, joinPath, parentOf, rootOf, sepOf, type Comparison } from '../../utils/files'
import { ago } from '../../utils/time'

const COMPARED: Record<Comparison, { color: string; label: string }> = {
  newer: { color: 'warning', label: t('Newer here') },
  only: { color: 'processing', label: t('Only here') },
  older: { color: 'default', label: t('Older here') },
  same: { color: 'default', label: t('Same') },
  differs: { color: 'default', label: t('Different size') },
}

interface Props {
  device: Device
  path: string
  onPath: (path: string) => void
  /** A row above the path bar: the device picker and close button in two-device mode. */
  head?: ReactNode
  /** The right end of the path bar, e.g. Upload. */
  tools?: ReactNode
  /** File names ticked for copying; passing it turns the checkboxes on. Folders can't be ticked. */
  selected?: string[]
  onSelect?: (names: string[]) => void
  /** Each file's standing against the folder open on the other device; adds a Compared column. */
  comparison?: Map<string, Comparison>
  /** Turns file rows draggable; gets the ticked group when the dragged row is ticked, else just that row. */
  onDragFiles?: (names: string[]) => void
  onDragDone?: () => void
  /** Set while files from the other pane are dragged: this pane shows the label and takes the drop. */
  drop?: { label: string; onDrop: () => void } | null
}

export default function FileBrowser({
  device,
  path,
  onPath,
  head,
  tools,
  selected,
  onSelect,
  comparison,
  onDragFiles,
  onDragDone,
  drop,
}: Props) {
  const { message } = App.useApp()
  const notSupported = useNotSupported()
  const [over, setOver] = useState(false)
  const sep = sepOf(device)
  const root = rootOf(device)
  const listing = useQuery(filesQuery(device.host, path))
  const entries = listing.data?.entries

  const columns: TableProps<FileEntry>['columns'] = [
    {
      title: <Th icon="files" label={t('Name')} />,
      key: 'name',
      render: (_, entry) =>
        entry.kind === 'folder' ? (
          <button type="button" className="link-cell" onClick={() => onPath(joinPath(path, entry.name, sep))}>
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
    {
      title: <Th icon="box" label={t('Size')} />,
      key: 'size',
      render: (_, e) => formatSize(e.size),
    },
    {
      title: <Th icon="clock" label={t('Modified')} />,
      key: 'modified',
      render: (_, e) => ago(e.modified),
    },
    ...(comparison
      ? [
          {
            title: <Th icon="swap" label={t('Compared')} />,
            key: 'compared',
            render: (_: unknown, e: FileEntry) => {
              const c = comparison.get(e.name)
              return c ? <Tag color={COMPARED[c].color}>{COMPARED[c].label}</Tag> : <span className="muted">—</span>
            },
          },
        ]
      : []),
  ]
  // Comparing adds a column; dropping the per-row actions then keeps both panes inside their width.
  if (!comparison)
    columns.push({
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, entry) => (
        <div className="row-actions">
          {entry.kind === 'file' ? (
            <Button size="small" onClick={() => notSupported(t('Downloading files'))}>
              {t('Download')}
            </Button>
          ) : null}
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'rename', label: t('Rename') },
                { key: 'copy', label: t('Copy path') },
                { type: 'divider' },
                { key: 'delete', label: t('Delete') },
              ],
              onClick: ({ key }) =>
                key === 'copy'
                  ? navigator.clipboard.writeText(joinPath(path, entry.name, sep)).then(
                      () => message.success(t('Path copied')),
                      () => message.error(t('Copy failed. Select the path and copy it manually.')),
                    )
                  : notSupported(key === 'delete' ? t('Deleting files') : t('Renaming files')),
            }}
          >
            <button type="button" className="icon-btn" aria-label={t('More actions for {name}', { name: entry.name })}>
              <Icon name="more" />
            </button>
          </Dropdown>
        </div>
      ),
    })

  const parts = path.slice(root.length).split(sep).filter(Boolean)
  const crumbs = [
    {
      title: (
        <button type="button" className="link-cell" onClick={() => onPath(root)}>
          {root}
        </button>
      ),
    },
    ...parts.map((part, i) => ({
      title: (
        <button type="button" className="link-cell" onClick={() => onPath(root + parts.slice(0, i + 1).join(sep))}>
          {part}
        </button>
      ),
    })),
  ]

  const picked = selected ? (entries ?? []).filter((e) => selected.includes(e.name)) : []

  return (
    <Card
      className={`table-card files-pane${drop ? ' is-drop' : ''}${drop && over ? ' is-over' : ''}`}
      styles={{ body: { padding: 0 } }}
      onDragOver={
        drop
          ? (e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
              setOver(true)
            }
          : undefined
      }
      onDragLeave={drop ? (e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOver(false) : undefined}
      onDrop={
        drop
          ? (e) => {
              e.preventDefault()
              setOver(false)
              drop.onDrop()
            }
          : undefined
      }
    >
      {drop ? (
        <div className="files-drop" aria-hidden="true">
          <span>{drop.label}</span>
        </div>
      ) : null}
      {head ? <div className="files-head">{head}</div> : null}
      <div className="filters">
        <Button onClick={() => onPath(parentOf(path, root, sep))} disabled={path === root} icon={<Icon name="back" size={14} />}>
          {t('Up')}
        </Button>
        <Breadcrumb items={crumbs} separator={sep} />
        <span className="screen-spacer" />
        {tools}
      </div>
      {picked.length > 0 ? (
        <div className="files-picked" role="status">
          <span>
            <span className="strong">{t('{n} selected', { n: picked.length })}</span> ·{' '}
            {formatSize(picked.reduce((sum, e) => sum + e.size, 0))}
          </span>
          <Button type="link" size="small" onClick={() => onSelect?.([])}>
            {t('Clear')}
          </Button>
        </div>
      ) : null}
      <Table<FileEntry>
        columns={columns}
        dataSource={entries}
        loading={listing.isPending}
        rowKey="name"
        pagination={false}
        scroll={{ x: 'max-content' }}
        onRow={(entry) =>
          onDragFiles && entry.kind === 'file'
            ? {
                draggable: true,
                className: 'files-draggable',
                onDragStart: (e) => {
                  const names = selected?.includes(entry.name) ? selected : [entry.name]
                  e.dataTransfer.effectAllowed = 'copy'
                  e.dataTransfer.setData('text/plain', names.join('\n'))
                  onDragFiles(names)
                },
                onDragEnd: () => onDragDone?.(),
              }
            : {}
        }
        rowSelection={
          selected
            ? {
                selectedRowKeys: selected,
                onChange: (keys) => onSelect?.(keys.map(String)),
                getCheckboxProps: (e) => ({
                  disabled: e.kind === 'folder',
                  'aria-label': t('Select {name}', { name: e.name }),
                }),
              }
            : undefined
        }
        locale={{
          emptyText: (
            <span className="muted">
              {listing.error
                ? t("This folder didn't load. {reason}", { reason: userMessage(listing.error) })
                : t('This folder is empty.')}
            </span>
          ),
        }}
      />
    </Card>
  )
}
