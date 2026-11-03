import type { ActivityEvent, RemoteSessions, ResourceUsage, TimeRange } from '../types/dashboard'
import { fromNow, MINUTE } from '../utils/time'

export const resourceHistory: Record<TimeRange, ResourceUsage> = {
  '1h': { cpu: 41, ram: 60, disk: 71 },
  '24h': { cpu: 37, ram: 58, disk: 71 },
  '7d': { cpu: 33, ram: 55, disk: 69 },
}

export const remoteSessions: RemoteSessions = { reconnects24h: 5, summary: 'Terminal 2 · Desktop 1 · Web 4' }

export const activity: ActivityEvent[] = [
  { text: 'huy.van ran job "Clear temp" on group Accounting (12 agents)', at: fromNow(-18 * MINUTE), failed: false },
  { text: 'PC-048 enrolled, new certificate issued', at: fromNow(-45 * MINUTE), failed: false },
  { text: 'operator01 opened Remote Desktop to PC-003', at: fromNow(-63 * MINUTE), failed: false },
  { text: 'PC-031 went offline (no heartbeat)', at: fromNow(-80 * MINUTE), failed: true },
]
