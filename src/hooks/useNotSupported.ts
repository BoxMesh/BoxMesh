import { App } from 'antd'
import { t } from '../i18n'

// Actions that need BoxServer endpoints that don't exist yet. Callers pass the action already translated.
export function useNotSupported() {
  const { message } = App.useApp()
  return (action: string) => {
    message.info(t("{action} isn't available yet.", { action }))
  }
}
