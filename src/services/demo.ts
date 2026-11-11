import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import type { CommandRule } from '../types/admin'
import type { Alert, AlertChannel, AlertRule, ChannelInput } from '../types/alert'
import type { TimeRange } from '../types/dashboard'
import type { FileEntry, FileTransfer, NewFileTransfer, Shell } from '../types/remote'
import { blockedBy } from '../utils/commands'
import { MINUTE, fromNow } from '../utils/time'
import * as seed from './demoData'
import { http } from './http'

const FLAG = 'boxmesh-demo'

/** Demo mode is read before React renders, so the adapter is in place for the first request. */
export function isDemo() {
  try {
    return sessionStorage.getItem(FLAG) === '1'
  } catch {
    return false
  }
}

export function startDemo() {
  try {
    sessionStorage.setItem(FLAG, '1')
  } catch {
    // Storage blocked: install the adapter anyway, so the demo lasts until the page reloads.
  }
  install()
}

export function stopDemo() {
  try {
    sessionStorage.removeItem(FLAG)
  } catch {
    // Nothing was stored.
  }
}

// Everything a demo visitor changes lives here and is gone on reload. That is the point: it keeps the
// demo honest about being a demo, and nothing can leak into a real deployment.
const state = {
  tokens: structuredClone(seed.enrollmentTokens),
  accounts: structuredClone(seed.accounts),
  pending: structuredClone(seed.pendingEnrollments),
  groups: structuredClone(seed.groups),
  commandRules: structuredClone(seed.commandRules),
  alertRules: structuredClone(seed.alertRules),
  alerts: structuredClone(seed.alerts),
  alertChannels: structuredClone(seed.alertChannels),
  // Files copied in the demo, by "host|path", shown on top of the seeded listing.
  copied: {} as Record<string, FileEntry[]>,
  transfers: {} as Record<string, { transfer: FileTransfer; startedAt: number; cancelledAt?: number }>,
}

// A demo copy runs at about 1 MB/s, at least 1.5 s per file, so the progress bars have something to show.
const copyMs = (size: number) => Math.max(1500, size / 1000)

function listWithCopies(host: string, path: string) {
  const listing = seed.listFiles(host, path)
  const extra = state.copied[`${host}|${path}`] ?? []
  const names = new Set(extra.map((e) => e.name))
  return { ...listing, entries: [...listing.entries.filter((e) => !names.has(e.name)), ...extra] }
}

/** "report.xlsx" → "report (copy).xlsx", then "(copy 2)", until the name is free. */
function freeName(name: string, taken: Set<string>) {
  const dot = name.lastIndexOf('.')
  const [stem, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, '']
  for (let n = 1; ; n++) {
    const candidate = `${stem} (copy${n > 1 ? ` ${n}` : ''})${ext}`
    if (!taken.has(candidate)) return candidate
  }
}

function startDemoTransfer(input: NewFileTransfer): FileTransfer {
  const source = listWithCopies(input.from.host, input.from.path).entries
  const taken = new Set(listWithCopies(input.to.host, input.to.path).entries.map((e) => e.name))
  const key = `${input.to.host}|${input.to.path}`
  const items = input.items.map(({ name, onConflict }) => {
    const entry = source.find((e) => e.name === name && e.kind === 'file')
    if (!entry) return { name, size: 0, copied: 0, state: 'failed' as const }
    if (taken.has(name) && onConflict === 'skip') return { name, size: entry.size, copied: 0, state: 'skipped' as const }
    const target = taken.has(name) && onConflict === 'keep-both' ? freeName(name, taken) : name
    taken.add(target)
    state.copied[key] = [...(state.copied[key] ?? []).filter((e) => e.name !== target), { ...entry, name: target, modified: new Date().toISOString() }]
    return { name: target, size: entry.size, copied: 0, state: 'copying' as const }
  })
  const transfer = { id: `ft-${id()}`, from: input.from, to: input.to, items }
  state.transfers[transfer.id] = { transfer, startedAt: Date.now() }
  return transfer
}

function readDemoTransfer(transferId: string): FileTransfer | null {
  const record = state.transfers[transferId]
  if (!record) return null
  const now = record.cancelledAt ?? Date.now()
  return {
    ...record.transfer,
    items: record.transfer.items.map((item) => {
      if (item.state !== 'copying') return item
      const share = Math.min(1, (now - record.startedAt) / copyMs(item.size))
      if (share >= 1) return { ...item, copied: item.size, state: 'done' as const }
      return { ...item, copied: Math.round(item.size * share), state: record.cancelledAt ? ('cancelled' as const) : item.state }
    }),
  }
}

/** Returned by a route to answer with an error status, the way EdgePanel refuses a request. */
class Refused {
  readonly status: number
  readonly error: string
  constructor(status: number, error: string) {
    this.status = status
    this.error = error
  }
}

type Handler = (m: RegExpMatchArray, config: InternalAxiosRequestConfig) => unknown
type Route = [method: string, path: RegExp, handler: Handler]

const body = <T>(config: InternalAxiosRequestConfig): T =>
  typeof config.data === 'string' ? JSON.parse(config.data) : ((config.data ?? {}) as T)

const param = (config: InternalAxiosRequestConfig, key: string) => String(config.params?.[key] ?? '')
const id = () => Math.random().toString(36).slice(2, 10)

// Like EdgePanel: secrets are kept server side and never sent back; a webhook keeps its last four characters.
function stripSecrets<T extends Partial<ChannelInput>>({ botToken, webhookUrl, password, ...rest }: T): Partial<AlertChannel> {
  void botToken
  void password
  return webhookUrl ? { ...rest, webhookTail: webhookUrl.slice(-4) } : rest
}

const routes: Route[] = [
  [
    'post',
    /^\/log-in$/,
    (_m, c) => {
      const email = body<{ email: string }>(c).email
      return { id: 'demo-user', email, name: state.accounts.find((a) => a.email === email)?.name }
    },
  ],
  ['post', /^\/log-out$/, () => null],

  // ---- Fleet ----
  ['get', /^\/devices$/, () => seed.fleet()],

  // ---- Groups ----
  ['get', /^\/groups$/, () => state.groups],
  [
    'post',
    /^\/groups$/,
    (_m, c) => {
      const group = { id: `g-${id()}`, name: body<{ name: string }>(c).name }
      state.groups.push(group)
      return group
    },
  ],
  [
    'patch',
    /^\/groups\/([^/]+)$/,
    (m, c) => {
      const group = state.groups.find((g) => g.id === decodeURIComponent(m[1]))
      if (group) group.name = body<{ name: string }>(c).name
      return group ?? null
    },
  ],
  [
    'delete',
    /^\/groups\/([^/]+)$/,
    (m) => {
      const gone = decodeURIComponent(m[1])
      state.groups = state.groups.filter((g) => g.id !== gone)
      // The devices stay; they only leave the deleted group.
      seed.devices.forEach((d, i) => (seed.devices[i] = { ...d, groups: d.groups.filter((g) => g !== gone) }))
      return null
    },
  ],
  [
    'put',
    /^\/devices\/([^/]+)\/groups$/,
    (m, c) => {
      const i = seed.devices.findIndex((d) => d.host === decodeURIComponent(m[1]))
      if (i < 0) return null
      seed.devices[i] = { ...seed.devices[i], groups: body<{ groupIds: string[] }>(c).groupIds }
      return seed.devices[i]
    },
  ],
  ['get', /^\/devices\/([^/]+)$/, (m) => seed.devices.find((d) => d.host === decodeURIComponent(m[1])) ?? null],
  ['get', /^\/devices\/([^/]+)\/metrics$/, (m, c) => seed.deviceMetrics(decodeURIComponent(m[1]), (param(c, 'range') || '24h') as TimeRange)],
  ['get', /^\/devices\/([^/]+)\/processes$/, (m) => seed.processes(decodeURIComponent(m[1]))],
  ['get', /^\/sessions\/summary$/, () => seed.remoteSessions],

  // ---- Remote ----
  [
    'post',
    /^\/devices\/([^/]+)\/shell$/,
    (m, c) => {
      const { shell, command } = body<{ shell: Shell; command: string }>(c)
      const host = decodeURIComponent(m[1])
      const device = seed.devices.find((d) => d.host === host) ?? { host, groups: [] }
      const rule = blockedBy(state.commandRules, device, shell, command)
      if (rule) return new Refused(403, `Blocked: this command matches "${rule.pattern}". ${rule.reason}`.trim())
      return seed.runShell(host, shell, command)
    },
  ],
  [
    'get',
    /^\/devices\/([^/]+)\/files$/,
    (m, c) => {
      const host = decodeURIComponent(m[1])
      return listWithCopies(host, param(c, 'path') || seed.rootFor(host))
    },
  ],
  ['post', /^\/file-transfers$/, (_m, c) => startDemoTransfer(body<NewFileTransfer>(c))],
  ['get', /^\/file-transfers\/([^/]+)$/, (m) => readDemoTransfer(decodeURIComponent(m[1]))],
  [
    'delete',
    /^\/file-transfers\/([^/]+)$/,
    (m) => {
      const record = state.transfers[decodeURIComponent(m[1])]
      if (record && !record.cancelledAt) record.cancelledAt = Date.now()
      return readDemoTransfer(decodeURIComponent(m[1]))
    },
  ],
  ['get', /^\/devices\/([^/]+)\/services$/, (m) => seed.servicesOn(decodeURIComponent(m[1]))],
  ['post', /^\/devices\/([^/]+)\/desktop$/, (m) => seed.desktopSession(decodeURIComponent(m[1]))],

  // ---- Admin ----
  ['get', /^\/enrollments$/, () => state.pending],
  [
    'post',
    /^\/enrollments\/([^/]+)\/(approve|reject)$/,
    (m) => {
      state.pending = state.pending.filter((p) => p.host !== decodeURIComponent(m[1]))
      return { host: decodeURIComponent(m[1]), outcome: m[2] }
    },
  ],
  ['get', /^\/enrollment-tokens$/, () => state.tokens],
  [
    'post',
    /^\/enrollment-tokens$/,
    (_m, c) => {
      const input = body<{ group: string; lifetime: string; requiresApproval: boolean }>(c)
      const hours = { '1h': 1, '24h': 24, '7d': 168 }[input.lifetime] ?? 24
      // Shown in full exactly once, the way a real panel would hand it over.
      const token = {
        id: `tok-${state.tokens.length + 8}`,
        token: `bmx_${id()}${id()}`,
        group: input.group,
        expiresAt: fromNow(hours * 60 * MINUTE),
        requiresApproval: input.requiresApproval,
        usedBy: [],
      }
      state.tokens = [token, ...state.tokens]
      return token
    },
  ],
  [
    'delete',
    /^\/enrollment-tokens\/([^/]+)$/,
    (m) => {
      state.tokens = state.tokens.filter((t) => t.id !== decodeURIComponent(m[1]))
      return null
    },
  ],
  ['get', /^\/users$/, () => state.accounts],
  [
    'post',
    /^\/users$/,
    (_m, c) => {
      const input = body<{ email: string; role: string; access?: { groupIds: string[]; hosts: string[] } }>(c)
      const account = {
        id: `u-${state.accounts.length + 1}`,
        email: input.email,
        name: input.email.split('@')[0],
        role: input.role as (typeof state.accounts)[number]['role'],
        lastSignIn: '',
        disabled: false,
        access: input.access ?? { groupIds: [], hosts: [] },
      }
      state.accounts = [...state.accounts, account]
      return account
    },
  ],
  [
    'patch',
    /^\/users\/([^/]+)$/,
    (m, c) => {
      const account = state.accounts.find((a) => a.id === m[1])
      if (account) Object.assign(account, body<Partial<typeof account>>(c))
      return account ?? null
    },
  ],
  [
    'delete',
    /^\/users\/([^/]+)$/,
    (m) => {
      state.accounts = state.accounts.filter((a) => a.id !== decodeURIComponent(m[1]))
      return null
    },
  ],
  ['get', /^\/command-rules$/, () => state.commandRules],
  [
    'post',
    /^\/command-rules$/,
    (_m, c) => {
      const rule = { ...body<Omit<CommandRule, 'id'>>(c), id: `cr-${id()}` }
      state.commandRules = [...state.commandRules, rule]
      return rule
    },
  ],
  [
    'patch',
    /^\/command-rules\/([^/]+)$/,
    (m, c) => {
      const rule = state.commandRules.find((r) => r.id === decodeURIComponent(m[1]))
      if (rule) Object.assign(rule, body<Partial<CommandRule>>(c))
      return rule ?? null
    },
  ],
  [
    'delete',
    /^\/command-rules\/([^/]+)$/,
    (m) => {
      state.commandRules = state.commandRules.filter((r) => r.id !== decodeURIComponent(m[1]))
      return null
    },
  ],
  ['get', /^\/alert-rules$/, () => state.alertRules],
  [
    'post',
    /^\/alert-rules$/,
    (_m, c) => {
      const rule = { ...body<Omit<AlertRule, 'id'>>(c), id: `ar-${id()}` }
      state.alertRules = [...state.alertRules, rule]
      return rule
    },
  ],
  [
    'patch',
    /^\/alert-rules\/([^/]+)$/,
    (m, c) => {
      const rule = state.alertRules.find((r) => r.id === decodeURIComponent(m[1]))
      if (rule) Object.assign(rule, body<Partial<AlertRule>>(c))
      return rule ?? null
    },
  ],
  [
    'delete',
    /^\/alert-rules\/([^/]+)$/,
    (m) => {
      const gone = decodeURIComponent(m[1])
      state.alertRules = state.alertRules.filter((r) => r.id !== gone)
      state.alerts = state.alerts.map((a) => ({ ...a, ruleIds: a.ruleIds.filter((x) => x !== gone) }))
      return null
    },
  ],
  ['get', /^\/alerts$/, () => state.alerts],
  [
    'post',
    /^\/alerts$/,
    (_m, c) => {
      const alert = { ...body<Omit<Alert, 'id'>>(c), id: `al-${id()}` }
      state.alerts = [...state.alerts, alert]
      return alert
    },
  ],
  [
    'patch',
    /^\/alerts\/([^/]+)$/,
    (m, c) => {
      const alert = state.alerts.find((a) => a.id === decodeURIComponent(m[1]))
      if (alert) Object.assign(alert, body<Partial<Alert>>(c))
      return alert ?? null
    },
  ],
  [
    'delete',
    /^\/alerts\/([^/]+)$/,
    (m) => {
      state.alerts = state.alerts.filter((a) => a.id !== decodeURIComponent(m[1]))
      return null
    },
  ],
  ['get', /^\/alert-channels$/, () => state.alertChannels],
  [
    'post',
    /^\/alert-channels$/,
    (_m, c) => {
      const channel = { ...stripSecrets(body<ChannelInput>(c)), id: `ch-${id()}` } as AlertChannel
      state.alertChannels = [...state.alertChannels, channel]
      return channel
    },
  ],
  [
    'patch',
    /^\/alert-channels\/([^/]+)$/,
    (m, c) => {
      const channel = state.alertChannels.find((x) => x.id === decodeURIComponent(m[1]))
      if (channel) Object.assign(channel, stripSecrets(body<Partial<ChannelInput>>(c)))
      return channel ?? null
    },
  ],
  [
    'delete',
    /^\/alert-channels\/([^/]+)$/,
    (m) => {
      const gone = decodeURIComponent(m[1])
      state.alertChannels = state.alertChannels.filter((x) => x.id !== gone)
      // An alert keeps its other channels; it only stops sending to the deleted one.
      state.alerts = state.alerts.map((a) => ({ ...a, channelIds: a.channelIds.filter((x) => x !== gone) }))
      return null
    },
  ],
  [
    'post',
    /^\/alert-channels\/([^/]+)\/test$/,
    (m) => (state.alertChannels.some((x) => x.id === decodeURIComponent(m[1])) ? {} : null),
  ],
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Answers in EdgePanel's shape — { data } on success, { error } with a real status on failure — so every
// screen runs its normal loading, empty and error paths instead of a demo-only branch.
const adapter: AxiosAdapter = async (config) => {
  const path = (config.url ?? '').split('?')[0]
  const method = (config.method ?? 'get').toLowerCase()
  const envelope = (status: number, data: unknown) => ({
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  })

  await wait(140 + Math.random() * 160)

  for (const [verb, pattern, handler] of routes) {
    const match = path.match(pattern)
    if (verb !== method || !match) continue
    const out = handler(match, config)
    if (!(out instanceof Refused)) return envelope(200, { data: out })
    throw new AxiosError(out.error, AxiosError.ERR_BAD_REQUEST, config, null, envelope(out.status, { error: out.error }))
  }

  const response = envelope(404, { error: `No demo route for ${method.toUpperCase()} ${path}` })
  throw new AxiosError('Not Found', AxiosError.ERR_BAD_REQUEST, config, null, response)
}

export function install() {
  http.defaults.adapter = adapter
}
