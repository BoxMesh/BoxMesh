import type { DeviceAccess } from '../types/admin'
import type { Device, DeviceFilter, Issue, OsFamily } from '../types/device'
import { daysLeft, daysLeftLabel, MINUTE } from './time'

// Certificate expiry bands, the same on every screen: red within a week, amber within a month.
export const CERT_SOON_DAYS = 30
export function certTone(days: number): 'error' | 'warning' | undefined {
  return days <= 7 ? 'error' : days <= CERT_SOON_DAYS ? 'warning' : undefined
}

// Default per-device alert thresholds (percent), as drawn on the device detail screen.
export const THRESHOLDS = { cpu: 90, ram: 90, disk: 85 }

export function issuesOf(d: Device, now = Date.now()): Issue[] {
  // Metrics of an offline agent are stale, so only the lost heartbeat counts.
  if (!d.online) return [{ kind: 'offline', label: 'Heartbeat lost', value: '—', level: 'default' }]
  const issues: Issue[] = []
  if (d.cpu >= THRESHOLDS.cpu) issues.push({ kind: 'cpu', label: 'High CPU', value: `${d.cpu}%`, level: 'error' })
  if (d.ram >= THRESHOLDS.ram) issues.push({ kind: 'ram', label: 'High RAM', value: `${d.ram}%`, level: 'error' })
  if (d.disk >= THRESHOLDS.disk) issues.push({ kind: 'disk', label: 'Disk almost full', value: `${d.disk}%`, level: 'warning' })
  const days = daysLeft(d.certExpires, now)
  const cert = certTone(days)
  if (cert) issues.push({ kind: 'cert', label: 'Certificate expires', value: daysLeftLabel(days), level: cert })
  if (d.agentOutdated) issues.push({ kind: 'agent', label: 'Outdated agent', value: d.agentVersion, level: 'warning' })
  return issues
}

export type Severity = 'critical' | 'warning' | 'offline'

export interface TriageRow {
  device: Device
  severity: Severity
  issues: Issue[]
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, offline: 2 }

/** Devices with something wrong, worst first: any red issue is critical, the rest warnings, then the offline ones. */
export function triage(list: Device[], now = Date.now()): TriageRow[] {
  return list
    .flatMap((device) => {
      const issues = issuesOf(device, now)
      if (!issues.length) return []
      const severity: Severity = !device.online ? 'offline' : issues.some((i) => i.level === 'error') ? 'critical' : 'warning'
      return [{ device, severity, issues }]
    })
    .toSorted((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

export function filterDevices(list: Device[], f: DeviceFilter): Device[] {
  const q = f.q.trim().toLowerCase()
  return list.filter(
    (d) =>
      (!q || [d.host, d.alias, d.ip, d.mac].some((v) => v.toLowerCase().includes(q))) &&
      (!f.os || d.osFamily === f.os) &&
      (!f.status || (f.status === 'online') === d.online) &&
      (!f.group || d.groups.includes(f.group)),
  )
}

export function summarize(list: Device[], now = Date.now()) {
  const online = list.filter((d) => d.online)
  return {
    total: list.length,
    byFamily: list.reduce<Partial<Record<OsFamily, number>>>((acc, d) => {
      acc[d.osFamily] = (acc[d.osFamily] ?? 0) + 1
      return acc
    }, {}),
    online: online.length,
    offline: list.length - online.length,
    staleOffline: list.filter((d) => !d.online && now - Date.parse(d.lastSeen) > 10 * MINUTE).length,
    expiringCerts: list
      .filter((d) => daysLeft(d.certExpires, now) <= CERT_SOON_DAYS)
      .toSorted((a, b) => Date.parse(a.certExpires) - Date.parse(b.certExpires)),
    avgLatency: online.length ? Math.round(online.reduce((sum, d) => sum + d.latencyMs, 0) / online.length) : 0,
  }
}

/** The devices an Operator's access reaches: those in any of its groups, plus its single devices. */
export function reachable(access: DeviceAccess, list: Device[]): Device[] {
  return list.filter((d) => access.hosts.includes(d.host) || d.groups.some((g) => access.groupIds.includes(g)))
}
