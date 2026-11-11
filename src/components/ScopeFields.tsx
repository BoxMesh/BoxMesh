import { Form, Segmented, Select } from 'antd'
import type { ReactNode } from 'react'
import type { Device, DeviceGroup } from '../types/device'
import type { Scope } from '../utils/devices'

/** Form fields `scope`, `groupIds` and `hosts`. On save, keep only the list the chosen scope names. */
export default function ScopeFields({
  scope,
  groups,
  devices,
  label = 'Applies to',
}: {
  scope: Scope
  groups: DeviceGroup[]
  devices: Device[]
  label?: ReactNode
}) {
  return (
    <>
      <Form.Item name="scope" label={label}>
        <Segmented<Scope>
          block
          options={[
            { value: 'all', label: 'All devices' },
            { value: 'groups', label: 'Groups' },
            { value: 'hosts', label: 'Devices' },
          ]}
        />
      </Form.Item>
      {scope === 'groups' ? (
        <Form.Item name="groupIds" rules={[{ required: true, type: 'array', min: 1, message: 'Pick at least one group.' }]}>
          <Select
            mode="multiple"
            allowClear
            placeholder="Pick groups"
            aria-label="Groups"
            optionFilterProp="label"
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
          />
        </Form.Item>
      ) : null}
      {scope === 'hosts' ? (
        <Form.Item name="hosts" rules={[{ required: true, type: 'array', min: 1, message: 'Pick at least one device.' }]}>
          <Select
            mode="multiple"
            allowClear
            placeholder="Pick devices"
            aria-label="Devices"
            optionFilterProp="label"
            options={devices.map((d) => ({ value: d.host, label: `${d.host} · ${d.alias}` }))}
          />
        </Form.Item>
      ) : null}
    </>
  )
}
