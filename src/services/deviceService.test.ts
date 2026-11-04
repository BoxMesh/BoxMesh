import { AxiosError, type AxiosAdapter } from 'axios'
import { describe, expect, it } from 'vitest'
import { getDevice, getDevices } from './deviceService'
import { http } from './http'

// Stands in for EdgePanel: replies with this status and body, through the real axios instance and its interceptor.
const reply =
  (status: number, body: unknown): AxiosAdapter =>
  async (config) => {
    const response = { data: body, status, statusText: String(status), headers: {}, config }
    if (status >= 400) throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response)
    return response
  }

describe('deviceService', () => {
  it('unwraps the EdgePanel { data } envelope', async () => {
    http.defaults.adapter = reply(200, { data: [{ host: 'PC-001' }] })
    expect(await getDevices()).toEqual([{ host: 'PC-001' }])
  })

  it('returns null for an unknown device', async () => {
    http.defaults.adapter = reply(404, { error: 'Not Found' })
    expect(await getDevice('NO-SUCH-HOST')).toBeNull()
  })

  // Nothing a developer wrote — not axios's "Request failed with status code 502", not EdgePanel's
  // { error } body — may reach the screen.
  it.each([
    [502, 'Try again in a moment.'],
    [403, "You don't have permission to do this."],
    [429, 'Too many requests at once. Wait a moment, then try again.'],
    [400, 'The request could not be completed.'],
  ])('explains a %i to the operator', async (status, expected) => {
    http.defaults.adapter = reply(status, { error: 'Internal Server Error' })
    await expect(getDevices()).rejects.toThrow(expected)
  })

  it('explains an unreachable EdgePanel', async () => {
    http.defaults.adapter = async (config) => {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)
    }
    await expect(getDevices()).rejects.toThrow("Can't reach the server. Check your connection, then try again.")
  })

  it('never leaks the transport message', async () => {
    http.defaults.adapter = reply(502, { error: 'Bad Gateway' })
    await expect(getDevices()).rejects.not.toThrow(/status code|Bad Gateway/)
  })
})
