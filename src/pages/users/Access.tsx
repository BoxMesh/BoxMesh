import { Button, Segmented, Tag, Tooltip, Transfer } from 'antd'
import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { t } from '../../i18n'
import type { Account, DeviceAccess, Role } from '../../types/admin'
import type { Device, DeviceGroup } from '../../types/device'
import { deviceLabel, reachable } from '../../utils/devices'

const NONE: DeviceAccess = { groupIds: [], deviceIds: [] }
const TAGS_SHOWN = 3

/** A role as shown; the value itself stays English because it is compared and sent to EdgePanel. */
export function RoleName({ role }: { role: Role }) {
  return role === 'System' ? t('System') : t('User')
}

// value and onChange are optional so Form.Item can supply them.
interface FieldsProps {
  value?: DeviceAccess
  onChange?: (access: DeviceAccess) => void
  groups: DeviceGroup[]
  devices: Device[]
}

type Part = 'groupIds' | 'deviceIds'
const WORDS = (): Record<Part, { search: string; add: string; remove: string; one: string; many: string }> => ({
  groupIds: {
    search: t('Search groups'),
    add: t('Add the checked groups'),
    remove: t('Remove the checked groups'),
    one: t('group'),
    many: t('groups'),
  },
  deviceIds: {
    search: t('Search devices'),
    add: t('Add the checked devices'),
    remove: t('Remove the checked devices'),
    one: t('device'),
    many: t('devices'),
  },
})
interface Item {
  key: string
  title: string
  description: string
}

/**
 * What a System account fills in for a User: whole groups, and single devices outside them. Each is a two-list
 * picker (Available, Chosen) moved with arrow buttons, like Django's filter_horizontal: on a phone a tap and an
 * arrow are easier than dragging, which fights the page scroll. The lists stack on narrow screens.
 */
export function AccessFields({ value = NONE, onChange = () => {}, groups, devices }: FieldsProps) {
  const [part, setPart] = useState<Part>('groupIds')
  const count = reachable(value, devices).length
  const items: Item[] =
    part === 'groupIds'
      ? groups.map((g) => {
          const size = devices.filter((d) => d.groups.includes(g.id)).length
          return { key: g.id, title: g.name, description: size === 1 ? t('{n} device', { n: size }) : t('{n} devices', { n: size }) }
        })
      : devices.map((d) => ({ key: d.id, title: d.host, description: d.alias }))
  const words = WORDS()[part]

  return (
    <div className="access-fields">
      <Segmented<Part>
        block
        value={part}
        onChange={setPart}
        options={[
          { value: 'groupIds', label: t('Groups ({n})', { n: value.groupIds.length }) },
          { value: 'deviceIds', label: t('Single devices ({n})', { n: value.deviceIds.length }) },
        ]}
      />
      <Transfer<Item>
        key={part}
        className="access-transfer"
        dataSource={items}
        targetKeys={value[part]}
        onChange={(keys) => onChange({ ...value, [part]: keys.map(String) })}
        titles={[t('Available'), t('Chosen')]}
        showSearch={{ placeholder: words.search }}
        filterOption={(q, item) => `${item.title} ${item.description}`.toLowerCase().includes(q.trim().toLowerCase())}
        render={(item) => (
          <span className="access-item">
            <span className="strong">{item.title}</span>
            <span className="muted">{item.description}</span>
          </span>
        )}
        actions={[
          <Button key="add" aria-label={words.add} icon={<Icon name="arrow" size={14} />} />,
          <Button key="remove" aria-label={words.remove} icon={<Icon name="arrow-left" size={14} />} />,
        ]}
        locale={{ itemUnit: words.one, itemsUnit: words.many, notFoundContent: <span className="muted">{t('None')}</span> }}
      />
      <span className="sub">
        {count === 1
          ? t('Reaches 1 device in all, groups and single devices together. New devices added to a group are included.')
          : count
            ? t('Reaches {n} devices in all, groups and single devices together. New devices added to a group are included.', { n: count })
            : t('Reaches no device yet.')}
      </span>
    </div>
  )
}

/** One half of what an account can reach, read-only, for a users-table column. The System account reaches everything. */
export function AccessTags({
  account,
  part,
  groups,
  devices,
}: {
  account: Account
  part: 'groups' | 'devices'
  groups: DeviceGroup[]
  devices: Device[]
}) {
  if (account.role === 'System') return <span className="muted">{part === 'groups' ? t('All groups') : t('All devices')}</span>
  const access = account.access ?? NONE
  const names = new Map(groups.map((g) => [g.id, g.name]))
  const deviceNames = new Map(devices.map((d) => [d.id, deviceLabel(d)]))
  // A group deleted since keeps its id until the account is saved again; it has no name to show.
  const tags: [id: string, label: string][] =
    part === 'groups'
      ? access.groupIds.filter((id) => names.has(id)).map((id) => [id, names.get(id)!])
      : access.deviceIds.map((id) => [id, deviceNames.get(id) ?? id])
  if (!tags.length) return <span className="muted">—</span>
  return (
    <span className="device-groups">
      {tags.slice(0, TAGS_SHOWN).map(([id, label]) => (
        <Tag key={id} color={part === 'groups' ? 'processing' : 'default'}>
          {label}
        </Tag>
      ))}
      {tags.length > TAGS_SHOWN ? (
        <Tooltip title={tags.slice(TAGS_SHOWN).map(([, label]) => label).join(', ')}>
          <span className="muted">+{tags.length - TAGS_SHOWN}</span>
        </Tooltip>
      ) : null}
    </span>
  )
}
