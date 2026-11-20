import type { DeviceProcess } from '../types/device'

/** A row of the Processes table: one process, or an app (a process plus its same-named descendants). */
export interface ProcessRow extends DeviceProcess {
  /** Processes in the row: 1 for a single process, more for an app. */
  count: number
  /** The app's processes, busiest first; absent on a row that stands alone. */
  children?: ProcessRow[]
}

const sameName = (a: DeviceProcess, b: DeviceProcess) => a.name.toLowerCase() === b.name.toLowerCase()

/**
 * Groups processes like Task Manager's app rows: a process joins its parent's group when the parent is running
 * and has the same name (chrome.exe under chrome.exe). The group row shows the root's identity with the group's
 * total CPU and memory, and the worst status among its members. A parent with a different name, a parent that has
 * exited and a parent id of 0 all leave the process on its own row.
 */
export function groupProcesses(list: DeviceProcess[]): ProcessRow[] {
  const byPid = new Map(list.map((p) => [p.pid, p]))
  const rootOf = (p: DeviceProcess) => {
    // A reused PID can make a loop; every member of one must pick the same root, so take the lowest PID.
    const path: number[] = []
    let cur = p
    while (!path.includes(cur.pid)) {
      path.push(cur.pid)
      const parent = byPid.get(cur.ppid)
      if (!parent || !sameName(parent, cur)) return cur
      cur = parent
    }
    return byPid.get(Math.min(...path.slice(path.indexOf(cur.pid))))!
  }

  const members = new Map<number, DeviceProcess[]>()
  for (const p of list) {
    const root = rootOf(p).pid
    members.set(root, [...(members.get(root) ?? []), p])
  }

  return [...members].map(([rootPid, group]): ProcessRow => {
    const root = byPid.get(rootPid)!
    const others = group.filter((p) => p.pid !== rootPid)
    if (!others.length) return { ...root, count: 1 }
    const status = group.some((p) => p.status === 'not-responding') ? 'not-responding' : root.status
    return {
      ...root,
      status,
      cpu: group.reduce((sum, p) => sum + p.cpu, 0),
      memoryMb: group.reduce((sum, p) => sum + p.memoryMb, 0),
      count: group.length,
      children: others.map((p) => ({ ...p, count: 1 })).sort((a, b) => b.cpu - a.cpu),
    }
  })
}
