import { describe, expect, it } from 'vitest'
import { createChannel, deleteAlertRule, deleteChannel, getAlerts, getChannels } from './alertService'
import { createToken, deleteUser, getTokens, getUsers, revokeToken } from './adminService'
import { install } from './demo'
import { createGroup, deleteGroup, getDeviceMetrics, getDevices, getDiskForecast, getGroups, getProcesses, setDeviceGroups } from './deviceService'
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

  it('forecasts filling disks, soonest full first', async () => {
    const forecast = await getDiskForecast()
    expect(forecast.length).toBeLessThanOrEqual(5)
    expect(forecast.every((f) => f.perDay > 0 && f.daysLeft > 0)).toBe(true)
    expect(forecast.map((f) => f.daysLeft)).toEqual(forecast.map((f) => f.daysLeft).toSorted((a, b) => a - b))
  })

  it('answers a known command and refuses an unknown one', async () => {
    const known = await runCommand('SRV-DB-01', 'Bash', 'hostname')
    expect(known).toMatchObject({ output: 'SRV-DB-01', exitCode: 0 })
    const unknown = await runCommand('SRV-DB-01', 'Bash', 'make coffee')
    expect(unknown.exitCode).toBe(1)
  })

  it('refuses a blocked command with 403 and the rule', async () => {
    await expect(runCommand('SRV-DB-01', 'Bash', 'rm -rf /')).rejects.toMatchObject({
      response: { status: 403, data: { error: expect.stringContaining('Deletes the whole file system') } },
    })
  })

  it('issues a token in full exactly once', async () => {
    const token = await createToken({ group: 'Accounting', lifetime: '24h', requiresApproval: true })
    expect(token.token).toMatch(/^bmx_[a-z0-9]+$/)
    expect(Date.parse(token.expiresAt)).toBeGreaterThan(Date.now())
  })

  it('revokes a token', async () => {
    const token = await createToken({ group: 'Server', lifetime: '1h', requiresApproval: false })
    await revokeToken(token.id)
    expect((await getTokens()).map((t) => t.id)).not.toContain(token.id)
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

  it('serves a usage history that ends at the device now', async () => {
    const device = (await getDevices()).find((d) => d.host === 'SRV-DB-01')!
    const points = await getDeviceMetrics('SRV-DB-01', '24h')
    expect(points).toHaveLength(96)
    expect(points.at(-1)).toMatchObject({ at: device.lastSeen, cpu: device.cpu, ram: device.ram, disk: device.disk })
    expect(points.every((p) => [p.cpu, p.ram, p.disk].every((v) => v >= 1 && v <= 100))).toBe(true)
    expect(points.every((p) => p.netIn > 0 && p.netOut > 0)).toBe(true)
    expect(await getDeviceMetrics('SRV-DB-01', '24h')).toEqual(points)
  })

  it('lists processes of an online device with unique PIDs', async () => {
    const device = (await getDevices()).find((d) => d.online)!
    const list = await getProcesses(device.host)
    expect(list.length).toBeGreaterThan(5)
    expect(new Set(list.map((p) => p.pid)).size).toBe(list.length)
    expect(list.every((p) => p.cpu >= 0 && p.memoryMb > 0)).toBe(true)
  })

  it('never sends a channel secret back, and a deleted channel or rule leaves its alerts', async () => {
    const channel = await createChannel({
      kind: 'discord',
      name: 'Ops',
      webhookUrl: 'https://discord.com/api/webhooks/123456/secret-AbCd',
    })
    expect(channel).toMatchObject({ webhookTail: 'AbCd' })
    expect(JSON.stringify(await getChannels())).not.toContain('secret')
    const [alert] = await getAlerts()
    await deleteChannel(alert.channelIds[0])
    await deleteAlertRule(alert.ruleIds[0])
    const [after] = await getAlerts()
    expect(after.channelIds).not.toContain(alert.channelIds[0])
    expect(after.ruleIds).not.toContain(alert.ruleIds[0])
  })

  it('turns an unknown route into a message for people', async () => {
    const { http } = await import('./http')
    await expect(http.get('/no-such-endpoint')).rejects.toThrow('That is no longer available.')
  })
})
