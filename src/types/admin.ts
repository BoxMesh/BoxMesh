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
