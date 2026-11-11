import type { Device, DeviceFilter, Issue, OsFamily } from '../types/device'
import { daysLeft, MINUTE } from './time'

// Certificate expiry bands, the same on every screen: red within a week, amber within a month.
export const CERT_SOON_DAYS = 30
export function certTone(days: number): 'error' | 'warning' | undefined {
  return days <= 7 ? 'error' : days <= CERT_SOON_DAYS ? 'warning' : undefined
}

// Default per-device alert thresholds (percent), as drawn on the device detail screen.
export const THRESHOLDS = { cpu: 90, ram: 90, disk: 85 }

export function issuesOf(d: Device): Issue[] {
  // Metrics of an offline agent are stale, so only the lost heartbeat counts.
  if (!d.online) return [{ kind: 'offline', label: 'Heartbeat lost', value: '—', level: 'default' }]
  const issues: Issue[] = []
  if (d.cpu >= THRESHOLDS.cpu) issues.push({ kind: 'cpu', label: 'High CPU', value: `${d.cpu}%`, level: 'error' })
  if (d.ram >= THRESHOLDS.ram) issues.push({ kind: 'ram', label: 'High RAM', value: `${d.ram}%`, level: 'error' })
  if (d.disk >= THRESHOLDS.disk) issues.push({ kind: 'disk', label: 'Disk almost full', value: `${d.disk}%`, level: 'warning' })
  return issues
}

export function filterDevices(list: Device[], f: DeviceFilter): Device[] {
  const q = f.q.trim().toLowerCase()
  return list.filter(
    (d) =>
      (!q || [d.host, d.alias, d.ip, d.mac].some((v) => v.toLowerCase().includes(q))) &&
      (!f.os || d.osFamily === f.os) &&
      (!f.status || (f.status === 'online') === d.online),
  )
}

export function summarize(list: Device[], now = Date.now()) {
  const online = list.filter((d) => d.online)
  const attention = list.flatMap((d) => issuesOf(d).map((issue) => ({ ...issue, device: d })))
  return {
    total: list.length,
    byFamily: list.reduce<Partial<Record<OsFamily, number>>>((acc, d) => {
      acc[d.osFamily] = (acc[d.osFamily] ?? 0) + 1
      return acc
    }, {}),
    online: online.length,
    offline: list.length - online.length,
    staleOffline: list.filter((d) => !d.online && now - Date.parse(d.lastSeen) > 10 * MINUTE).length,
    attention,
    expiringCerts: list
      .filter((d) => daysLeft(d.certExpires, now) <= CERT_SOON_DAYS)
      .toSorted((a, b) => Date.parse(a.certExpires) - Date.parse(b.certExpires)),
    avgLatency: online.length ? Math.round(online.reduce((sum, d) => sum + d.latencyMs, 0) / online.length) : 0,
  }
}
