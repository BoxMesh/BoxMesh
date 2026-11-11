import type { RemoteSessions } from '../types/dashboard'
import { http } from './http'

// /sessions/summary is a proposal for EdgePanel.

export async function getRemoteSessions() {
  const { data } = await http.get<RemoteSessions>('/sessions/summary')
  return data
}
