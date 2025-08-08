/**
 * Error Boundary Component for Love4Detailing
 * 
 * Provides graceful error handling for React components with
 * automatic error reporting to Sentry and user-friendly fallback UI.
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
// import { reportError } from '../../../sentry.client.config'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  level?: 'page' | 'component' | 'widget'
  context?: Record<string, any>
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      errorInfo
    })

    // Report error to Sentry with context
    const errorContext = {
      errorId: this.state.errorId || 'unknown',
      level: this.props.level || 'component',
      retryCount: this.retryCount,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      ...this.props.context
    }

    // reportError(error, errorContext)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 ErrorBoundary caught an error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Context:', errorContext)
      console.groupEnd()
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      })
    }
  }

  handleReportIssue = () => {
    const subject = encodeURIComponent(`Error Report: ${this.state.error?.name || 'Unknown Error'}`)
    const body = encodeURIComponent(
      `Hi Love 4 Detailing Team,

I encountered an error while using your website:

Error ID: ${this.state.errorId}
Error: ${this.state.error?.message || 'Unknown error occurred'}
Page: ${window.location.pathname}
Time: ${new Date().toISOString()}

Please let me know if you need any additional information.

Best regards`
    )
    
    window.open(`mailto:zell@love4detailing.com?subject=${subject}&body=${body}`)
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI based on error level
      if (this.props.fallback) {
        return this.props.fallback
      }

      return this.renderErrorUI()
    }

    return this.props.children
  }

  private renderErrorUI() {
    const { level = 'component' } = this.props
    const { error, errorId } = this.state
    const canRetry = this.retryCount < this.maxRetries

    // Different UI based on error level
    switch (level) {
      case 'page':
        return this.renderPageError()
      case 'widget':
        return this.renderWidgetError()
      default:
        return this.renderComponentError()
    }
  }

  private renderPageError() {
    const { error, errorId } = this.state
    const canRetry = this.retryCount < this.maxRetries

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
        <Card className="max-w-md w-full border-red-800 bg-gray-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <Heading size="h3" color="white" className="mb-2">
              Something went wrong
            </Heading>
            <Text size="sm" color="secondary">
              We're sorry, but something unexpected happened. Our team has been notified.
            </Text>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && error && (
              <div className="bg-red-950/50 border border-red-800 rounded-lg p-3">
                <Text size="xs" className="text-red-300 font-mono break-all">
                  {error.message}
                </Text>
              </div>
            )}
            
            <div className="text-center space-y-3">
              <Text size="xs" color="muted">
                Error ID: {errorId}
              </Text>
              
              <div className="flex flex-col gap-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="primary"
                    size="sm"
                    fullWidth
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}
                
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  size="sm"
                  fullWidth
                  leftIcon={<Home className="w-4 h-4" />}
                >
                  Go to Homepage
                </Button>
                
                <Button
                  onClick={this.handleReportIssue}
                  variant="ghost"
                  size="sm"
                  fullWidth
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                >
                  Report Issue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  private renderComponentError() {
    const { error, errorId } = this.state
    const canRetry = this.retryCount < this.maxRetries

    return (
      <Card className="border-red-800 bg-red-950/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            </div>
            <div className="flex-1 space-y-2">
              <Text weight="semibold" className="text-red-300">
                Component Error
              </Text>
              <Text size="sm" color="secondary">
                This section couldn't load properly. 
                {canRetry && ' You can try reloading it.'}
              </Text>
              
              {process.env.NODE_ENV === 'development' && error && (
                <Text size="xs" className="text-red-400 font-mono">
                  {error.message}
                </Text>
              )}
              
              <div className="flex gap-2 pt-2">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    size="xs"
                    leftIcon={<RefreshCw className="w-3 h-3" />}
                  >
                    Retry
                  </Button>
                )}
                
                <Text size="xs" color="muted" className="py-1">
                  ID: {errorId?.slice(-8)}
                </Text>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  private renderWidgetError() {
    const canRetry = this.retryCount < this.maxRetries

    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2 text-center">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <Text size="sm" color="secondary" className="flex-1">
            Widget unavailable
          </Text>
          {canRetry && (
            <Button
              onClick={this.handleRetry}
              variant="ghost"
              size="xs"
              leftIcon={<RefreshCw className="w-3 h-3" />}
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    )
  }
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return WithErrorBoundaryComponent
}

// Hook for manual error reporting
export function useErrorReporting() {
  const reportComponentError = (error: Error, context?: Record<string, any>) => {
    // reportError(error, {
    //   source: 'useErrorReporting',
    //   ...context
    // })
    console.error('Component Error:', error, context)
  }

  return { reportComponentError }
}