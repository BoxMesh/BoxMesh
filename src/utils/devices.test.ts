import { describe, expect, it } from 'vitest'
import type { Device } from '../types/device'
import { filterDevices, groupHealth, issuesOf, membershipChanges, reachable, summarize, triage } from './devices'
import { DAY, fromNow, MINUTE } from './time'

const NOW = Date.parse('2026-11-03T12:00:00Z')
const iso = (offsetMs: number) => fromNow(offsetMs, NOW)

const base: Device = {
  host: 'PC-001', alias: 'Front desk', os: 'Windows 11 Pro', osVersion: '24H2', osArchitecture: 'x64', osFamily: 'Windows',
  ip: '192.168.1.11', mac: 'AA:BB:CC:00:00:01', online: true, agentVersion: 'v1.4.2', agentOutdated: false,
  groups: ['g-office'], tag: 'floor 1', lastSeen: iso(-5_000), enrolledAt: iso(-DAY),
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
  it('flags an outdated agent as a warning', () => {
    expect(issuesOf(dev({ agentOutdated: true })).map((i) => [i.kind, i.level])).toEqual([['agent', 'warning']])
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
    )
    expect(rows.map((r) => [r.device.host, r.severity])).toEqual([
      ['CPU', 'critical'],
      ['DISK', 'warning'],
      ['OFF', 'offline'],
    ])
  })
})

describe('groupHealth', () => {
  it('counts each group and puts groups in trouble first', () => {
    const groups = [{ id: 'g-a', name: 'A' }, { id: 'g-b', name: 'B' }, { id: 'g-c', name: 'C' }]
    const list = [
      dev({ host: 'A1', groups: ['g-a'] }),
      dev({ host: 'B1', groups: ['g-b', 'g-a'], cpu: 95 }),
      dev({ host: 'B2', groups: ['g-b'], online: false }),
    ]
    const rows = groupHealth(list, groups)
    expect(rows.map((g) => [g.group.id, g.total, g.online, g.healthy, g.critical, g.offline, g.worst?.device.host])).toEqual([
      ['g-a', 2, 2, 1, 1, 0, 'B1'],
      ['g-b', 2, 1, 0, 1, 1, 'B1'],
      ['g-c', 0, 0, 0, 0, 0, undefined],
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
  it('counts devices, offline time and latency', () => {
    const s = summarize(
      [
        dev({ cpu: 95, latencyMs: 30 }),
        dev({ latencyMs: 10 }),
        dev({ online: false, lastSeen: iso(-20 * MINUTE) }),
      ],
      NOW,
    )
    expect(s).toMatchObject({ total: 3, online: 2, offline: 1, staleOffline: 1, avgLatency: 20 })
  })
})

describe('membershipChanges', () => {
  it('touches only the devices that join or leave, and keeps their other groups', () => {
    const list = [dev({ host: 'A', groups: ['g-1', 'g-2'] }), dev({ host: 'B', groups: ['g-2'] }), dev({ host: 'C', groups: ['g-1'] })]
    expect(membershipChanges(list, 'g-1', ['A', 'B'])).toEqual([
      { host: 'B', groupIds: ['g-2', 'g-1'] },
      { host: 'C', groupIds: [] },
    ])
    expect(membershipChanges(list, 'g-1', ['A', 'C'])).toEqual([])
  })
})

describe('reachable', () => {
  it('counts a device once whether it comes from a group, a single pick or both', () => {
    const list = [dev({ host: 'A', groups: ['g-1'] }), dev({ host: 'B', groups: ['g-2'] }), dev({ host: 'C', groups: [] })]
    expect(reachable({ groupIds: ['g-1'], hosts: ['A', 'C'] }, list).map((d) => d.host)).toEqual(['A', 'C'])
    expect(reachable({ groupIds: [], hosts: [] }, list)).toEqual([])
  })
})
