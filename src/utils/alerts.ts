import { t } from '../i18n'
import type { Alert, AlertChannel, AlertMetric, AlertRule, ChannelKind } from '../types/alert'
import type { Device } from '../types/device'

type Target = Pick<Device, 'id' | 'groups'>

/** Whether a scoped alert covers this device: no groups and no devices picked means every device. */
export const appliesTo = (scope: { groupIds: string[]; deviceIds: string[] }, device: Target) =>
  (!scope.groupIds.length && !scope.deviceIds.length) ||
  scope.deviceIds.includes(device.id) ||
  device.groups.some((g) => scope.groupIds.includes(g))

export type UsageMetric = Exclude<AlertMetric, 'offline'>

/**
 * The alert lines for a device's charts: per metric, the lowest threshold among the rules of the alerts that cover
 * the device. A metric no such rule watches gets no line, so with no alert configured nothing is drawn.
 */
export function limitsFor(device: Pick<Device, 'id' | 'groups'>, alerts: Alert[], rules: AlertRule[]): Partial<Record<UsageMetric, number>> {
  const byId = new Map(rules.map((r) => [r.id, r]))
  const limits: Partial<Record<UsageMetric, number>> = {}
  for (const alert of alerts) {
    if (!appliesTo(alert, device)) continue
    for (const id of alert.ruleIds) {
      const rule = byId.get(id)
      if (!rule || rule.metric === 'offline') continue
      limits[rule.metric] = Math.min(limits[rule.metric] ?? Infinity, rule.threshold)
    }
  }
  return limits
}

export const METRIC_LABEL = (): Record<AlertMetric, string> => ({ cpu: 'CPU', ram: 'RAM', disk: t('Disk'), offline: t('Offline') })
export const KIND_LABEL = (): Record<ChannelKind, string> => ({ telegram: 'Telegram', discord: 'Discord', email: t('Email'), webhook: 'Webhook' })

export function conditionOf({ metric, threshold, minutes }: Pick<AlertRule, 'metric' | 'threshold' | 'minutes'>) {
  if (metric === 'offline') return minutes > 0 ? t('Offline for {minutes} min', { minutes }) : t('Offline')
  const vars = { metric: METRIC_LABEL()[metric], threshold, minutes }
  return minutes > 0 ? t('{metric} above {threshold}% for {minutes} min', vars) : t('{metric} above {threshold}%', vars)
}

/** The condition as the end of a sentence: "Sends a message when …". */
export function sentenceOf({ metric, threshold, minutes }: Pick<AlertRule, 'metric' | 'threshold' | 'minutes'>) {
  if (metric === 'offline') return minutes > 0 ? t('a device is offline for {minutes} min', { minutes }) : t('a device is offline')
  const vars = { metric: METRIC_LABEL()[metric], threshold, minutes }
  return minutes > 0 ? t('{metric} stays above {threshold}% for {minutes} min', vars) : t('{metric} goes above {threshold}%', vars)
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
  if (channel.kind === 'telegram') return t('Chat {id}', { id: channel.chatId ?? '—' })
  if (channel.kind === 'discord' || channel.kind === 'webhook') return channel.webhookTail ? `Webhook …${channel.webhookTail}` : 'Webhook'
  return (channel.to ?? []).join(', ') || '—'
}

const WEBHOOK = /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/
export const isDiscordWebhook = (url: string) => WEBHOOK.test(url.trim())

/** Any http(s) address: the custom webhook type posts to whatever the person runs. */
export function isWebhookUrl(url: string) {
  try {
    return ['http:', 'https:'].includes(new URL(url.trim()).protocol)
  } catch {
    return false
  }
}

export const WEBHOOK_METHODS = ['POST', 'PUT'] as const

/** The body a new webhook channel starts with; {message} is where BoxServer puts the alert text. */
export const DEFAULT_WEBHOOK_BODY = '{"text": "{message}"}'

const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/
export const isHeaderName = (name: string) => HEADER_NAME.test(name.trim())

/** Valid JSON once {message} is filled in. */
export function isBodyTemplate(body: string) {
  try {
    JSON.parse(body.replaceAll('{message}', 'x'))
    return true
  } catch {
    return false
  }
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

/** Telegram chat ids are numbers (groups and channels start with -100), or @channelname for public channels. */
export const isChatId = (value: string) => /^(-?\d{5,}|@[A-Za-z]\w{4,})$/.test(value.trim())
