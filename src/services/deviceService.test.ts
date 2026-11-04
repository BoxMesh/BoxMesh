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

  it('turns the { error } body into the error message', async () => {
    http.defaults.adapter = reply(500, { error: 'Internal Server Error' })
    await expect(getDevices()).rejects.toThrow('Internal Server Error')
  })
})
