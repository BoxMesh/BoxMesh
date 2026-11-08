import type { Device } from '../types/device'
import type { FileEntry } from '../types/remote'

export const sepOf = (device: Device) => (device.osFamily === 'Windows' ? '\\' : '/')
export const rootOf = (device: Device) => (device.osFamily === 'Windows' ? 'C:\\' : '/')

export const joinPath = (path: string, name: string, sep: string) => (path.endsWith(sep) ? path + name : path + sep + name)

// Anything shorter than the root ("C:" from "C:\Users") is the root itself.
export function parentOf(path: string, root: string, sep: string) {
  const parent = path.slice(0, path.lastIndexOf(sep))
  return parent.length < root.length ? root : parent
}

export function formatSize(bytes: number) {
  if (bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** How a file in one folder stands against the file of the same name in the other folder. */
export type Comparison = 'newer' | 'older' | 'same' | 'differs' | 'only'

// Two copies of one file rarely carry the exact same timestamp after a copy, so a couple of seconds counts as equal.
const SAME_TIME_MS = 2000

/** Compares the files (not folders) of `here` against `there`, by name, then modified time, then size. */
export function compareListings(here: FileEntry[], there: FileEntry[]): Map<string, Comparison> {
  const others = new Map(there.filter((e) => e.kind === 'file').map((e) => [e.name, e]))
  const result = new Map<string, Comparison>()
  for (const entry of here) {
    if (entry.kind !== 'file') continue
    const other = others.get(entry.name)
    if (!other) {
      result.set(entry.name, 'only')
      continue
    }
    const delta = Date.parse(entry.modified) - Date.parse(other.modified)
    if (Math.abs(delta) < SAME_TIME_MS) result.set(entry.name, entry.size === other.size ? 'same' : 'differs')
    else result.set(entry.name, delta > 0 ? 'newer' : 'older')
  }
  return result
}

/** What a one-way sync from `here` copies: files the other side lacks or holds an older copy of. */
export const namesToSync = (comparison: Map<string, Comparison>) =>
  [...comparison].filter(([, c]) => c === 'newer' || c === 'only').map(([name]) => name)
