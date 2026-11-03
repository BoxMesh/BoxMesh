import axios, { isAxiosError } from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
})

// shortcut: EdgePanel has no endpoints for these screens yet, so src/mocks answers every request;
// set VITE_USE_MOCK=false once it does. The dynamic import keeps mock data out of that build.
if (import.meta.env.VITE_USE_MOCK !== 'false') {
  http.defaults.adapter = async (config) => (await import('../mocks/adapter')).mockAdapter(config)
}

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
