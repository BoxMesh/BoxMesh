import type { FileListing, FileTransfer, NewFileTransfer, RemoteService, Shell, ShellResult } from '../types/remote'
import { http } from './http'

// Every remote action goes to the panel, which relays it down the device's own tunnel. The portal
// never talks to a device directly, so these are ordinary panel endpoints.

const of = (id: string) => `/devices/${encodeURIComponent(id)}`

export async function runCommand(id: string, shell: Shell, command: string) {
  const { data } = await http.post<ShellResult>(`${of(id)}/shell`, { shell, command })
  return data
}

export async function getFiles(id: string, path: string) {
  const { data } = await http.get<FileListing>(`${of(id)}/files`, { params: { path } })
  return data
}

export async function getServices(id: string) {
  const { data } = await http.get<RemoteService[]>(`${of(id)}/services`)
  return data
}

export async function startTransfer(input: NewFileTransfer) {
  const { data } = await http.post<FileTransfer>('/file-transfers', input)
  return data
}

export async function getTransfer(id: string) {
  const { data } = await http.get<FileTransfer>(`/file-transfers/${encodeURIComponent(id)}`)
  return data
}

export async function cancelTransfer(id: string) {
  const { data } = await http.delete<FileTransfer>(`/file-transfers/${encodeURIComponent(id)}`)
  return data
}
