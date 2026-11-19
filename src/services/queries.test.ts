import { AxiosError, type AxiosAdapter } from 'axios'
import { describe, expect, it } from 'vitest'
import { http } from './http'
import { groupsQuery } from './queries'

// Stands in for BoxServer: replies with this status and body, through the real axios instance and its interceptor.
const reply =
  (status: number, body: unknown): AxiosAdapter =>
  async (config) => {
    const response = { data: body, status, statusText: String(status), headers: {}, config }
    if (status >= 400) throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response)
    return response
  }

// queryFn is always set on these options; the cast only drops the context argument the queries ignore.
const load = () => (groupsQuery.queryFn as () => Promise<unknown>)()

describe('queries', () => {
  it('passes data through', async () => {
    http.defaults.adapter = reply(200, { data: [{ id: 'g1', name: 'Servers' }] })
    expect(await load()).toEqual([{ id: 'g1', name: 'Servers' }])
  })

  it('shows a list BoxServer does not serve yet as empty', async () => {
    http.defaults.adapter = reply(404, { error: 'Not Found' })
    expect(await load()).toEqual([])
  })

  it.each([500, 401, 403])('still fails on a %i', async (status) => {
    http.defaults.adapter = reply(status, { error: 'nope' })
    await expect(load()).rejects.toThrow()
  })
})
