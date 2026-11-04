import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { TimeRange } from '../types/dashboard'
import { activity, remoteSessions, resourceHistory } from './dashboard'
import { connectionHistory, devices, pendingEnrollments } from './devices'

type Reply = [status: number, body: unknown]
type Route = [method: string, path: RegExp, handle: (params: string[], config: InternalAxiosRequestConfig) => Reply]

// Bodies use EdgePanel's envelope: { data } on success, { error } on failure.
const ok = (data: unknown): Reply => [200, { data }]
const notFound = (error: string): Reply => [404, { error }]

const routes: Route[] = [
  ['get', /^\/devices$/, () => ok(devices)],
  ['get', /^\/devices\/([^/]+)$/, ([host]) => {
    const device = devices.find((d) => d.host === decodeURIComponent(host))
    return device ? ok(device) : notFound('Device not found')
  }],
  ['get', /^\/devices\/([^/]+)\/connections$/, () => ok(connectionHistory)],
  ['get', /^\/enrollments$/, () => ok(pendingEnrollments)],
  ['get', /^\/metrics\/summary$/, (_, config) => ok(resourceHistory[config.params?.range as TimeRange] ?? resourceHistory['24h'])],
  ['get', /^\/sessions\/summary$/, () => ok(remoteSessions)],
  ['get', /^\/audit$/, (_, config) => ok(activity.slice(0, config.params?.limit ?? activity.length))],
  // Any non-empty email and password signs in.
  ['post', /^\/auth\/login$/, (_, config) => {
    const { email, password } = JSON.parse(config.data ?? '{}')
    return email && password ? ok({ email, name: email.split('@')[0] }) : [401, { error: 'Enter your email and password.' }]
  }],
]

const LATENCY_MS = 300 // so loading states show up while developing

export const mockAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
  const method = (config.method ?? 'get').toLowerCase()
  const url = config.url ?? ''

  let reply: Reply = notFound(`No mock for ${method.toUpperCase()} ${url}`)
  for (const [m, path, handle] of routes) {
    const match = m === method ? path.exec(url) : null
    if (match) {
      reply = handle(match.slice(1), config)
      break
    }
  }

  const [status, data] = reply
  const response: AxiosResponse = { data, status, statusText: String(status), headers: {}, config }
  if (status >= 400) {
    throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response)
  }
  return response
}
