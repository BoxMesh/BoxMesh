import { App } from 'antd'

// Actions that need EdgePanel endpoints that don't exist yet.
export function useNotSupported() {
  const { message } = App.useApp()
  return (action: string) => {
    message.info(`${action} isn't available yet.`)
  }
}
