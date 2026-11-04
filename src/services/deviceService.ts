import { isAxiosError } from 'axios'
import type { ConnectionEvent, Device, PendingEnrollment } from '../types/device'
import { http } from './http'

// Endpoints follow the canvas's proposed EdgePanel API; /connections and /enrollments are not in it yet.

export async function getDevices() {
  const { data } = await http.get<Device[]>('/devices')
  return data
}

/** Resolves null when EdgePanel has no device with that hostname. */
export async function getDevice(host: string) {
  try {
    const { data } = await http.get<Device>(`/devices/${encodeURIComponent(host)}`)
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function getConnectionHistory(host: string) {
  const { data } = await http.get<ConnectionEvent[]>(`/devices/${encodeURIComponent(host)}/connections`)
  return data
}

export async function getPendingEnrollments() {
  const { data } = await http.get<PendingEnrollment[]>('/enrollments', { params: { status: 'pending' } })
  return data
}

/** Approve or reject an agent waiting for its certificate. */
export async function decideEnrollment(host: string, outcome: 'approve' | 'reject') {
  await http.post(`/enrollments/${encodeURIComponent(host)}/${outcome}`, {})
}
