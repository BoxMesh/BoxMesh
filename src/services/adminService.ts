import type { Account, Certificate, EnrollmentToken, Health, Role, Settings } from '../types/admin'
import { http } from './http'

export async function getCertificates() {
  const { data } = await http.get<Certificate[]>('/certificates')
  return data
}

export async function revokeCertificate(host: string) {
  const { data } = await http.post<Certificate>(`/certificates/${encodeURIComponent(host)}/revoke`, {})
  return data
}

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

export async function getUsers() {
  const { data } = await http.get<Account[]>('/users')
  return data
}

export async function inviteUser(input: { email: string; role: Role; scope: string[] }) {
  const { data } = await http.post<Account>('/users', input)
  return data
}

export async function updateUser(id: string, patch: Partial<Pick<Account, 'role' | 'scope' | 'disabled'>>) {
  const { data } = await http.patch<Account>(`/users/${id}`, patch)
  return data
}

export async function getSettings() {
  const { data } = await http.get<Settings>('/settings')
  return data
}

export async function saveSettings(settings: Settings) {
  const { data } = await http.put<Settings>('/settings', settings)
  return data
}

export async function getHealth() {
  const { data } = await http.get<Health>('/health')
  return data
}
