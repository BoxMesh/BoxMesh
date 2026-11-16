import { Form, Segmented, Select } from 'antd'
import type { ReactNode } from 'react'
import type { Device, DeviceGroup } from '../types/device'
import { deviceLabel, type Scope } from '../utils/devices'
import { t } from '../i18n'

/** Form fields `scope`, `groupIds` and `deviceIds`. On save, keep only the list the chosen scope names. */
export default function ScopeFields({
  scope,
  groups,
  devices,
  label = t('Applies to'),
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
            { value: 'all', label: t('All devices') },
            { value: 'groups', label: t('Groups') },
            { value: 'devices', label: t('Devices') },
          ]}
        />
      </Form.Item>
      {scope === 'groups' ? (
        <Form.Item name="groupIds" rules={[{ required: true, type: 'array', min: 1, message: t('Pick at least one group.') }]}>
          <Select
            mode="multiple"
            allowClear
            placeholder={t('Pick groups')}
            aria-label={t('Groups')}
            optionFilterProp="label"
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
          />
        </Form.Item>
      ) : null}
      {scope === 'devices' ? (
        <Form.Item name="deviceIds" rules={[{ required: true, type: 'array', min: 1, message: t('Pick at least one device.') }]}>
          <Select
            mode="multiple"
            allowClear
            placeholder={t('Pick devices')}
            aria-label={t('Devices')}
            optionFilterProp="label"
            options={devices.map((d) => ({ value: d.id, label: deviceLabel(d) }))}
          />
        </Form.Item>
      ) : null}
    </>
  )
}
