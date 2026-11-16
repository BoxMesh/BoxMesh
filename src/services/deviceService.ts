import { isAxiosError } from 'axios'
import type { TimeRange } from '../types/dashboard'
import type { Device, DeviceGroup, DeviceProcess, MetricPoint, PendingEnrollment, DiskForecast } from '../types/device'
import { http } from './http'

// Endpoints follow the canvas's proposed EdgePanel API; /metrics, /processes and /enrollments are not in it yet.

export async function getDevices() {
  const { data } = await http.get<Device[]>('/devices')
  return data
}

// Devices are addressed by ID: hostnames can repeat.

/** Resolves null when EdgePanel has no device with that ID. */
export async function getDevice(id: string) {
  try {
    const { data } = await http.get<Device>(`/devices/${encodeURIComponent(id)}`)
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

/** Sets the alias shown beside the hostname; an empty one clears it. */
export async function setAlias(id: string, alias: string) {
  const { data } = await http.patch<Device>(`/devices/${encodeURIComponent(id)}`, { alias })
  return data
}

export async function getDeviceMetrics(id: string, range: TimeRange) {
  const { data } = await http.get<MetricPoint[]>(`/devices/${encodeURIComponent(id)}/metrics`, { params: { range } })
  return data
}

export async function getProcesses(id: string) {
  const { data } = await http.get<DeviceProcess[]>(`/devices/${encodeURIComponent(id)}/processes`)
  return data
}

// /disk-forecast is a proposal for EdgePanel: the disks filling up fastest, soonest full first.
export async function getDiskForecast() {
  const { data } = await http.get<DiskForecast[]>('/disk-forecast')
  return data
}

export async function getPendingEnrollments() {
  const { data } = await http.get<PendingEnrollment[]>('/enrollments', { params: { status: 'pending' } })
  return data
}

/** Approve or reject an agent waiting to be let in. */
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
export async function setDeviceGroups(id: string, groupIds: string[]) {
  const { data } = await http.put<Device>(`/devices/${encodeURIComponent(id)}/groups`, { groupIds })
  return data
}
