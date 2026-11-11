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
  /** Current usage in percent */
  cpu: number
  ram: number
  disk: number
  latencyMs: number
  hardware: DeviceHardware
}

export type IssueKind = 'cpu' | 'ram' | 'disk' | 'agent' | 'offline'

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

/** One sample of a device's usage: cpu, ram and disk in percent, network in Mbps. */
export interface MetricPoint {
  at: string
  cpu: number
  ram: number
  disk: number
  netIn: number
  netOut: number
}

export type ProcessStatus = 'running' | 'suspended' | 'not-responding'

export interface DeviceProcess {
  pid: number
  name: string
  user: string
  status: ProcessStatus
  /** Percent of the whole machine */
  cpu: number
  memoryMb: number
}

/** A disk that is filling up, as EdgePanel projects it from the last 7 days of usage. */
export interface DiskForecast {
  host: string
  /** Percent used now */
  disk: number
  /** Percentage points gained per day */
  perDay: number
  /** Days until 100 % at that rate */
  daysLeft: number
}

export interface PendingEnrollment {
  host: string
  os: string
  ip: string
}
