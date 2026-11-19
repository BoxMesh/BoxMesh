
export interface EnrollmentToken {
  id: string
  /** Shown once on creation; later only the last characters are kept. */
  token: string
  expiresAt: string
  /** How many devices may enroll with it; null is no limit. */
  maxDevices: number | null
}

export type Role = 'System' | 'User'

/**
 * The devices an Operator may act on: every device in these groups (including ones added to a group later), plus
 * these single devices. A System account reaches every device, so a System account's access is ignored.
 */
export interface DeviceAccess {
  groupIds: string[]
  /** Device IDs. */
  deviceIds: string[]
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

