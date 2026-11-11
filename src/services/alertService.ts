import type { Alert, AlertChannel, AlertRule, ChannelInput } from '../types/alert'
import { http } from './http'

// /alerts, /alert-rules and /alert-channels are placeholder names: EdgePanel evaluates the rules and sends the messages.

export type NewAlertRule = Omit<AlertRule, 'id'>

export async function getAlertRules() {
  const { data } = await http.get<AlertRule[]>('/alert-rules')
  return data
}

export async function createAlertRule(input: NewAlertRule) {
  const { data } = await http.post<AlertRule>('/alert-rules', input)
  return data
}

export async function updateAlertRule(id: string, patch: Partial<NewAlertRule>) {
  const { data } = await http.patch<AlertRule>(`/alert-rules/${encodeURIComponent(id)}`, patch)
  return data
}

export async function deleteAlertRule(id: string) {
  await http.delete(`/alert-rules/${encodeURIComponent(id)}`)
}

export type NewAlert = Omit<Alert, 'id'>

export async function getAlerts() {
  const { data } = await http.get<Alert[]>('/alerts')
  return data
}

export async function createAlert(input: NewAlert) {
  const { data } = await http.post<Alert>('/alerts', input)
  return data
}

export async function updateAlert(id: string, patch: Partial<NewAlert>) {
  const { data } = await http.patch<Alert>(`/alerts/${encodeURIComponent(id)}`, patch)
  return data
}

export async function deleteAlert(id: string) {
  await http.delete(`/alerts/${encodeURIComponent(id)}`)
}

export async function getChannels() {
  const { data } = await http.get<AlertChannel[]>('/alert-channels')
  return data
}

export async function createChannel(input: ChannelInput) {
  const { data } = await http.post<AlertChannel>('/alert-channels', input)
  return data
}

export async function updateChannel(id: string, patch: Partial<ChannelInput>) {
  const { data } = await http.patch<AlertChannel>(`/alert-channels/${encodeURIComponent(id)}`, patch)
  return data
}

export async function deleteChannel(id: string) {
  await http.delete(`/alert-channels/${encodeURIComponent(id)}`)
}

export async function testChannel(id: string) {
  await http.post(`/alert-channels/${encodeURIComponent(id)}/test`, {})
}
