import { describe, expect, it } from 'vitest'
import { getDevice, getDevices } from './deviceService'
import { http } from './http'

// Runs through the real axios instance, answered by the mock adapter (VITE_USE_MOCK is unset in tests).
describe('deviceService', () => {
  it('unwraps the EdgePanel { data } envelope', async () => {
    const devices = await getDevices()
    expect(devices.length).toBeGreaterThan(0)
    expect(devices[0]).toHaveProperty('host')
  })

  it('returns null for an unknown device', async () => {
    expect(await getDevice('NO-SUCH-HOST')).toBeNull()
  })

  it('turns the { error } body into the error message', async () => {
    await expect(http.get('/nope')).rejects.toThrow('No mock for GET /nope')
  })
})
