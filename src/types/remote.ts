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

export type ConflictChoice = 'replace' | 'keep-both' | 'skip'

export interface FileLocation {
  host: string
  path: string
}

/** A copy of files from a folder on one device to a folder on another, relayed by the panel. */
export interface NewFileTransfer {
  from: FileLocation
  to: FileLocation
  /** What to do when the target folder already has a file of that name. */
  items: { name: string; onConflict: ConflictChoice }[]
}

export interface FileTransfer {
  id: string
  from: FileLocation
  to: FileLocation
  items: { name: string; size: number; copied: number; state: 'copying' | 'done' | 'skipped' | 'cancelled' | 'failed' }[]
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
