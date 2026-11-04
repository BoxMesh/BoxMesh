export type Shell = 'PowerShell' | 'CMD' | 'Bash'

export interface ShellResult {
  /** Echoed back so a slow reply still lands under the right prompt. */
  command: string
  output: string
  exitCode: number
  at: string
}

export interface FileEntry {
  name: string
  kind: 'folder' | 'file'
  /** Bytes; folders report 0. */
  size: number
  modified: string
}

export interface FileListing {
  path: string
  entries: FileEntry[]
}

export interface RemoteService {
  name: string
  port: number
  /** Reached through the panel's reverse proxy, never directly. */
  path: string
  status: 'running' | 'stopped'
  kind: string
}

export interface DesktopSession {
  id: string
  resolution: string
  startedAt: string
  /** Frames per second the agent is sending. */
  fps: number
  quality: 'auto' | 'high' | 'balanced' | 'low'
}
