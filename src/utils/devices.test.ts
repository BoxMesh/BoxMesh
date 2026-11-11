import { describe, expect, it } from 'vitest'
import type { Device } from '../types/device'
import { filterDevices, issuesOf, reachable, summarize, triage } from './devices'
import { DAY, fromNow, MINUTE } from './time'

const NOW = Date.parse('2026-11-03T12:00:00Z')
const iso = (offsetMs: number) => fromNow(offsetMs, NOW)

const base: Device = {
  host: 'PC-001', alias: 'Front desk', os: 'Windows 11 Pro', osVersion: '24H2', osArchitecture: 'x64', osFamily: 'Windows',
  ip: '192.168.1.11', mac: 'AA:BB:CC:00:00:01', online: true, agentVersion: 'v1.4.2', agentOutdated: false,
  groups: ['g-office'], tag: 'floor 1', lastSeen: iso(-5_000), enrolledAt: iso(-DAY), certExpires: iso(90 * DAY),
  cpu: 10, ram: 10, disk: 10, latencyMs: 20,
  hardware: { cpu: '', ram: '', disk: '', uptime: '' },
}
const dev = (patch: Partial<Device>): Device => ({ ...base, ...patch })

describe('issuesOf', () => {
  it('flags metrics over thresholds', () => {
    expect(issuesOf(dev({ cpu: 96, disk: 85 })).map((i) => i.kind)).toEqual(['cpu', 'disk'])
  })
  it('reports only the lost heartbeat for offline devices', () => {
    expect(issuesOf(dev({ online: false, cpu: 99 })).map((i) => i.kind)).toEqual(['offline'])
  })
  it('flags a certificate by its expiry band and an outdated agent', () => {
    const issues = issuesOf(dev({ certExpires: iso(5 * DAY), agentOutdated: true }), NOW)
    expect(issues.map((i) => [i.kind, i.level])).toEqual([
      ['cert', 'error'],
      ['agent', 'warning'],
    ])
    expect(issuesOf(dev({ certExpires: iso(20 * DAY) }), NOW).map((i) => i.level)).toEqual(['warning'])
  })
})

describe('triage', () => {
  it('sorts critical, then warning, then offline, and leaves healthy devices out', () => {
    const rows = triage(
      [
        dev({ host: 'OFF', online: false }),
        dev({ host: 'OK' }),
        dev({ host: 'DISK', disk: 90 }),
        dev({ host: 'CPU', cpu: 95, disk: 90 }),
      ],
      NOW,
    )
    expect(rows.map((r) => [r.device.host, r.severity])).toEqual([
      ['CPU', 'critical'],
      ['DISK', 'warning'],
      ['OFF', 'offline'],
    ])
  })
})

describe('filterDevices', () => {
  const list = [dev({ host: 'PC-001' }), dev({ host: 'SRV-02', ip: '192.168.10.2', osFamily: 'Linux', online: false })]
  const none = { q: '', os: '', status: '', group: '' }
  it('matches search against host, ip and mac, case-insensitively', () => {
    expect(filterDevices(list, { ...none, q: ' srv ' }).map((d) => d.host)).toEqual(['SRV-02'])
    expect(filterDevices(list, { ...none, q: '192.168.10' }).map((d) => d.host)).toEqual(['SRV-02'])
  })
  it('combines os and status filters', () => {
    expect(filterDevices(list, { ...none, os: 'Linux', status: 'online' })).toEqual([])
    expect(filterDevices(list, { ...none, status: 'offline' }).map((d) => d.host)).toEqual(['SRV-02'])
  })
  it('filters by any one of the device groups', () => {
    const both = [dev({ host: 'A', groups: ['g-1', 'g-2'] }), dev({ host: 'B', groups: [] })]
    expect(filterDevices(both, { ...none, group: 'g-2' }).map((d) => d.host)).toEqual(['A'])
  })
})

describe('summarize', () => {
  it('counts devices, issues and expiring certificates', () => {
    const s = summarize(
      [
        dev({ cpu: 95, latencyMs: 30 }),
        dev({ latencyMs: 10, certExpires: iso(3 * DAY) }),
        dev({ online: false, lastSeen: iso(-20 * MINUTE) }),
      ],
      NOW,
    )
    expect(s).toMatchObject({ total: 3, online: 2, offline: 1, staleOffline: 1, avgLatency: 20 })
    expect(s.expiringCerts.map((d) => d.latencyMs)).toEqual([10])
  })
})

describe('reachable', () => {
  it('counts a device once whether it comes from a group, a single pick or both', () => {
    const list = [dev({ host: 'A', groups: ['g-1'] }), dev({ host: 'B', groups: ['g-2'] }), dev({ host: 'C', groups: [] })]
    expect(reachable({ groupIds: ['g-1'], hosts: ['A', 'C'] }, list).map((d) => d.host)).toEqual(['A', 'C'])
    expect(reachable({ groupIds: [], hosts: [] }, list)).toEqual([])
  })
})
