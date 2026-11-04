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

export type Role = 'Admin' | 'Operator' | 'Viewer'

export interface Account {
  id: string
  email: string
  name: string
  role: Role
  /** Group names the account may reach; empty means every group. */
  scope: string[]
  lastSignIn: string
  disabled: boolean
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
