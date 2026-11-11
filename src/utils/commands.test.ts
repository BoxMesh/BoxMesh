import { describe, expect, it } from 'vitest'
import type { CommandRule } from '../types/admin'
import { blockedBy, matches, regexError } from './commands'

const rule = (over: Partial<CommandRule>): CommandRule => ({
  id: 'r',
  pattern: 'shutdown',
  match: 'starts',
  shells: [],
  reason: '',
  groupIds: [],
  hosts: [],
  ...over,
})

const PC = { host: 'ACC-PC-01', groups: ['g-acc'] }

describe('matches', () => {
  it('starts: whole words, any case and spacing', () => {
    const r = rule({ pattern: 'format' })
    expect(matches(r, PC, 'CMD', 'format C:')).toBe(true)
    expect(matches(r, PC, 'CMD', '  FORMAT   D: /q')).toBe(true)
    expect(matches(r, PC, 'CMD', 'format')).toBe(true)
    expect(matches(r, PC, 'PowerShell', 'Format-Table')).toBe(false)
    expect(matches(r, PC, 'CMD', 'echo format')).toBe(false)
  })

  it('contains: catches a chained command', () => {
    expect(matches(rule({ match: 'contains' }), PC, 'Bash', 'echo hi && shutdown -h now')).toBe(true)
  })

  it('regex: case-insensitive; an invalid one never matches', () => {
    expect(matches(rule({ match: 'regex', pattern: 'rm\\s+-(rf|fr)\\s+/(\\s|$)' }), PC, 'Bash', 'RM -fr /')).toBe(true)
    expect(matches(rule({ match: 'regex', pattern: 'rm\\s+-(rf|fr)\\s+/(\\s|$)' }), PC, 'Bash', 'rm -rf /tmp/x')).toBe(false)
    expect(matches(rule({ match: 'regex', pattern: '(' }), PC, 'Bash', '(')).toBe(false)
  })

  it('skips rules for another shell', () => {
    expect(matches(rule({ shells: ['CMD'] }), PC, 'Bash', 'shutdown')).toBe(false)
    expect(matches(rule({ shells: ['CMD'] }), PC, 'CMD', 'shutdown /r')).toBe(true)
  })

  it('an empty command or pattern matches nothing', () => {
    expect(matches(rule({ match: 'contains', pattern: '  ' }), PC, 'Bash', 'ls')).toBe(false)
    expect(matches(rule({}), PC, 'Bash', '   ')).toBe(false)
  })
})

describe('scope', () => {
  it('no groups and no devices means every device', () => {
    expect(matches(rule({}), { host: 'X', groups: [] }, 'Bash', 'shutdown')).toBe(true)
  })

  it('a group rule covers only devices in that group', () => {
    const r = rule({ groupIds: ['g-acc'] })
    expect(matches(r, PC, 'CMD', 'shutdown')).toBe(true)
    expect(matches(r, { host: 'SRV-DB-01', groups: ['g-srv'] }, 'Bash', 'shutdown')).toBe(false)
  })

  it('a device rule covers only that device', () => {
    const r = rule({ hosts: ['SRV-DB-01'] })
    expect(matches(r, { host: 'SRV-DB-01', groups: [] }, 'Bash', 'shutdown')).toBe(true)
    expect(matches(r, PC, 'CMD', 'shutdown')).toBe(false)
  })
})

describe('blockedBy', () => {
  it('returns the first rule that refuses', () => {
    const rules = [rule({ id: 'a', shells: ['CMD'] }), rule({ id: 'b' }), rule({ id: 'c' })]
    expect(blockedBy(rules, PC, 'Bash', 'shutdown now')?.id).toBe('b')
    expect(blockedBy(rules, PC, 'Bash', 'uptime')).toBeUndefined()
  })
})

describe('regexError', () => {
  it('reports a pattern that does not compile', () => {
    expect(regexError('a+')).toBeNull()
    expect(regexError('(')).toMatch(/./)
  })
})
