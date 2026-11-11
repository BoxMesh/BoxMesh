import type { DeviceAccess } from '../types/admin'
import type { Device, DeviceFilter, DeviceGroup, Issue, OsFamily } from '../types/device'
import { MINUTE } from './time'
import { t } from '../i18n'

// Default per-device alert thresholds (percent), as drawn on the device detail screen.
export const THRESHOLDS = { cpu: 90, ram: 90, disk: 85 }

export function issuesOf(d: Device): Issue[] {
  // Metrics of an offline agent are stale, so only the lost heartbeat counts.
  if (!d.online) return [{ kind: 'offline', label: t('Heartbeat lost'), value: '—', level: 'default' }]
  const issues: Issue[] = []
  if (d.cpu >= THRESHOLDS.cpu) issues.push({ kind: 'cpu', label: t('High CPU'), value: `${d.cpu}%`, level: 'error' })
  if (d.ram >= THRESHOLDS.ram) issues.push({ kind: 'ram', label: t('High RAM'), value: `${d.ram}%`, level: 'error' })
  if (d.disk >= THRESHOLDS.disk) issues.push({ kind: 'disk', label: t('Disk almost full'), value: `${d.disk}%`, level: 'warning' })
  if (d.agentOutdated) issues.push({ kind: 'agent', label: t('Outdated agent'), value: d.agentVersion, level: 'warning' })
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
export function triage(list: Device[]): TriageRow[] {
  return list
    .flatMap((device) => {
      const issues = issuesOf(device)
      if (!issues.length) return []
      const severity: Severity = !device.online ? 'offline' : issues.some((i) => i.level === 'error') ? 'critical' : 'warning'
      return [{ device, severity, issues }]
    })
    .toSorted((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

export interface GroupHealth {
  group: DeviceGroup
  total: number
  online: number
  healthy: number
  warning: number
  critical: number
  offline: number
  /** The member that needs attention most, if any. */
  worst?: TriageRow
}

const rankOf = (g: GroupHealth) => (g.critical ? 0 : g.warning ? 1 : g.offline ? 2 : 3)

/** Each group's devices counted the way the dashboard counts the fleet, groups in trouble first. */
export function groupHealth(list: Device[], groups: DeviceGroup[]): GroupHealth[] {
  const rows = triage(list)
  return groups
    .map((group) => {
      const members = list.filter((d) => d.groups.includes(group.id))
      const mine = rows.filter((r) => r.device.groups.includes(group.id))
      const count = (s: Severity) => mine.filter((r) => r.severity === s).length
      const online = members.filter((d) => d.online).length
      const [critical, warning] = [count('critical'), count('warning')]
      return { group, total: members.length, online, healthy: online - critical - warning, warning, critical, offline: count('offline'), worst: mine[0] }
    })
    .toSorted((a, b) => rankOf(a) - rankOf(b) || a.group.name.localeCompare(b.group.name))
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
    avgLatency: online.length ? Math.round(online.reduce((sum, d) => sum + d.latencyMs, 0) / online.length) : 0,
  }
}

/** The devices an Operator's access reaches: those in any of its groups, plus its single devices. */
export function reachable(access: DeviceAccess, list: Device[]): Device[] {
  return list.filter((d) => access.hosts.includes(d.host) || d.groups.some((g) => access.groupIds.includes(g)))
}

export type Scope = 'all' | 'groups' | 'hosts'

export const scopeOf = (r: { groupIds: string[]; hosts: string[] }): Scope =>
  r.groupIds.length ? 'groups' : r.hosts.length ? 'hosts' : 'all'

/** The devices whose groups change when a group's members become exactly `hosts`, each with its new group list. */
export function membershipChanges(list: Device[], groupId: string, hosts: string[]) {
  return list.flatMap((d) => {
    const has = d.groups.includes(groupId)
    const wants = hosts.includes(d.host)
    if (has === wants) return []
    return [{ host: d.host, groupIds: wants ? [...d.groups, groupId] : d.groups.filter((g) => g !== groupId) }]
  })
}
