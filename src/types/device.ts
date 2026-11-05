export type OsFamily = 'Windows' | 'Linux'

export interface DeviceHardware {
  cpu: string
  ram: string
  disk: string
  uptime: string
}

export interface Device {
  host: string
  alias: string
  os: string
  osFamily: OsFamily
  ip: string
  mac: string
  online: boolean
  agentVersion: string
  /** Server compares agentVersion with the latest agent release. */
  agentOutdated: boolean
  group: string
  tag: string
  /** ISO 8601 timestamps */
  lastSeen: string
  enrolledAt: string
  certExpires: string
  /** Current usage in percent */
  cpu: number
  ram: number
  disk: number
  latencyMs: number
  hardware: DeviceHardware
}

export type IssueKind = 'cpu' | 'ram' | 'disk' | 'offline'

export interface Issue {
  kind: IssueKind
  label: string
  value: string
  level: 'error' | 'warning' | 'default'
}

/** Empty string means "All". */
export interface DeviceFilter {
  q: string
  os: string
  status: string
}

export interface ConnectionEvent {
  event: string
  at: string
  publicIp: string
  duration: string
}

export interface PendingEnrollment {
  host: string
  os: string
  ip: string
}
