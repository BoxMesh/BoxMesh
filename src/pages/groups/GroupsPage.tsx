import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query'
import { App, Button, Card, Checkbox, Drawer, Form, Input, Modal, Popconfirm, Segmented, Table, Tag, Tooltip, type TableProps } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router'
import { Icon, Th } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { tone } from '../../config/theme'
import { t } from '../../i18n'
import { createGroup, deleteGroup, renameGroup, setDeviceGroups } from '../../services/deviceService'
import { devicesQuery, groupsQuery } from '../../services/queries'
import type { Device, DeviceGroup } from '../../types/device'
import { deviceLabel, membershipChanges } from '../../utils/devices'

const MAX_NAME = 40
const TAGS_SHOWN = 3
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

export default function GroupsPage() {
  const [{ data: groups }, { data: devices }] = useSuspenseQueries({ queries: [groupsQuery, devicesQuery] })
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const [members, setMembers] = useState<DeviceGroup | null>(null)
  const [naming, setNaming] = useState<{ id: string; name: string } | null>(null)
  const membersOf = (id: string) => devices.filter((d) => d.groups.includes(id))
  const query = q.trim().toLowerCase()
  const rows = groups.filter((g) => !query || g.name.toLowerCase().includes(query) || membersOf(g.id).some((d) => d.host.toLowerCase().includes(query)))
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: groupsQuery.queryKey })
    queryClient.invalidateQueries({ queryKey: devicesQuery.queryKey })
  }

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameGroup(id, name),
    onSuccess: () => {
      refresh()
      setNaming(null)
    },
    onError: (error) => message.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (group: DeviceGroup) => deleteGroup(group.id),
    onSuccess: (_, group) => {
      refresh()
      message.success(t('Group {name} deleted', { name: group.name }))
    },
    onError: (error) => message.error(error.message),
  })

  const saveName = () => {
    if (!naming) return
    const name = naming.name.trim()
    const before = groups.find((g) => g.id === naming.id)?.name
    if (!name || name === before) return setNaming(null)
    if (groups.some((g) => g.id !== naming.id && sameName(g.name, name))) return message.error(t('There is already a group called {name}.', { name }))
    rename.mutate({ id: naming.id, name })
  }

  const columns: TableProps<DeviceGroup>['columns'] = [
    {
      title: <Th icon="tag" label={t('Group')} />,
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, g) =>
        naming?.id === g.id ? (
          <Input
            size="small"
            autoFocus
            maxLength={MAX_NAME}
            aria-label={t('New name for {name}', { name: g.name })}
            value={naming.name}
            onChange={(e) => setNaming({ id: g.id, name: e.target.value })}
            onPressEnter={saveName}
            onBlur={saveName}
            onKeyDown={(e) => e.key === 'Escape' && setNaming(null)}
            style={{ width: 200 }}
          />
        ) : (
          <Link to={`/devices?group=${g.id}`} className="strong">
            {g.name}
          </Link>
        ),
    },
    {
      title: <Th icon="devices" label={t('Devices')} />,
      key: 'size',
      align: 'right',
      sorter: (a, b) => membersOf(a.id).length - membersOf(b.id).length,
      render: (_, g) => membersOf(g.id).length,
    },
    {
      title: <Th icon="devices" label={t('Members')} />,
      key: 'members',
      render: (_, g) => {
        const list = membersOf(g.id)
        return (
          <span className="device-groups">
            {list.slice(0, TAGS_SHOWN).map((d) => (
              <Link key={d.id} to={`/devices/${encodeURIComponent(d.id)}`}>
                <Tag>{deviceLabel(d)}</Tag>
              </Link>
            ))}
            {list.length > TAGS_SHOWN ? (
              <Tooltip title={list.slice(TAGS_SHOWN).map(deviceLabel).join(', ')}>
                <Tag>+{list.length - TAGS_SHOWN}</Tag>
              </Tooltip>
            ) : null}
            {list.length ? (
              <Tooltip title={t('Edit devices')}>
                <button type="button" className="icon-btn device-groups-edit" aria-label={t('Edit devices in {name}', { name: g.name })} onClick={() => setMembers(g)}>
                  <Icon name="edit" size={14} />
                </button>
              </Tooltip>
            ) : (
              <Button size="small" type="dashed" icon={<Icon name="plus" size={12} />} aria-label={t('Add devices to {name}', { name: g.name })} onClick={() => setMembers(g)}>
                {t('Add devices')}
              </Button>
            )}
          </span>
        )
      },
    },
    {
      title: <Th icon="more" label={t('Actions')} />,
      key: 'actions',
      render: (_, g) => {
        const size = membersOf(g.id).length
        return (
          <div className="row-actions">
            <Tooltip title={t('Rename {name}', { name: g.name })}>
              <button type="button" className="icon-btn" aria-label={t('Rename {name}', { name: g.name })} onClick={() => setNaming({ id: g.id, name: g.name })}>
                <Icon name="edit" size={14} />
              </button>
            </Tooltip>
            <Popconfirm
              title={t('Delete {name}?', { name: g.name })}
              description={
                size === 1
                  ? t('{n} device leaves this group. The devices themselves stay.', { n: size })
                  : size
                    ? t('{n} devices leave this group. The devices themselves stay.', { n: size })
                    : t('No device is in this group.')
              }
              okText={t('Delete')}
              okButtonProps={{ danger: true }}
              onConfirm={() => remove.mutate(g)}
            >
              <button type="button" className="icon-btn" aria-label={t('Delete {name}', { name: g.name })}>
                <Icon name="trash" size={14} />
              </button>
            </Popconfirm>
          </div>
        )
      },
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title={t('Groups')}
        subtitle={t('Put devices in groups to scope access and alerts at once. A device can be in several groups.')}
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setCreating(true)}>
            {t('New group')}
          </Button>
        }
      />
      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <div className="filters">
          <Input
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('Search groups or devices')}
            aria-label={t('Search groups')}
            style={{ maxWidth: 280 }}
          />
        </div>
        <Table<DeviceGroup>
          columns={columns}
          dataSource={rows}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, hideOnSinglePage: true, showTotal: (total, [from, to]) => `${from}–${to} / ${total}` }}
          locale={{
            emptyText: <span className="muted">{groups.length ? t('No group matches this search.') : t('No groups yet. Create one, then add its devices.')}</span>,
          }}
        />
      </Card>
      <MembersDialog group={members} groups={groups} devices={devices} onClose={() => setMembers(null)} onSaved={refresh} />
      <NewGroupDialog
        open={creating}
        groups={groups}
        onClose={() => setCreating(false)}
        onCreated={(g) => {
          refresh()
          setMembers(g)
        }}
      />
    </div>
  )
}

type View = 'out' | 'in' | 'all'

function MembersDialog({ group, groups, devices, onClose, onSaved }: { group: DeviceGroup | null; groups: DeviceGroup[]; devices: Device[]; onClose: () => void; onSaved: () => void }) {
  return (
    <Drawer
      title={group ? t('Devices in {name}', { name: group.name }) : ''}
      open={Boolean(group)}
      onClose={onClose}
      size={520}
      destroyOnHidden
      styles={{ body: { display: 'flex', flexDirection: 'column', minHeight: 0, padding: 0 } }}
    >
      {group ? <MembersPicker group={group} groups={groups} devices={devices} onClose={onClose} onSaved={onSaved} /> : null}
    </Drawer>
  )
}

// One list: a tick means "in this group". The filter works on who is in the group now, so a row doesn't jump
// away when ticked; rows that will change say so in words.
function MembersPicker({ group, groups, devices, onClose, onSaved }: { group: DeviceGroup; groups: DeviceGroup[]; devices: Device[]; onClose: () => void; onSaved: () => void }) {
  const { message } = App.useApp()
  const inGroup = (d: Device) => d.groups.includes(group.id)
  const [chosen, setChosen] = useState(() => devices.filter(inGroup).map((d) => d.id))
  const outside = devices.filter((d) => !inGroup(d)).length
  const [view, setView] = useState<View>(outside ? 'out' : 'all')
  const [q, setQ] = useState('')
  const changes = membershipChanges(devices, group.id, chosen)
  const adding = changes.filter((c) => c.groupIds.includes(group.id)).length

  const picked = new Set(chosen)
  const query = q.trim().toLowerCase()
  const shown = devices.filter(
    (d) => (view === 'all' || inGroup(d) === (view === 'in')) && (!query || `${d.host} ${d.alias} ${d.ip}`.toLowerCase().includes(query)),
  )
  const shownPicked = shown.filter((d) => picked.has(d.id)).length
  const names = new Map(groups.map((g) => [g.id, g.name]))

  const toggle = (id: string, on: boolean) => setChosen((c) => (on ? [...c, id] : c.filter((x) => x !== id)))
  const toggleShown = (on: boolean) =>
    setChosen((c) => {
      const shownIds = new Set(shown.map((d) => d.id))
      const rest = c.filter((id) => !shownIds.has(id))
      return on ? [...rest, ...shownIds] : rest
    })

  // Membership lives on each device, so saving updates every device that joins or leaves; one failure doesn't stop the rest.
  const save = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(changes.map((c) => setDeviceGroups(c.id, c.groupIds)))
      const failed = changes.filter((_, i) => results[i].status === 'rejected').map((c) => c.host)
      if (failed.length) throw new Error(t('{hosts} could not be updated. Try again.', { hosts: failed.join(', ') }))
    },
    onSuccess: () => {
      onSaved()
      message.success(t('{name} saved', { name: group.name }))
      onClose()
    },
    onError: (error) => {
      onSaved()
      message.error(error.message)
    },
  })

  const empty = query ? t('No device matches this search.') : view === 'out' ? t('Every device is already in this group.') : t('No device is in this group.')

  return (
    <div className="member-picker">
      <div className="member-tools">
        <Input allowClear autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search devices')} aria-label={t('Search devices')} />
        <Segmented<View>
          block
          value={view}
          onChange={setView}
          options={[
            { value: 'out', label: t('Not added ({n})', { n: outside }) },
            { value: 'in', label: t('Added ({n})', { n: devices.length - outside }) },
            { value: 'all', label: t('All ({n})', { n: devices.length }) },
          ]}
        />
      </div>
      <div className="member-list">
        <div className="member-head">
          <Checkbox
            checked={shown.length > 0 && shownPicked === shown.length}
            indeterminate={shownPicked > 0 && shownPicked < shown.length}
            disabled={!shown.length}
            onChange={(e) => toggleShown(e.target.checked)}
          >
            {t('Select all {n} shown', { n: shown.length })}
          </Checkbox>
        </div>
        {shown.length ? (
          shown.map((d) => {
            const on = picked.has(d.id)
            const was = inGroup(d)
            const others = d.groups.filter((id) => id !== group.id && names.has(id)).map((id) => names.get(id))
            const sub = [d.alias, d.ip, ...others].filter(Boolean).join(' · ')
            return (
              <label key={d.id} className={`member-row${d.online ? '' : ' is-offline'}${on ? ' is-on' : ''}`}>
                <Checkbox checked={on} onChange={(e) => toggle(d.id, e.target.checked)} />
                <span className="member-main">
                  <span className="member-name">
                    <span className="strong">{d.host}</span>
                    {on && !was ? <Tag color="success">{t('Adding')}</Tag> : null}
                    {!on && was ? <Tag>{t('Removing')}</Tag> : null}
                  </span>
                  <span className="muted member-sub">{sub}</span>
                </span>
                <span className="member-status">
                  <span className="status-dot" style={{ background: d.online ? tone.positive : tone.disabled }} />
                  {d.online ? t('Online') : t('Offline')}
                </span>
              </label>
            )
          })
        ) : (
          <div className="member-empty muted">{empty}</div>
        )}
      </div>
      <div className="member-footer">
        <span className="muted" aria-live="polite">
          {changes.length ? t('{add} to add · {remove} to remove', { add: adding, remove: changes.length - adding }) : t('No changes yet')}
        </span>
        <span className="dialog-buttons">
          <Button onClick={onClose}>{t('Cancel')}</Button>
          <Button type="primary" disabled={!changes.length} loading={save.isPending} onClick={() => save.mutate()}>
            {t('Save changes')}
          </Button>
        </span>
      </div>
    </div>
  )
}

function NewGroupDialog({
  open,
  groups,
  onClose,
  onCreated,
}: {
  open: boolean
  groups: DeviceGroup[]
  onClose: () => void
  onCreated: (group: DeviceGroup) => void
}) {
  const { message } = App.useApp()
  const [form] = Form.useForm<{ name: string }>()

  const create = useMutation({
    mutationFn: (name: string) => createGroup(name),
    onSuccess: (group) => {
      message.success(t('Group {name} created. Now add its devices.', { name: group.name }))
      onClose()
      onCreated(group)
    },
    onError: (error) => message.error(error.message),
  })

  return (
    <Modal title={t('New group')} open={open} onCancel={onClose} width={440} destroyOnHidden footer={null}>
      <Form form={form} className="dialog-form" layout="vertical" requiredMark={false} onFinish={({ name }) => create.mutate(name.trim())}>
        <Form.Item
          name="name"
          label={t('Name')}
          rules={[
            { required: true, whitespace: true, message: t('Enter a name for the group.') },
            {
              validator: (_, value: string) =>
                value && groups.some((g) => sameName(g.name, value)) ? Promise.reject(new Error(t('There is already a group with that name.'))) : Promise.resolve(),
            },
          ]}
        >
          <Input autoFocus maxLength={MAX_NAME} placeholder={t('e.g. Night shift')} autoComplete="off" />
        </Form.Item>
        <div className="dialog-footer">
          <span className="dialog-buttons">
            <Button onClick={onClose}>{t('Cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={create.isPending}>
              {t('Create group')}
            </Button>
          </span>
        </div>
      </Form>
    </Modal>
  )
}
