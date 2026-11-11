import type { AlertChannel, AlertMetric, AlertRule, ChannelKind } from '../types/alert'

export const METRIC_LABEL: Record<AlertMetric, string> = { cpu: 'CPU', ram: 'RAM', disk: 'Disk', offline: 'Offline' }
export const KIND_LABEL: Record<ChannelKind, string> = { telegram: 'Telegram', discord: 'Discord', email: 'Email' }

export function conditionOf(rule: Pick<AlertRule, 'metric' | 'threshold' | 'minutes'>) {
  const lasting = rule.minutes > 0 ? ` for ${rule.minutes} min` : ''
  return rule.metric === 'offline' ? `Offline${lasting}` : `${METRIC_LABEL[rule.metric]} above ${rule.threshold}%${lasting}`
}

/** The condition as the end of a sentence: "Sends a message when …". */
export function sentenceOf(rule: Pick<AlertRule, 'metric' | 'threshold' | 'minutes'>) {
  const lasting = rule.minutes > 0 ? ` for ${rule.minutes} min` : ''
  if (rule.metric === 'offline') return `a device is offline${lasting}`
  return `${METRIC_LABEL[rule.metric]} ${rule.minutes > 0 ? 'stays' : 'goes'} above ${rule.threshold}%${lasting}`
}

export const PLACEHOLDERS = ['device', 'alias', 'rule', 'condition', 'value', 'groups', 'time'] as const
export type MessageValues = Record<(typeof PLACEHOLDERS)[number], string>

export const DEFAULT_MESSAGE = '⚠️ {rule} on {device} ({alias})\n{condition}. Now: {value}.\n{time}'

/** Fills {name} placeholders; an unknown one is left as typed so the preview shows the mistake. */
export const renderMessage = (template: string, values: MessageValues) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? values[key as keyof MessageValues] : whole))

export const unknownPlaceholders = (template: string) =>
  [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((k) => !(PLACEHOLDERS as readonly string[]).includes(k))

export function destinationOf(channel: AlertChannel) {
  if (channel.kind === 'telegram') return `Chat ${channel.chatId ?? '—'}`
  if (channel.kind === 'discord') return channel.webhookTail ? `Webhook …${channel.webhookTail}` : 'Webhook'
  return (channel.to ?? []).join(', ') || '—'
}

const WEBHOOK = /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/
export const isDiscordWebhook = (url: string) => WEBHOOK.test(url.trim())

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

/** Telegram chat ids are numbers (groups and channels start with -100), or @channelname for public channels. */
export const isChatId = (value: string) => /^(-?\d{5,}|@[A-Za-z]\w{4,})$/.test(value.trim())
