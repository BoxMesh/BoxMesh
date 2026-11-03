export type TimeRange = '1h' | '24h' | '7d'

/** Average usage in percent */
export interface ResourceUsage {
  cpu: number
  ram: number
  disk: number
}

export interface RemoteSessions {
  reconnects24h: number
  summary: string
}

export interface ActivityEvent {
  text: string
  at: string
  failed: boolean
}
