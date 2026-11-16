import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Button, Input, Tooltip } from 'antd'
import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { t } from '../../i18n'
import { setAlias } from '../../services/deviceService'
import { deviceQuery, devicesQuery } from '../../services/queries'
import type { Device } from '../../types/device'

const MAX_ALIAS = 100

/**
 * The device's alias beside its hostname, renamed in place like a group: Enter or leaving the field saves, Esc
 * cancels, and an empty alias clears it. Hostnames can repeat; the alias is how people tell such devices apart.
 */
export default function AliasEditor({ device }: { device: Device }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: (alias: string) => setAlias(device.id, alias),
    onSuccess: (saved) => {
      queryClient.setQueryData(deviceQuery(device.id).queryKey, saved)
      queryClient.invalidateQueries({ queryKey: devicesQuery.queryKey, exact: true })
      message.success(saved.alias ? t('Alias saved') : t('Alias removed'))
      setDraft(null)
    },
    onError: (error) => message.error(error.message),
  })

  const commit = () => {
    if (draft === null || save.isPending) return
    const alias = draft.trim()
    if (alias === device.alias) return setDraft(null)
    save.mutate(alias)
  }

  if (draft !== null)
    return (
      <Input
        size="small"
        autoFocus
        maxLength={MAX_ALIAS}
        placeholder={t('e.g. Front desk')}
        aria-label={t('Alias for {host}', { host: device.host })}
        value={draft}
        disabled={save.isPending}
        onChange={(e) => setDraft(e.target.value)}
        onPressEnter={commit}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Escape' && setDraft(null)}
        style={{ width: 220 }}
      />
    )

  return device.alias ? (
    <span className="device-groups">
      <span className="muted">{device.alias}</span>
      <Tooltip title={t('Change alias')}>
        <button
          type="button"
          className="icon-btn device-groups-edit"
          aria-label={t('Change alias for {host}', { host: device.host })}
          onClick={() => setDraft(device.alias)}
        >
          <Icon name="edit" size={14} />
        </button>
      </Tooltip>
    </span>
  ) : (
    <Button size="small" type="dashed" icon={<Icon name="plus" size={12} />} onClick={() => setDraft('')}>
      {t('Add alias')}
    </Button>
  )
}
