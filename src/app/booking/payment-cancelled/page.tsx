'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { 
  XCircle, 
  Calendar, 
  ArrowLeft,
  Home,
  CreditCard
} from 'lucide-react'

function PaymentCancelledContent() {
  const searchParams = useSearchParams()
  const bookingRef = (searchParams?.get('ref') || '') as string

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-orange-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Payment Cancelled
          </h1>
          <p className="text-text-secondary mb-6">
            Your payment was cancelled. Your booking is still pending payment and will be automatically cancelled if payment is not completed within 48 hours.
          </p>
          
          {bookingRef && (
            <div className="bg-surface-secondary rounded-lg p-4 mb-6">
              <p className="text-sm text-text-secondary mb-1">Booking Reference</p>
              <p className="font-mono font-semibold text-orange-600">
                {bookingRef}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Payment still required to confirm booking
              </p>
            </div>
          )}
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-orange-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Check your email for the PayPal payment link</li>
              <li>• Complete payment within 48 hours</li>
              <li>• Your booking will be confirmed once paid</li>
              <li>• Unpaid bookings are automatically cancelled</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Try Payment Again
            </Button>
            <Link href={`/booking/success?ref=${bookingRef}`}>
              <Button variant="outline" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                View Booking Details
              </Button>
            </Link>
            <Link href="/dashboard/bookings">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                My Bookings
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <PaymentCancelledContent />
    </Suspense>
  )
}