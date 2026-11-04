import type { AlertRule, AuditEntry, Job } from '../types/ops'
import { http } from './http'

export interface NewJob {
  name: string
  command: string
  shell: string
  targets: string[]
  /** Omitted for a job that runs now. */
  schedule?: string
}

export async function getJobs() {
  const { data } = await http.get<Job[]>('/jobs')
  return data
}

export async function createJob(job: NewJob) {
  const { data } = await http.post<Job>('/jobs', job)
  return data
}

/** The full log. The dashboard's short feed is a different, summarised shape on /audit. */
export async function getAuditLog() {
  const { data } = await http.get<AuditEntry[]>('/audit/entries')
  return data
}

export async function getAlertRules() {
  const { data } = await http.get<AlertRule[]>('/alerts/rules')
  return data
}

export async function setAlertRule(id: string, enabled: boolean) {
  const { data } = await http.patch<AlertRule>(`/alerts/rules/${id}`, { enabled })
  return data
}
