export type AlertMetric = 'cpu' | 'ram' | 'disk' | 'offline'

/** A named condition. Where it applies and who hears about it live on an Alert. */
export interface AlertRule {
  id: string
  name: string
  metric: AlertMetric
  /** Percent; not used for offline. */
  threshold: number
  /** How long the condition must hold before a message goes out. */
  minutes: number
}

/** Rules applied to groups or devices, sent to channels with a message template. */
export interface Alert {
  id: string
  name: string
  ruleIds: string[]
  /** Both empty = every device. */
  groupIds: string[]
  hosts: string[]
  channelIds: string[]
  /** Placeholders such as {device} are filled in by EdgePanel when it sends. */
  message: string
}

export type ChannelKind = 'telegram' | 'discord' | 'email'

/** What EdgePanel sends back: never the bot token, the full webhook URL or the mail password. */
export interface AlertChannel {
  id: string
  kind: ChannelKind
  name: string
  chatId?: string
  webhookTail?: string
  smtpHost?: string
  smtpPort?: number
  username?: string
  to?: string[]
}

/** Secrets are write-only: send one to set or replace it, leave it out to keep the saved one. */
export type ChannelInput = Omit<AlertChannel, 'id' | 'webhookTail'> & {
  botToken?: string
  webhookUrl?: string
  password?: string
}
