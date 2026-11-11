import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Button, Popover, Select, Tag, Tooltip } from 'antd'
import { useState } from 'react'
import { setDeviceGroups } from '../services/deviceService'
import type { Device, DeviceGroup } from '../types/device'
import { t } from '../i18n'
import { Icon } from './Icon'

/**
 * A device's groups as tags, with an edit button that opens a multi-select. A change saves at once: picking
 * or removing a group is the whole action, so there is no separate Save step to forget.
 */
export default function DeviceGroups({ device, groups }: { device: Device; groups: DeviceGroup[] }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  // Held locally so the picker answers instantly while the save is in flight.
  const [value, setValue] = useState(device.groups)
  const names = new Map(groups.map((g) => [g.id, g.name]))
  // A group deleted elsewhere can linger on a device until the list reloads; it has no name to show.
  const shown = device.groups.filter((id) => names.has(id))

  const save = useMutation({
    mutationFn: (ids: string[]) => setDeviceGroups(device.host, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devices'] }),
    onError: (error) => {
      setValue(device.groups)
      message.error(error.message)
    },
  })

  // With no group the empty slot is itself the way in: a dashed "Add to group" button opens the picker.
  // With groups, the tags lead and a small edit button sits after them.
  const trigger = shown.length ? (
    <Tooltip title={t('Change groups')}>
      <button type="button" className="icon-btn device-groups-edit" aria-label={t('Change groups for {host}', { host: device.host })}>
        <Icon name="edit" size={14} />
      </button>
    </Tooltip>
  ) : (
    <Button size="small" type="dashed" icon={<Icon name="plus" size={12} />} aria-label={t('Add {host} to a group', { host: device.host })}>
      {t('Add to group')}
    </Button>
  )

  return (
    <span className="device-groups">
      {shown.map((id) => (
        <Tag key={id} color="processing">
          {names.get(id)}
        </Tag>
      ))}
      <Popover
        trigger="click"
        placement="bottomLeft"
        title={t('Groups for {host}', { host: device.host })}
        onOpenChange={(open) => open && setValue(device.groups)}
        content={
          <Select
            mode="multiple"
            autoFocus
            allowClear
            className="device-groups-select"
            placeholder={t('Pick one or more groups')}
            aria-label={t('Groups for {host}', { host: device.host })}
            value={value.filter((id) => names.has(id))}
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
            optionFilterProp="label"
            notFoundContent={<span className="muted">{t('No groups yet. Create one on the Groups page.')}</span>}
            onChange={(ids: string[]) => {
              setValue(ids)
              save.mutate(ids)
            }}
          />
        }
      >
        {trigger}
      </Popover>
    </span>
  )
}
