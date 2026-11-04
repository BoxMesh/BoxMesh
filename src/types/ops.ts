export type JobState = 'queued' | 'running' | 'done' | 'failed'

export interface JobResult {
  host: string
  state: Exclude<JobState, 'queued'>
  exitCode: number
  output: string
}

export interface Job {
  id: string
  name: string
  command: string
  shell: string
  /** Group names, or hostnames for a one-off run. */
  targets: string[]
  state: JobState
  /** ISO 8601; a scheduled job has not run yet. */
  startedAt: string
  schedule?: string
  results: JobResult[]
}

export interface AuditEntry {
  id: string
  at: string
  actor: string
  action: string
  target: string
  outcome: 'ok' | 'failed'
  ip: string
}
