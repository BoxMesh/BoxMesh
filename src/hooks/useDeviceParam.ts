import { useSuspenseQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { devicesQuery } from '../services/queries'

/**
 * The chosen device lives in `?host=`, so a remote session can be linked, bookmarked and reopened on
 * the same machine, and the back button steps between devices instead of leaving the screen.
 */
export function useDeviceParam() {
  const [params, setParams] = useSearchParams()
  const { data: devices } = useSuspenseQuery(devicesQuery)
  const host = params.get('host') ?? ''
  return {
    devices,
    host,
    device: devices.find((d) => d.host === host) ?? null,
    // Other params stay: Remote Files keeps its second device in `?with=`.
    setHost: (next: string) =>
      setParams(
        (current) => {
          const params = new URLSearchParams(current)
          if (next) params.set('host', next)
          else params.delete('host')
          return params
        },
        { replace: true },
      ),
  }
}
