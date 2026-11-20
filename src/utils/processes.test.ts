import { describe, expect, it } from 'vitest'
import type { DeviceProcess } from '../types/device'
import { groupProcesses } from './processes'

const p = (pid: number, ppid: number, name: string, cpu = 1, memoryMb = 10, status: DeviceProcess['status'] = 'running'): DeviceProcess => ({
  pid, ppid, name, user: 'u', status, cpu, memoryMb,
})

describe('groupProcesses', () => {
  it('groups same-named descendants under their root and sums them', () => {
    const rows = groupProcesses([p(1, 0, 'explorer.exe'), p(2, 1, 'chrome.exe', 5, 100), p(3, 2, 'chrome.exe', 2, 50), p(4, 2, 'Chrome.exe', 1, 20)])
    expect(rows.map((r) => r.pid)).toEqual([1, 2])
    const chrome = rows[1]
    expect(chrome.count).toBe(3)
    expect(chrome.cpu).toBe(8)
    expect(chrome.memoryMb).toBe(170)
    expect(chrome.children?.map((c) => c.pid)).toEqual([3, 4])
  })

  it('keeps a process on its own row when its parent has another name, has exited, or is 0', () => {
    const rows = groupProcesses([p(10, 99, 'a.exe'), p(11, 10, 'b.exe'), p(12, 0, 'a.exe')])
    expect(rows.map((r) => r.pid)).toEqual([10, 11, 12])
    expect(rows.every((r) => r.count === 1 && r.children === undefined)).toBe(true)
  })

  it('reports not-responding when any member is, and survives a parent loop', () => {
    const rows = groupProcesses([p(1, 2, 'x'), p(2, 1, 'x', 1, 10, 'not-responding')])
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('not-responding')
    expect(rows[0].count).toBe(2)
  })
})
