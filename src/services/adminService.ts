import type { Account, CommandRule, DeviceAccess, EnrollmentToken, Role } from '../types/admin'
import { http } from './http'

export async function getTokens() {
  const { data } = await http.get<EnrollmentToken[]>('/enrollment-tokens')
  return data
}

export interface NewToken {
  group: string
  lifetime: string
  requiresApproval: boolean
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

export async function inviteUser(input: { email: string; role: Role; access: DeviceAccess }) {
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

export type NewCommandRule = Omit<CommandRule, 'id'>

export async function getCommandRules() {
  const { data } = await http.get<Partial<CommandRule>[]>('/command-rules')
  // A rule saved before scopes existed has no groupIds or hosts: it applies everywhere, it doesn't crash the page.
  return data.map((r) => ({ match: 'starts', reason: '', ...r, shells: r.shells ?? [], groupIds: r.groupIds ?? [], hosts: r.hosts ?? [] }) as CommandRule)
}

export async function createCommandRule(input: NewCommandRule) {
  const { data } = await http.post<CommandRule>('/command-rules', input)
  return data
}

export async function updateCommandRule(id: string, patch: Partial<NewCommandRule>) {
  const { data } = await http.patch<CommandRule>(`/command-rules/${encodeURIComponent(id)}`, patch)
  return data
}

export async function deleteCommandRule(id: string) {
  await http.delete(`/command-rules/${encodeURIComponent(id)}`)
}
