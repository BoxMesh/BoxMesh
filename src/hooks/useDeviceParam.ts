import { useSuspenseQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { devicesQuery } from '../services/queries'

/**
 * The chosen device's ID lives in `?device=`, so a remote session can be linked, bookmarked and reopened on
 * the same machine, and the back button steps between devices instead of leaving the screen.
 */
export function useDeviceParam() {
  const [params, setParams] = useSearchParams()
  const { data: devices } = useSuspenseQuery(devicesQuery)
  const deviceId = params.get('device') ?? ''
  return {
    devices,
    deviceId,
    device: devices.find((d) => d.id === deviceId) ?? null,
    // Other params stay: Remote Files keeps its second device in `?with=`.
    setDeviceId: (next: string) =>
      setParams(
        (current) => {
          const params = new URLSearchParams(current)
          if (next) params.set('device', next)
          else params.delete('device')
          return params
        },
        { replace: true },
      ),
  }
}
