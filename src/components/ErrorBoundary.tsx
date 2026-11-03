import { Button, Result } from 'antd'
import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; onReset: () => void }

// Catches failed requests thrown by suspense queries so one broken page doesn't blank the whole app.
export default class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
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
        title="This page couldn't load"
        subTitle={`${error.message}. Check that EdgePanel is reachable, then try again.`}
        extra={
          <Button type="primary" onClick={this.retry}>
            Try again
          </Button>
        }
      />
    )
  }
}
