import type { CommandRule } from '../types/admin'
import type { Device } from '../types/device'
import type { Shell } from '../types/remote'

// Case and runs of spaces don't change what a shell command does, so "SHUTDOWN  /r" is "shutdown /r".
const normal = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase()

/** The regex error, or null when the pattern compiles. */
export function regexError(pattern: string): string | null {
  try {
    new RegExp(pattern, 'i')
    return null
  } catch (error) {
    return (error as Error).message
  }
}

type Target = Pick<Device, 'host' | 'groups'>

/** Whether a rule covers this device: no groups and no devices picked means every device. */
export const appliesTo = (rule: CommandRule, device: Target) =>
  (!rule.groupIds.length && !rule.hosts.length) ||
  rule.hosts.includes(device.host) ||
  device.groups.some((g) => rule.groupIds.includes(g))

export function matches(rule: CommandRule, device: Target, shell: Shell, command: string): boolean {
  if (rule.shells.length && !rule.shells.includes(shell)) return false
  if (!appliesTo(rule, device)) return false
  const text = normal(command)
  const pattern = normal(rule.pattern)
  if (!text || !pattern) return false
  if (rule.match === 'contains') return text.includes(pattern)
  // Whole words only, so "format" blocks "format C:" but not PowerShell's "Format-Table".
  if (rule.match === 'starts') return text === pattern || text.startsWith(`${pattern} `)
  return regexError(rule.pattern) === null && new RegExp(rule.pattern, 'i').test(command.trim())
}

/** The first rule that refuses this command, if any. */
export const blockedBy = (rules: CommandRule[], device: Target, shell: Shell, command: string) =>
  rules.find((rule) => matches(rule, device, shell, command))
