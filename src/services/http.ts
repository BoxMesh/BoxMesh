import axios, { isAxiosError } from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
  // EdgePanel keeps the sign-in in HttpOnly cookies. When VITE_API_URL points at another origin, the browser only
  // stores and sends them with this flag (EdgePanel must allow credentials in CORS); same-origin it changes nothing.
  withCredentials: true,
})

// EdgePanel's ResponseFilter wraps bodies as { data } on success and { error } on failure.
http.interceptors.response.use(
  (response) => {
    response.data = response.data?.data
    return response
  },
  (error: unknown) => {
    if (isAxiosError(error)) {
      const body = error.response?.data?.error
      const detail = typeof body === 'string' ? body : body?.title
      if (detail) error.message = detail
    }
    return Promise.reject(error)
  },
)
