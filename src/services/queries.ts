import { queryOptions } from '@tanstack/react-query'
import type { TimeRange } from '../types/dashboard'
import { getCertificates, getHealth, getSettings, getTokens, getUsers } from './adminService'
import { getRecentActivity, getRemoteSessions, getResourceUsage } from './dashboardService'
import { getConnectionHistory, getDevice, getDevices, getPendingEnrollments } from './deviceService'
import { getAlertRules, getAuditLog, getJobs } from './opsService'
import { getFiles, getServices } from './remoteService'

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

// ---- Remote ----

export const filesQuery = (host: string, path: string) =>
  queryOptions({ queryKey: ['devices', host, 'files', path], queryFn: () => getFiles(host, path) })

export const servicesQuery = (host: string) =>
  queryOptions({ queryKey: ['devices', host, 'services'], queryFn: () => getServices(host) })

// ---- Operations ----

export const jobsQuery = queryOptions({ queryKey: ['jobs'], queryFn: getJobs })

export const auditLogQuery = queryOptions({ queryKey: ['audit', 'log'], queryFn: getAuditLog })

export const alertRulesQuery = queryOptions({ queryKey: ['alerts', 'rules'], queryFn: getAlertRules })

// ---- Admin ----

export const certificatesQuery = queryOptions({ queryKey: ['certificates'], queryFn: getCertificates })

export const tokensQuery = queryOptions({ queryKey: ['enrollment-tokens'], queryFn: getTokens })

export const usersQuery = queryOptions({ queryKey: ['users'], queryFn: getUsers })

export const settingsQuery = queryOptions({ queryKey: ['settings'], queryFn: getSettings })

export const healthQuery = queryOptions({ queryKey: ['health'], queryFn: getHealth })
