import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import type { Settings } from '../types/admin'
import type { TimeRange } from '../types/dashboard'
import type { JobState } from '../types/ops'
import type { Shell } from '../types/remote'
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
  jobs: structuredClone(seed.jobs),
  certificates: structuredClone(seed.certificates),
  tokens: structuredClone(seed.enrollmentTokens),
  accounts: structuredClone(seed.accounts),
  settings: structuredClone(seed.settings),
  pending: structuredClone(seed.pendingEnrollments),
}

type Handler = (m: RegExpMatchArray, config: InternalAxiosRequestConfig) => unknown
type Route = [method: string, path: RegExp, handler: Handler]

const body = <T>(config: InternalAxiosRequestConfig): T =>
  typeof config.data === 'string' ? JSON.parse(config.data) : ((config.data ?? {}) as T)

const param = (config: InternalAxiosRequestConfig, key: string) => String(config.params?.[key] ?? '')
const id = () => Math.random().toString(36).slice(2, 10)

const routes: Route[] = [
  ['post', /^\/log-in$/, (_m, c) => ({ id: 'demo-user', email: body<{ email: string }>(c).email })],
  ['post', /^\/log-out$/, () => null],

  // ---- Fleet ----
  ['get', /^\/devices$/, () => seed.fleet()],
  ['get', /^\/devices\/([^/]+)$/, (m) => seed.devices.find((d) => d.host === decodeURIComponent(m[1])) ?? null],
  ['get', /^\/devices\/([^/]+)\/connections$/, (m) => seed.connectionHistory(decodeURIComponent(m[1]))],
  ['get', /^\/metrics\/summary$/, (_m, c) => seed.resourceUsage((param(c, 'range') || '24h') as TimeRange)],
  ['get', /^\/sessions\/summary$/, () => seed.remoteSessions],
  ['get', /^\/audit$/, (_m, c) => seed.activity.slice(0, Number(param(c, 'limit')) || 4)],

  // ---- Remote ----
  [
    'post',
    /^\/devices\/([^/]+)\/shell$/,
    (m, c) => {
      const { shell, command } = body<{ shell: Shell; command: string }>(c)
      return seed.runShell(decodeURIComponent(m[1]), shell, command)
    },
  ],
  [
    'get',
    /^\/devices\/([^/]+)\/files$/,
    (m, c) => {
      const host = decodeURIComponent(m[1])
      return seed.listFiles(host, param(c, 'path') || seed.rootFor(host))
    },
  ],
  ['get', /^\/devices\/([^/]+)\/services$/, (m) => seed.servicesOn(decodeURIComponent(m[1]))],
  ['post', /^\/devices\/([^/]+)\/desktop$/, (m) => seed.desktopSession(decodeURIComponent(m[1]))],

  // ---- Operations ----
  ['get', /^\/jobs$/, () => state.jobs],
  [
    'post',
    /^\/jobs$/,
    (_m, c) => {
      const input = body<{ name: string; command: string; shell: string; targets: string[]; schedule?: string }>(c)
      const job = {
        ...input,
        id: `job-${1042 + state.jobs.length}`,
        state: (input.schedule ? 'queued' : 'running') as JobState,
        startedAt: new Date().toISOString(),
        results: input.schedule
          ? []
          : seed.devices
              .filter((d) => input.targets.includes(d.group) || input.targets.includes(d.host))
              .map((d) => ({
                host: d.host,
                state: (d.online ? 'done' : 'failed') as 'done' | 'failed',
                exitCode: d.online ? 0 : 1,
                output: d.online ? 'Completed' : 'Agent offline',
              })),
      }
      state.jobs = [job, ...state.jobs]
      return job
    },
  ],
  ['get', /^\/audit\/entries$/, () => seed.auditLog],

  // ---- Admin ----
  ['get', /^\/certificates$/, () => state.certificates],
  [
    'post',
    /^\/certificates\/([^/]+)\/revoke$/,
    (m) => {
      const cert = state.certificates.find((x) => x.host === decodeURIComponent(m[1]))
      if (cert) cert.revoked = true
      return cert ?? null
    },
  ],
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
  ['get', /^\/users$/, () => state.accounts],
  [
    'post',
    /^\/users$/,
    (_m, c) => {
      const input = body<{ email: string; role: string; scope?: string[] }>(c)
      const account = {
        id: `u-${state.accounts.length + 1}`,
        email: input.email,
        name: input.email.split('@')[0],
        role: input.role as (typeof state.accounts)[number]['role'],
        scope: input.scope ?? [],
        lastSignIn: '',
        disabled: false,
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
  ['get', /^\/settings$/, () => state.settings],
  [
    'put',
    /^\/settings$/,
    (_m, c) => {
      state.settings = { ...state.settings, ...body<Partial<Settings>>(c) }
      return state.settings
    },
  ],
  ['get', /^\/health$/, () => ({ ...seed.health, agentsConnected: seed.devices.filter((d) => d.online).length })],
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
    if (verb === method && match) return envelope(200, { data: handler(match, config) })
  }

  const response = envelope(404, { error: `No demo route for ${method.toUpperCase()} ${path}` })
  throw new AxiosError('Not Found', AxiosError.ERR_BAD_REQUEST, config, null, response)
}

export function install() {
  http.defaults.adapter = adapter
}
