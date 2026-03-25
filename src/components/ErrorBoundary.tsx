import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // В продакшене можно отправить в сервис мониторинга
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info)
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-md space-y-4">
            <div className="text-5xl">⚠️</div>
            <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
            <p className="text-muted-foreground text-sm">
              Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left bg-secondary p-3 rounded-lg overflow-auto max-h-40 text-destructive">
                {this.state.error.message}
              </pre>
            )}
            <Button size="lg" className="rounded-xl" onClick={this.handleReset}>
              Перезагрузить
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
