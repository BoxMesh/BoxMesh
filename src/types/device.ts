export type OsFamily = 'Windows' | 'Linux' | 'macOS'

export interface DeviceHardware {
  cpu: string
  ram: string
  disk: string
  uptime: string
}

export interface Device {
  host: string
  alias: string
  /** Product name only, e.g. Ubuntu or Windows 11 Pro. */
  os: string
  /** Release, e.g. 24.04 LTS or 24H2. */
  osVersion: string
  osArchitecture: string
  osFamily: OsFamily
  ip: string
  mac: string
  online: boolean
  agentVersion: string
  /** Server compares agentVersion with the latest agent release. */
  agentOutdated: boolean
  /** Ids of the groups this device belongs to; a device can be in several, or none. */
  groups: string[]
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

export type IssueKind = 'cpu' | 'ram' | 'disk' | 'cert' | 'agent' | 'offline'

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
  /** A group id. */
  group: string
}

/** A named set of devices, managed on the Devices page. */
export interface DeviceGroup {
  id: string
  name: string
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
