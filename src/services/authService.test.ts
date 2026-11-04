import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { getSession, signIn, signOut } from './authService'
import { http } from './http'

// Stands in for EdgePanel's POST /sign-in: records the request and replies with this status and body.
let sent: InternalAxiosRequestConfig | undefined
const reply =
  (status: number, body: unknown): AxiosAdapter =>
  async (config) => {
    sent = config
    const response = { data: body, status, statusText: String(status), headers: {}, config }
    if (status >= 400) throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response)
    return response
  }

describe('authService', () => {
  it('signs in and out', async () => {
    http.defaults.adapter = reply(200, { data: { id: '7b1f', email: 'ops@example.com' } })
    const user = await signIn('ops@example.com', 'secret', false)
    expect(sent?.url).toBe('/sign-in')
    // The JWT cookies only cross origins with credentials on (backend on its own domain).
    expect(sent?.withCredentials).toBe(true)
    expect(JSON.parse(sent?.data)).toEqual({ email: 'ops@example.com', password: 'secret' })
    expect(user).toEqual({ email: 'ops@example.com', name: 'ops' })
    expect(getSession()).toEqual(user)
    signOut()
    expect(getSession()).toBeNull()
  })

  // A 502 from the proxy is still "you are not signed in" to the person at the keyboard.
  it('reports any other failure as a failed sign-in', async () => {
    http.defaults.adapter = reply(502, { error: 'Bad Gateway' })
    await expect(signIn('ops@example.com', 'secret', false)).rejects.toThrow(
      'Sign-in failed. Try again in a moment.',
    )
    expect(getSession()).toBeNull()
  })

  it('reports a wrong email or password', async () => {
    // EdgePanel answers a failed sign-in with a bare 401 and { data: "Unauthorized" }.
    http.defaults.adapter = reply(401, { data: 'Unauthorized' })
    await expect(signIn('ops@example.com', 'wrong', false)).rejects.toThrow('Wrong email or password.')
    expect(getSession()).toBeNull()
  })
})
