import type { Role } from './admin'

export interface User {
  email: string
  name: string
  role: Role
}
