/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** EdgePanel API base URL; defaults to /api on the same origin. */
  readonly VITE_API_URL?: string
  /** "false" sends requests to EdgePanel; anything else answers them from src/mocks. */
  readonly VITE_USE_MOCK?: string
}
