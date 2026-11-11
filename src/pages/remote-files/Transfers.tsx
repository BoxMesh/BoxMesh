import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Checkbox, Progress } from 'antd'
import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { tone } from '../../config/theme'
import { t } from '../../i18n'
import { transferQuery } from '../../services/queries'
import { cancelTransfer } from '../../services/remoteService'
import type { ConflictChoice, FileEntry, FileLocation, FileTransfer } from '../../types/remote'
import { compareListings, formatSize, type Comparison } from '../../utils/files'
import { ago } from '../../utils/time'

/** A copy waiting on the user: some names already exist in the target folder. */
export interface PendingCopy {
  from: FileLocation
  to: FileLocation
  names: string[]
  conflicts: string[]
  source: FileEntry[]
  target: FileEntry[]
}

interface Props {
  pending: PendingCopy | null
  /** Called once every conflict has a choice; names without a conflict are not in it. */
  onResolve: (choices: Record<string, ConflictChoice>) => void
  onAbandon: () => void
  transfers: string[]
  onClear: (ids: string[]) => void
}

const CHOICES = (): { value: ConflictChoice; label: string }[] => [
  { value: 'replace', label: t('Replace') },
  { value: 'keep-both', label: t('Keep both') },
  { value: 'skip', label: t('Skip') },
]

export default function Transfers({ pending, onResolve, onAbandon, transfers, onClear }: Props) {
  const queryClient = useQueryClient()
  const running = (id: string) =>
    queryClient.getQueryData<FileTransfer>(transferQuery(id).queryKey)?.items.some((i) => i.state === 'copying') ?? true

  if (!pending && transfers.length === 0) return null

  return (
    <Card
      className="table-card"
      title={t('Transfers')}
      extra={
        transfers.length > 0 ? (
          <Button size="small" onClick={() => onClear(transfers.filter((id) => !running(id)))}>
            {t('Clear finished')}
          </Button>
        ) : null
      }
      styles={{ body: { padding: 0 } }}
    >
      {/* Keyed so a new copy starts with no choices made. */}
      {pending ? <Conflicts key={pending.names.join('|')} pending={pending} onResolve={onResolve} onAbandon={onAbandon} /> : null}
      {transfers.map((id) => (
        <TransferGroup key={id} id={id} />
      ))}
    </Card>
  )
}

function Conflicts({ pending, onResolve, onAbandon }: Pick<Props, 'onResolve' | 'onAbandon'> & { pending: PendingCopy }) {
  const [choices, setChoices] = useState<Record<string, ConflictChoice>>({})
  const [applyAll, setApplyAll] = useState(false)
  const current = pending.conflicts.find((name) => !(name in choices))
  if (!current) return null

  const here = pending.source.find((e) => e.name === current)
  const there = pending.target.find((e) => e.name === current)
  const standing = here && there ? compareListings([here], [there]).get(current) : undefined
  const left = pending.conflicts.filter((name) => !(name in choices)).length

  const choose = (choice: ConflictChoice) => {
    const next = { ...choices }
    for (const name of applyAll ? pending.conflicts : [current]) if (!(name in next)) next[name] = choice
    if (pending.conflicts.every((name) => name in next)) onResolve(next)
    else setChoices(next)
  }

  return (
    <div className="files-conflict" role="alert">
      <Icon name="warning" />
      <p>
        <span className="strong">{current}</span> {t('already exists on {host}.', { host: pending.to.host })}
        {here && there
          ? ' ' +
            (standing === 'same'
              ? t('Both copies have the same size and time, so replacing it changes nothing.')
              : standingLine(standing ?? 'differs', {
                  host: pending.from.host,
                  when: ago(here.modified),
                  size: formatSize(here.size),
                  thereWhen: ago(there.modified),
                  thereSize: formatSize(there.size),
                }))
          : null}
      </p>
      <div className="files-conflict-actions">
        {CHOICES().map((c, i) => (
          <Button key={c.value} size="small" type={i === 0 ? 'primary' : 'default'} onClick={() => choose(c.value)}>
            {c.label}
          </Button>
        ))}
        {left > 1 ? (
          <Checkbox checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)}>
            {t('Apply to all {n}', { n: left })}
          </Checkbox>
        ) : null}
        <Button size="small" type="link" onClick={onAbandon}>
          {t('Cancel copy')}
        </Button>
      </div>
    </div>
  )
}

// A whole sentence per standing, so a language can put the comparison where its grammar wants it.
function standingLine(standing: Comparison, vars: Record<string, string>) {
  switch (standing) {
    case 'newer':
      return t('The copy on {host} is newer ({when}, {size}) than the one there ({thereWhen}, {thereSize}).', vars)
    case 'older':
      return t('The copy on {host} is older ({when}, {size}) than the one there ({thereWhen}, {thereSize}).', vars)
    case 'same':
      return t('The copy on {host} is the same ({when}, {size}) than the one there ({thereWhen}, {thereSize}).', vars)
    case 'only':
      return t('The copy on {host} is the only one ({when}, {size}) than the one there ({thereWhen}, {thereSize}).', vars)
    default:
      return t('The copy on {host} is a different size ({when}, {size}) than the one there ({thereWhen}, {thereSize}).', vars)
  }
}

const STATE_LABEL = () => ({
  done: t('Done'),
  skipped: t('Skipped'),
  cancelled: t('Cancelled'),
  failed: t('Failed'),
})

function TransferGroup({ id }: { id: string }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const { data: transfer } = useQuery(transferQuery(id))
  const cancel = useMutation({
    mutationFn: () => cancelTransfer(id),
    onSuccess: (next) => queryClient.setQueryData(transferQuery(id).queryKey, next),
    onError: (error) => message.error(error.message),
  })
  const running = transfer?.items.some((i) => i.state === 'copying') ?? true

  // Once the last file lands, the target folder has changed: reload its listing.
  const target = transfer?.to
  useEffect(() => {
    if (!running && target)
      queryClient.invalidateQueries({
        queryKey: ['devices', target.host, 'files', target.path],
      })
  }, [running, target, queryClient])

  if (!transfer) return null
  const copied = transfer.items.filter((i) => i.state !== 'skipped').length
  const files = copied === 1 ? t('{n} file', { n: copied }) : t('{n} files', { n: copied })

  return (
    <section className="files-transfer" aria-label={t('Copy to {host}', { host: transfer.to.host })}>
      <div className="files-transfer-head">
        <span>
          <span className="strong">
            {running
              ? t('Copying {files} to {host}', { files, host: transfer.to.host })
              : t('Copied {files} to {host}', { files, host: transfer.to.host })}
          </span>{' '}
          <code>{transfer.to.path}</code>
        </span>
        {running ? (
          <Button size="small" loading={cancel.isPending} onClick={() => cancel.mutate()}>
            {t('Cancel')}
          </Button>
        ) : null}
      </div>
      {transfer.items.map((item) => {
        const percent = item.size ? Math.round((item.copied / item.size) * 100) : 100
        return (
          <div key={item.name} className="files-transfer-row">
            <span className="files-transfer-name">{item.name}</span>
            <Progress
              percent={item.state === 'copying' || item.state === 'done' ? percent : 0}
              showInfo={false}
              size="small"
              strokeColor={tone.positive}
              aria-label={t('{name} copied', { name: item.name })}
            />
            <span className={item.state === 'failed' ? 'files-transfer-state error' : 'files-transfer-state'}>
              {item.state === 'copying'
                ? `${percent}%${item.copied ? ` · ${formatSize(item.copied)}` : ''}`
                : STATE_LABEL()[item.state]}
            </span>
          </div>
        )
      })}
    </section>
  )
}
