import axios, { isAxiosError, type AxiosError } from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
  // EdgePanel keeps the sign-in in HttpOnly cookies. When VITE_API_URL points at another origin, the browser only
  // stores and sends them with this flag (EdgePanel must allow credentials in CORS); same-origin it changes nothing.
  withCredentials: true,
})

// What to do about a failure, in words that assume nothing about how the system is built. Axios writes
// developer text into error.message ("Request failed with status code 502") and EdgePanel's { error }
// body is written for developers too, so neither is ever shown. Internal component names stay internal:
// an operator cannot act on "EdgePanel is down", and naming the backend tells an attacker what to probe.
// The caller says what failed ("Sign-in failed."); this only says what to do next.
function explain(error: AxiosError): string {
  if (error.code === 'ECONNABORTED') return 'That took too long. Try again.'
  // No response at all: the backend is down, or DNS, CORS or a proxy stopped the request short.
  if (!error.response) return "Can't reach the server. Check your connection, then try again."
  const { status } = error.response
  if (status === 401) return 'Your session has ended. Sign in again.'
  if (status === 403) return "You don't have permission to do this."
  if (status === 404) return 'That is no longer available.'
  if (status === 429) return 'Too many requests at once. Wait a moment, then try again.'
  if (status >= 500) return 'Try again in a moment.'
  return 'The request could not be completed.'
}

/**
 * The only error text a screen may show. Components call this instead of reading `error.message`,
 * which for a React render error is a stack-trace sentence no operator can act on.
 */
export function userMessage(error: unknown): string {
  return isAxiosError(error) ? explain(error) : 'Something went wrong. Try again.'
}

// EdgePanel's ResponseFilter wraps bodies as { data } on success and { error } on failure.
http.interceptors.response.use(
  (response) => {
    response.data = response.data?.data
    return response
  },
  (error: unknown) => {
    // Rewritten at the boundary as well, so even code that reads error.message directly stays safe.
    if (isAxiosError(error)) error.message = explain(error)
    return Promise.reject(error)
  },
)
