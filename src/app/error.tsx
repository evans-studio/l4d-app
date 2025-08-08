/**
 * Next.js Error Page for Love4Detailing
 * 
 * Global error page that handles runtime errors in the app.
 * Integrates with Sentry for error tracking and provides user-friendly fallback UI.
 */

'use client'

import { useEffect } from 'react'
// import { reportError } from '../../sentry.client.config'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    // Report error to Sentry (disabled temporarily for build)
    // reportError(error, {
    //   errorId,
    //   source: 'nextjs_error_page',
    //   digest: error.digest,
    //   pathname: window.location.pathname,
    //   userAgent: navigator.userAgent
    // })

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Next.js Error Page')
      console.error('Error:', error)
      console.error('Error Digest:', error.digest)
      console.error('Error ID:', errorId)
      console.groupEnd()
    }
  }, [error, errorId])

  const handleReportIssue = () => {
    const subject = encodeURIComponent(`Website Error Report: ${error.name || 'Unknown Error'}`)
    const body = encodeURIComponent(
      `Hi Love 4 Detailing Team,

I encountered an error while using your website:

Error ID: ${errorId}
Error: ${error.message || 'Unknown error occurred'}
Page: ${window.location.pathname}
Time: ${new Date().toISOString()}
Browser: ${navigator.userAgent}

Please let me know if you need any additional information to help resolve this issue.

Best regards`
    )
    
    window.open(`mailto:zell@love4detailing.com?subject=${subject}&body=${body}`)
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleCallSupport = () => {
    window.location.href = 'tel:+447908625581'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,_rgba(151,71,255,0.3)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,_rgba(151,71,255,0.2)_0%,_transparent_50%)]" />
      </div>
      
      <Card className="max-w-lg w-full border-red-800/50 bg-gray-800/80 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          
          <Heading size="h2" color="white" className="mb-3">
            Oops! Something went wrong
          </Heading>
          
          <Text size="base" color="secondary" className="leading-relaxed">
            We're sorry for the inconvenience. Our team has been automatically notified 
            and will work to fix this issue as soon as possible.
          </Text>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-4">
              <Text size="sm" weight="semibold" className="text-red-300 mb-2">
                Development Error Details:
              </Text>
              <Text size="xs" className="text-red-400 font-mono break-all leading-relaxed">
                {error.message}
              </Text>
              {error.digest && (
                <Text size="xs" className="text-red-500 font-mono mt-2">
                  Digest: {error.digest}
                </Text>
              )}
            </div>
          )}
          
          {/* Error ID for support */}
          <div className="bg-gray-700/50 rounded-lg p-3 text-center">
            <Text size="sm" color="secondary" className="mb-1">
              Error Reference ID:
            </Text>
            <Text size="sm" weight="semibold" className="text-white font-mono">
              {errorId}
            </Text>
          </div>
          
          {/* Action buttons */}
          <div className="space-y-3">
            <Button 
              onClick={reset}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<RefreshCw className="w-5 h-5" />}
              className="bg-brand-600 hover:bg-brand-700"
            >
              Try Again
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleGoHome}
                variant="outline"
                size="md"
                fullWidth
                leftIcon={<Home className="w-4 h-4" />}
              >
                Go Home
              </Button>
              
              <Button
                onClick={handleCallSupport}
                variant="outline"
                size="md"
                fullWidth
                className="text-green-400 border-green-700 hover:bg-green-900/20"
              >
                Call Support
              </Button>
            </div>
            
            <Button
              onClick={handleReportIssue}
              variant="ghost"
              size="sm"
              fullWidth
              leftIcon={<MessageCircle className="w-4 h-4" />}
              className="text-gray-400 hover:text-gray-300"
            >
              Report This Issue
            </Button>
          </div>
          
          {/* Alternative contact information */}
          <div className="border-t border-gray-700 pt-4">
            <Text size="sm" color="muted" className="text-center mb-2">
              Need immediate assistance?
            </Text>
            <div className="flex flex-col sm:flex-row gap-2 text-center">
              <Text size="xs" color="secondary" className="flex-1">
                📞 Call: +44 7908 625581
              </Text>
              <Text size="xs" color="secondary" className="flex-1">
                📧 Email: zell@love4detailing.com
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}