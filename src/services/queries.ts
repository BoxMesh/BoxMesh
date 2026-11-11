import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { TimeRange } from '../types/dashboard'
import { getCommandRules, getTokens, getUsers } from './adminService'
import { getAlertRules, getAlerts, getChannels } from './alertService'
import { getRemoteSessions } from './dashboardService'
import { getDevice, getDeviceMetrics, getDevices, getProcesses, getGroups, getPendingEnrollments } from './deviceService'
import { getFiles, getServices, getTransfer } from './remoteService'

// Shared query keys, so every screen reading the same data hits the same cache entry.

export const devicesQuery = queryOptions({ queryKey: ['devices'], queryFn: getDevices })

export const groupsQuery = queryOptions({ queryKey: ['groups'], queryFn: getGroups })

export const deviceQuery = (host: string) => queryOptions({ queryKey: ['devices', host], queryFn: () => getDevice(host) })

export const deviceMetricsQuery = (host: string, range: TimeRange) =>
  queryOptions({
    queryKey: ['devices', host, 'metrics', range],
    queryFn: () => getDeviceMetrics(host, range),
    placeholderData: keepPreviousData,
  })

export const processesQuery = (host: string) =>
  queryOptions({ queryKey: ['devices', host, 'processes'], queryFn: () => getProcesses(host) })

export const tokensQuery = queryOptions({ queryKey: ['enrollment-tokens'], queryFn: getTokens })

export const alertsQuery = queryOptions({ queryKey: ['alerts'], queryFn: getAlerts })

export const alertRulesQuery = queryOptions({ queryKey: ['alert-rules'], queryFn: getAlertRules })

export const alertChannelsQuery = queryOptions({ queryKey: ['alert-channels'], queryFn: getChannels })

export const pendingEnrollmentsQuery = queryOptions({ queryKey: ['enrollments', 'pending'], queryFn: getPendingEnrollments })

export const remoteSessionsQuery = queryOptions({ queryKey: ['sessions', 'summary'], queryFn: getRemoteSessions })

// ---- Remote ----

export const filesQuery = (host: string, path: string) =>
  queryOptions({ queryKey: ['devices', host, 'files', path], queryFn: () => getFiles(host, path) })

export const servicesQuery = (host: string) =>
  queryOptions({ queryKey: ['devices', host, 'services'], queryFn: () => getServices(host) })

// ---- Admin ----

export const usersQuery = queryOptions({ queryKey: ['users'], queryFn: getUsers })
export const commandRulesQuery = queryOptions({ queryKey: ['command-rules'], queryFn: getCommandRules })

// Polled once a second while any file is still copying, then left alone.
export const transferQuery = (id: string) =>
  queryOptions({
    queryKey: ['file-transfers', id],
    queryFn: () => getTransfer(id),
    refetchInterval: (query) => (query.state.data?.items.some((i) => i.state === 'copying') ? 1000 : false),
  })
