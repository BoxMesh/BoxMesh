import type { Account, EnrollmentToken, Role } from '../types/admin'
import { http } from './http'

export async function getTokens() {
  const { data } = await http.get<EnrollmentToken[]>('/enrollment-tokens')
  return data
}

export interface NewToken {
  lifetime: string
  maxDevices: number | null
}

/** The reply carries the only full copy of the token; afterwards the panel keeps just its tail. */
export async function createToken(input: NewToken) {
  const { data } = await http.post<EnrollmentToken>('/enrollment-tokens', input)
  return data
}

export async function revokeToken(id: string) {
  await http.delete(`/enrollment-tokens/${encodeURIComponent(id)}`)
}

export async function getUsers() {
  const { data } = await http.get<Account[]>('/users')
  return data
}

/** Creates the account outright: the System account sets the password, the panel sends no email. */
export async function createUser(input: { name: string; email: string; password: string; role: Role }) {
  const { data } = await http.post<Account>('/users', input)
  return data
}

export async function updateUser(id: string, patch: Partial<Pick<Account, 'disabled' | 'access'>>) {
  const { data } = await http.patch<Account>(`/users/${id}`, patch)
  return data
}

export async function deleteUser(id: string) {
  await http.delete(`/users/${encodeURIComponent(id)}`)
}

