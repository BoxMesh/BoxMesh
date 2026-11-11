import type { Shell } from './remote'

export interface Certificate {
  host: string
  serial: string
  issuedAt: string
  expiresAt: string
  revoked: boolean
}

export interface EnrollmentToken {
  id: string
  /** Shown once on creation; later only the last characters are kept. */
  token: string
  group: string
  expiresAt: string
  requiresApproval: boolean
  usedBy: string[]
}

export type Role = 'Admin' | 'Operator'

/**
 * The devices an Operator may act on: every device in these groups (including ones added to a group later), plus
 * these single devices. An Admin reaches every device, so an Admin's access is ignored.
 */
export interface DeviceAccess {
  groupIds: string[]
  hosts: string[]
}

export interface Account {
  id: string
  email: string
  name: string
  role: Role
  lastSignIn: string
  disabled: boolean
  access: DeviceAccess
}

export type CommandMatch = 'starts' | 'contains' | 'regex'

/** A command nobody may run in Remote Terminal. EdgePanel checks every command against these before relaying it. */
export interface CommandRule {
  id: string
  pattern: string
  /** starts: the command begins with the pattern as whole words; contains: anywhere; regex: a case-insensitive regex. */
  match: CommandMatch
  /** Empty means every shell. */
  shells: Shell[]
  /** Shown to the person whose command is refused. */
  reason: string
  /** Where it applies: these groups, or these single devices. Both empty means every device. */
  groupIds: string[]
  hosts: string[]
}

export interface Settings {
  heartbeatSeconds: number
  offlineAfterMinutes: number
  logRetentionDays: number
  metricRetentionDays: number
  autoApproveEnrollment: boolean
}

export interface Health {
  version: string
  uptime: string
  dbSizeMb: number
  agentsConnected: number
  /** ISO 8601 */
  lastBackup: string
}
