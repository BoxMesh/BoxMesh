import { describe, expect, it } from 'vitest'
import { conditionOf, destinationOf, isChatId, isDiscordWebhook, isEmail, renderMessage, sentenceOf, unknownPlaceholders } from './alerts'

describe('conditionOf', () => {
  it('reads a metric rule and an offline rule', () => {
    expect(conditionOf({ metric: 'cpu', threshold: 90, minutes: 5 })).toBe('CPU above 90% for 5 min')
    expect(conditionOf({ metric: 'offline', threshold: 0, minutes: 10 })).toBe('Offline for 10 min')
    expect(conditionOf({ metric: 'disk', threshold: 85, minutes: 0 })).toBe('Disk above 85%')
  })
})

describe('sentenceOf', () => {
  it('finishes "Sends a message when …"', () => {
    expect(sentenceOf({ metric: 'ram', threshold: 85, minutes: 10 })).toBe('RAM stays above 85% for 10 min')
    expect(sentenceOf({ metric: 'disk', threshold: 85, minutes: 0 })).toBe('Disk goes above 85%')
    expect(sentenceOf({ metric: 'offline', threshold: 0, minutes: 5 })).toBe('a device is offline for 5 min')
  })
})

describe('destinationOf', () => {
  it('never shows a secret', () => {
    expect(destinationOf({ id: 'c', kind: 'discord', name: 'x', webhookTail: 'k9Qz' })).toBe('Webhook …k9Qz')
    expect(destinationOf({ id: 'c', kind: 'email', name: 'x', to: ['a@b.co', 'c@d.co'] })).toBe('a@b.co, c@d.co')
  })
})

describe('renderMessage', () => {
  const values = { device: 'SRV-DB-01', alias: 'Database', rule: 'CPU hot', condition: 'CPU above 90%', value: '96%', groups: 'Server', time: '11 Nov 2026, 14:05' }
  it('fills known placeholders and leaves unknown ones as typed', () => {
    expect(renderMessage('{rule} on {device}: {value} {oops}', values)).toBe('CPU hot on SRV-DB-01: 96% {oops}')
    expect(unknownPlaceholders('{device} {oops} {time} {nope}')).toEqual(['oops', 'nope'])
  })
})

describe('validators', () => {
  it('accepts real Discord webhooks only', () => {
    expect(isDiscordWebhook('https://discord.com/api/webhooks/1234567890/abc-DEF_12')).toBe(true)
    expect(isDiscordWebhook('https://discordapp.com/api/webhooks/1/x')).toBe(true)
    expect(isDiscordWebhook('http://discord.com/api/webhooks/1/x')).toBe(false)
    expect(isDiscordWebhook('https://evil.example/api/webhooks/1/x')).toBe(false)
  })
  it('accepts Telegram chat ids and public channel names', () => {
    expect(isChatId('-1002233445566')).toBe(true)
    expect(isChatId('@it_alerts')).toBe(true)
    expect(isChatId('hello')).toBe(false)
  })
  it('checks an email address', () => {
    expect(isEmail('it@company.com')).toBe(true)
    expect(isEmail('it@company')).toBe(false)
  })
})
