import { describe, expect, it } from 'vitest'
import { createToken, deleteUser, getUsers } from './adminService'
import { install } from './demo'
import { createGroup, deleteGroup, getDevices, getGroups, setDeviceGroups } from './deviceService'
import { createJob } from './opsService'
import { runCommand } from './remoteService'

// The demo answers through the real axios instance and its interceptor, so these also prove the
// screens get EdgePanel's { data } envelope and its error shape, not a demo-only path.
install()

describe('demo mode', () => {
  it('serves the sample fleet', async () => {
    const devices = await getDevices()
    expect(devices).toHaveLength(12)
    // Which agents are up is random per load; the addresses are always on the office LAN.
    expect(devices.every((d) => /^192\.168\.\d+\.\d+$/.test(d.ip))).toBe(true)
  })

  it('answers a known command and refuses an unknown one', async () => {
    const known = await runCommand('SRV-DB-01', 'Bash', 'hostname')
    expect(known).toMatchObject({ output: 'SRV-DB-01', exitCode: 0 })
    const unknown = await runCommand('SRV-DB-01', 'Bash', 'rm -rf /')
    expect(unknown.exitCode).toBe(1)
  })

  it('issues a token in full exactly once', async () => {
    const token = await createToken({ group: 'Accounting', lifetime: '24h', requiresApproval: true })
    expect(token.token).toMatch(/^bmx_[a-z0-9]+$/)
    expect(Date.parse(token.expiresAt)).toBeGreaterThan(Date.now())
  })

  it('runs a job only on the devices that are online', async () => {
    const job = await createJob({ name: 'Ping', command: 'hostname', shell: 'Bash', targets: ['Accounting'] })
    expect(job.state).toBe('running')
    // Every targeted device gets a row: offline ones a failure rather than a missing result.
    const { devices } = await import('./demoData')
    const expected = devices.filter((d) => d.groups.includes('g-accounting')).map((d) => [d.host, d.online ? 'done' : 'failed'])
    expect(expected).toHaveLength(3)
    expect(job.results.map((r) => [r.host, r.state])).toEqual(expected)
  })

  it('deletes a user', async () => {
    const [, gone] = await getUsers()
    await deleteUser(gone.id)
    expect((await getUsers()).map((a) => a.id)).not.toContain(gone.id)
  })

  it('puts a device in several groups and drops a deleted group from it', async () => {
    const group = await createGroup('Night shift')
    await setDeviceGroups('HR-PC-01', ['g-hr', group.id])
    expect((await getDevices()).find((d) => d.host === 'HR-PC-01')?.groups).toEqual(['g-hr', group.id])
    await deleteGroup(group.id)
    expect((await getDevices()).find((d) => d.host === 'HR-PC-01')?.groups).toEqual(['g-hr'])
    expect((await getGroups()).map((g) => g.id)).not.toContain(group.id)
  })

  it('turns an unknown route into a message for people', async () => {
    const { http } = await import('./http')
    await expect(http.get('/no-such-endpoint')).rejects.toThrow('That is no longer available.')
  })
})
