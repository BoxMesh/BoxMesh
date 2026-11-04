import { describe, expect, it } from 'vitest'
import { getSession, signIn, signOut } from './authService'

// The mock adapter accepts any non-empty email and password.
describe('authService', () => {
  it('signs in and out', async () => {
    const user = await signIn('ops@example.com', 'secret', false)
    expect(user).toEqual({ email: 'ops@example.com', name: 'ops' })
    expect(getSession()).toEqual(user)
    signOut()
    expect(getSession()).toBeNull()
  })

  it('rejects an empty password', async () => {
    await expect(signIn('ops@example.com', '', false)).rejects.toThrow('Enter your email and password.')
    expect(getSession()).toBeNull()
  })
})
