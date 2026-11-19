import { Button, Card, Result, Skeleton } from 'antd'
import { isAxiosError } from 'axios'
import { Component, type ReactNode } from 'react'
import { t } from '../i18n'
import { userMessage } from '../services/http'

type Props = { children: ReactNode; onReset: () => void }

const RETRY_MS = 5000

// The backend is down or unreachable (no response, timeout, 5xx): the page is not broken, so show its outline and retry.
const isOffline = (e: Error) => isAxiosError(e) && (!e.response || e.response.status >= 500)

function PageSkeleton() {
  return (
    <div className="stack" role="status" aria-busy="true" aria-label={t('Reconnecting to the server…')}>
      <Skeleton active title={{ width: 240 }} paragraph={{ rows: 1, width: 360 }} />
      <div className="stat-grid">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton active title={false} paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    </div>
  )
}

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

  timer?: number

  componentDidUpdate() {
    window.clearTimeout(this.timer)
    const { error } = this.state
    if (error && isOffline(error)) this.timer = window.setTimeout(this.retry, RETRY_MS)
  }

  componentWillUnmount() {
    window.clearTimeout(this.timer)
  }

  retry = () => {
    this.props.onReset()
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (isOffline(error)) return <PageSkeleton />
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
