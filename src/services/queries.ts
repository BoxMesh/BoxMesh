import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { TimeRange } from '../types/dashboard'
import { getCommandRules, getTokens, getUsers } from './adminService'
import { getAlertRules, getAlerts, getChannels } from './alertService'
import { getRemoteSessions } from './dashboardService'
import { getDevice, getDeviceMetrics, getDevices, getDiskForecast, getProcesses, getGroups, getPendingEnrollments } from './deviceService'
import { getFiles, getServices, getTransfer } from './remoteService'

// Shared query keys, so every screen reading the same data hits the same cache entry.

/**
 * EdgePanel answers 404 for an endpoint it doesn't serve yet; the screen then shows `empty` instead of its error
 * state. Every other failure (5xx, network, expired session) still reaches the error state.
 */
export const emptyIfMissing =
  <T>(load: () => Promise<T>, empty: T) =>
  () =>
    load().catch((error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 404) return empty
      throw error
    })

export const devicesQuery = queryOptions({ queryKey: ['devices'], queryFn: emptyIfMissing(getDevices, []) })

export const groupsQuery = queryOptions({ queryKey: ['groups'], queryFn: emptyIfMissing(getGroups, []) })

export const deviceQuery = (host: string) => queryOptions({ queryKey: ['devices', host], queryFn: () => getDevice(host) })

export const deviceMetricsQuery = (host: string, range: TimeRange) =>
  queryOptions({
    queryKey: ['devices', host, 'metrics', range],
    queryFn: emptyIfMissing(() => getDeviceMetrics(host, range), []),
    placeholderData: keepPreviousData,
  })

export const processesQuery = (host: string) =>
  queryOptions({ queryKey: ['devices', host, 'processes'], queryFn: emptyIfMissing(() => getProcesses(host), []) })

export const diskForecastQuery = queryOptions({ queryKey: ['disk-forecast'], queryFn: emptyIfMissing(getDiskForecast, []) })

export const tokensQuery = queryOptions({ queryKey: ['enrollment-tokens'], queryFn: emptyIfMissing(getTokens, []) })

export const alertsQuery = queryOptions({ queryKey: ['alerts'], queryFn: emptyIfMissing(getAlerts, []) })

export const alertRulesQuery = queryOptions({ queryKey: ['alert-rules'], queryFn: emptyIfMissing(getAlertRules, []) })

export const alertChannelsQuery = queryOptions({ queryKey: ['alert-channels'], queryFn: emptyIfMissing(getChannels, []) })

export const pendingEnrollmentsQuery = queryOptions({
  queryKey: ['enrollments', 'pending'],
  queryFn: emptyIfMissing(getPendingEnrollments, []),
})

export const remoteSessionsQuery = queryOptions({
  queryKey: ['sessions', 'summary'],
  queryFn: emptyIfMissing(getRemoteSessions, { reconnects24h: 0, summary: '' }),
})

// ---- Remote ----

export const filesQuery = (host: string, path: string) =>
  queryOptions({ queryKey: ['devices', host, 'files', path], queryFn: () => getFiles(host, path) })

export const servicesQuery = (host: string) =>
  queryOptions({ queryKey: ['devices', host, 'services'], queryFn: () => getServices(host) })

// ---- Admin ----

export const usersQuery = queryOptions({ queryKey: ['users'], queryFn: emptyIfMissing(getUsers, []) })
export const commandRulesQuery = queryOptions({ queryKey: ['command-rules'], queryFn: emptyIfMissing(getCommandRules, []) })

// Polled once a second while any file is still copying, then left alone.
export const transferQuery = (id: string) =>
  queryOptions({
    queryKey: ['file-transfers', id],
    queryFn: () => getTransfer(id),
    refetchInterval: (query) => (query.state.data?.items.some((i) => i.state === 'copying') ? 1000 : false),
  })
