import type { ActivityEvent, RemoteSessions, ResourceUsage, TimeRange } from '../types/dashboard'
import { http } from './http'

// /metrics/summary and /sessions/summary are proposals for EdgePanel; /audit is in the canvas's API list.

export async function getResourceUsage(range: TimeRange) {
  const { data } = await http.get<ResourceUsage>('/metrics/summary', { params: { range } })
  return data
}

export async function getRemoteSessions() {
  const { data } = await http.get<RemoteSessions>('/sessions/summary')
  return data
}

export async function getRecentActivity(limit = 4) {
  const { data } = await http.get<ActivityEvent[]>('/audit', { params: { limit } })
  return data
}
