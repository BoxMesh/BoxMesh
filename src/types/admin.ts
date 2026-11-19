
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

<<<<<<< HEAD
export type CommandMatch = 'starts' | 'contains' | 'regex'

/** A command nobody may run in Remote Terminal. BoxServer checks every command against these before relaying it. */
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
  /** Device IDs. */
  deviceIds: string[]
}
=======
>>>>>>> e9f4e9f338c312f48d3e67318d3d9691c7e6cf25
