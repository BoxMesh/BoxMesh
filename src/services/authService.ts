import type { User } from '../types/auth'
import { http } from './http'

const STORAGE_KEY = 'edgeportal-session'

// shortcut: the session is only a client-side flag until EdgePanel has sign-in; switch to its session cookie or token then.
let session = load()

function load(): User | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export const getSession = () => session

/** With `remember`, the session outlives the browser; otherwise it ends when the browser closes. */
export async function signIn(email: string, password: string, remember: boolean) {
  const { data } = await http.post<User>('/auth/login', { email, password })
  session = data
  try {
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage blocked (private mode, policy): the session lasts until the page reloads.
  }
  return data
}

export function signOut() {
  session = null
  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked: nothing was saved.
  }
}
