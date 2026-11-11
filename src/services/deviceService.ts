import { isAxiosError } from 'axios'
import type { TimeRange } from '../types/dashboard'
import type { Device, DeviceGroup, DeviceProcess, MetricPoint, PendingEnrollment } from '../types/device'
import { http } from './http'

// Endpoints follow the canvas's proposed EdgePanel API; /metrics, /processes and /enrollments are not in it yet.

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

export async function getDeviceMetrics(host: string, range: TimeRange) {
  const { data } = await http.get<MetricPoint[]>(`/devices/${encodeURIComponent(host)}/metrics`, { params: { range } })
  return data
}

export async function getProcesses(host: string) {
  const { data } = await http.get<DeviceProcess[]>(`/devices/${encodeURIComponent(host)}/processes`)
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

// ---- Groups ----

export async function getGroups() {
  const { data } = await http.get<DeviceGroup[]>('/groups')
  return data
}

export async function createGroup(name: string) {
  const { data } = await http.post<DeviceGroup>('/groups', { name })
  return data
}

export async function renameGroup(id: string, name: string) {
  const { data } = await http.patch<DeviceGroup>(`/groups/${encodeURIComponent(id)}`, { name })
  return data
}

/** Deletes the group only; its devices stay, they just leave it. */
export async function deleteGroup(id: string) {
  await http.delete(`/groups/${encodeURIComponent(id)}`)
}

/** Replaces the device's groups with exactly these. */
export async function setDeviceGroups(host: string, groupIds: string[]) {
  const { data } = await http.put<Device>(`/devices/${encodeURIComponent(host)}/groups`, { groupIds })
  return data
}
