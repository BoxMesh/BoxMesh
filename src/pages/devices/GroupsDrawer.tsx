import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Button, Drawer, Form, Input, Popconfirm, Table, Tooltip, type TableProps } from 'antd'
import { useState } from 'react'
import { Icon, Th } from '../../components/Icon'
import { createGroup, deleteGroup, renameGroup } from '../../services/deviceService'
import type { Device, DeviceGroup } from '../../types/device'

const MAX_NAME = 40

interface Props {
  open: boolean
  onClose: () => void
  groups: DeviceGroup[]
  devices: Device[]
}

/** Create, rename and delete groups. Putting devices in them happens on each device's row. */
export default function GroupsDrawer({ open, onClose, groups, devices }: Props) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<{ name: string }>()
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)

  const sizeOf = (id: string) => devices.filter((d) => d.groups.includes(id)).length
  // Names are compared without case or outer spaces, so "Server" and " server" can't both exist.
  const taken = (name: string, except?: string) =>
    groups.some((g) => g.id !== except && g.name.trim().toLowerCase() === name.trim().toLowerCase())
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['groups'] })

  const create = useMutation({
    mutationFn: (name: string) => createGroup(name),
    onSuccess: (group) => {
      refresh()
      form.resetFields()
      message.success(`Group ${group.name} created`)
    },
    onError: (error) => message.error(error.message),
  })

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameGroup(id, name),
    onSuccess: () => {
      refresh()
      setEditing(null)
    },
    onError: (error) => message.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (group: DeviceGroup) => deleteGroup(group.id),
    onSuccess: (_, group) => {
      refresh()
      // Devices drop the deleted group's id, so their list changes too.
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      message.success(`Group ${group.name} deleted`)
    },
    onError: (error) => message.error(error.message),
  })

  const saveRename = () => {
    if (!editing) return
    const name = editing.name.trim()
    const before = groups.find((g) => g.id === editing.id)?.name
    if (!name || name === before) return setEditing(null)
    if (taken(name, editing.id)) return message.error(`There is already a group called ${name}.`)
    rename.mutate({ id: editing.id, name })
  }

  const columns: TableProps<DeviceGroup>['columns'] = [
    {
      title: <Th icon="tag" label="Group" />,
      key: 'name',
      render: (_, g) =>
        editing?.id === g.id ? (
          <Input
            size="small"
            autoFocus
            maxLength={MAX_NAME}
            aria-label={`New name for ${g.name}`}
            value={editing.name}
            onChange={(e) => setEditing({ id: g.id, name: e.target.value })}
            onPressEnter={saveRename}
            onBlur={saveRename}
            onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}
          />
        ) : (
          <span className="strong">{g.name}</span>
        ),
    },
    {
      title: <Th icon="devices" label="Devices" />,
      key: 'size',
      render: (_, g) => sizeOf(g.id),
    },
    {
      title: <Th icon="more" label="Actions" />,
      key: 'actions',
      render: (_, g) => {
        const size = sizeOf(g.id)
        return (
          <div className="row-actions">
            <Tooltip title={`Rename ${g.name}`}>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Rename ${g.name}`}
                onClick={() => setEditing({ id: g.id, name: g.name })}
              >
                <Icon name="edit" size={14} />
              </button>
            </Tooltip>
            <Popconfirm
              title={`Delete ${g.name}?`}
              description={
                size
                  ? `${size} ${size === 1 ? 'device leaves' : 'devices leave'} this group. The devices themselves stay.`
                  : 'No device is in this group.'
              }
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => remove.mutate(g)}
            >
              <button type="button" className="icon-btn" aria-label={`Delete ${g.name}`}>
                <Icon name="trash" size={14} />
              </button>
            </Popconfirm>
          </div>
        )
      },
    },
  ]

  return (
    <Drawer title="Groups" open={open} onClose={onClose} size={480}>
      <div className="stack">
        <Form form={form} layout="vertical" requiredMark={false} onFinish={({ name }) => create.mutate(name.trim())}>
          <Form.Item
            name="name"
            label="New group"
            rules={[
              { required: true, whitespace: true, message: 'Enter a name for the group.' },
              {
                validator: (_, value: string) =>
                  value && taken(value) ? Promise.reject(new Error('There is already a group with that name.')) : Promise.resolve(),
              },
            ]}
          >
            <Input maxLength={MAX_NAME} placeholder="e.g. Night shift" autoComplete="off" />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<Icon name="plus" size={14} />} loading={create.isPending}>
            Add group
          </Button>
        </Form>

        <Table<DeviceGroup>
          className="groups-table"
          columns={columns}
          dataSource={groups}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: <span className="muted">No groups yet. Add the first one above.</span> }}
        />
      </div>
    </Drawer>
  )
}
