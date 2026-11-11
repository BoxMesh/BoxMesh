import { Button, Result } from 'antd'
import { Component, type ReactNode } from 'react'
import { t } from '../i18n'
import { userMessage } from '../services/http'

type Props = { children: ReactNode; onReset: () => void }

// Catches failed requests thrown by suspense queries so one broken page doesn't blank the whole app.
export default class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    // The screen only ever gets userMessage(); the real cause belongs in the console, for whoever debugs it.
    console.error(error)
  }

  retry = () => {
    this.props.onReset()
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <Result
        status="error"
        title={t("This page couldn't load")}
        subTitle={userMessage(error)}
        extra={
          <Button type="primary" onClick={this.retry}>
            {t('Try again')}
          </Button>
        }
      />
    )
  }
}
