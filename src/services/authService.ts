import { isAxiosError } from 'axios'
import type { User } from '../types/auth'
import { http } from './http'

const STORAGE_KEY = 'edgeportal-session'

// EdgePanel keeps the JWTs in HttpOnly cookies the browser sends on every same-origin request; the portal only
// remembers who signed in.
// shortcut: EdgePanel has no sign-out, refresh or "who am I" endpoint yet, so signing out only forgets the user here
// (the cookies live until they expire) and an expired access cookie isn't noticed until an API call fails.
// Call those endpoints once EdgePanel has them.
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
  const { data: account } = await http
    .post<{ id: string; email: string }>('/sign-in', { email, password })
    .catch((error: unknown) => {
      // EdgePanel answers a bad email or password with a bare 401 ({ data: "Unauthorized" }).
      throw isAxiosError(error) && error.response?.status === 401 ? new Error('Wrong email or password.') : error
    })
  const data: User = { email: account.email, name: account.email.split('@')[0] }
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
