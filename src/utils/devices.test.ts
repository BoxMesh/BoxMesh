import { describe, expect, it } from 'vitest'
import type { Device } from '../types/device'
import { filterDevices, issuesOf, summarize, toCsv } from './devices'
import { DAY, fromNow, MINUTE } from './time'

const NOW = Date.parse('2026-11-03T12:00:00Z')
const iso = (offsetMs: number) => fromNow(offsetMs, NOW)

const base: Device = {
  host: 'PC-001', alias: 'Front desk', os: 'Windows 11 Pro', osFamily: 'Windows',
  ip: '10.0.0.1', mac: 'AA:BB:CC:00:00:01', online: true, agentVersion: 'v1.4.2', agentOutdated: false,
  group: 'Office', tag: 'floor 1', lastSeen: iso(-5_000), enrolledAt: iso(-DAY), certExpires: iso(30 * DAY),
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
})

describe('filterDevices', () => {
  const list = [dev({ host: 'PC-001' }), dev({ host: 'SRV-02', ip: '10.0.10.2', osFamily: 'Linux', online: false })]
  const none = { q: '', os: '', group: '', status: '' }
  it('matches search against host, ip and mac, case-insensitively', () => {
    expect(filterDevices(list, { ...none, q: ' srv ' }).map((d) => d.host)).toEqual(['SRV-02'])
    expect(filterDevices(list, { ...none, q: '10.0.10' }).map((d) => d.host)).toEqual(['SRV-02'])
  })
  it('combines os and status filters', () => {
    expect(filterDevices(list, { ...none, os: 'Linux', status: 'online' })).toEqual([])
    expect(filterDevices(list, { ...none, status: 'offline' }).map((d) => d.host)).toEqual(['SRV-02'])
  })
})

describe('summarize', () => {
  it('counts devices, alerts and expiring certificates', () => {
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
    expect(s.alerts.map((a) => a.kind)).toEqual(['cpu'])
    expect(s.attention).toHaveLength(2)
  })
})

describe('toCsv', () => {
  it('quotes cells and neutralises spreadsheet formulas', () => {
    const [header, row] = toCsv([dev({ alias: 'He said "hi"', tag: '=HYPERLINK("x")' })]).split('\r\n')
    expect(header.startsWith('host,alias')).toBe(true)
    expect(row).toContain('"He said ""hi"""')
    expect(row).toContain(`"'=HYPERLINK(""x"")"`)
  })
})
