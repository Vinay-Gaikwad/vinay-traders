import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Card } from './ui'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State { return { error } }

  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Vinay Traders UI error', error, info) }

  render() {
    if (!this.state.error) return this.props.children
    return <main className="main-content"><Card className="empty-state"><h1>Something went wrong</h1><p>The workspace could not render this screen. Reload the app to try again.</p><Button variant="primary" onClick={() => window.location.reload()}>Reload workspace</Button></Card></main>
  }
}
