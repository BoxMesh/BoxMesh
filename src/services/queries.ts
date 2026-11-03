import { queryOptions } from '@tanstack/react-query'
import type { TimeRange } from '../types/dashboard'
import { getRecentActivity, getRemoteSessions, getResourceUsage } from './dashboardService'
import { getConnectionHistory, getDevice, getDevices, getPendingEnrollments } from './deviceService'

// Shared query keys, so every screen reading the same data hits the same cache entry.

export const devicesQuery = queryOptions({ queryKey: ['devices'], queryFn: getDevices })

export const deviceQuery = (host: string) => queryOptions({ queryKey: ['devices', host], queryFn: () => getDevice(host) })

export const connectionHistoryQuery = (host: string) =>
  queryOptions({ queryKey: ['devices', host, 'connections'], queryFn: () => getConnectionHistory(host) })

export const pendingEnrollmentsQuery = queryOptions({ queryKey: ['enrollments', 'pending'], queryFn: getPendingEnrollments })

export const resourceUsageQuery = (range: TimeRange) =>
  queryOptions({ queryKey: ['metrics', 'summary', range], queryFn: () => getResourceUsage(range) })

export const remoteSessionsQuery = queryOptions({ queryKey: ['sessions', 'summary'], queryFn: getRemoteSessions })

export const recentActivityQuery = queryOptions({ queryKey: ['audit', 'recent'], queryFn: () => getRecentActivity() })
