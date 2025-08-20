'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { 
  CheckCircle, 
  AlertCircle,
  Calendar, 
  ArrowRight,
  Home
} from 'lucide-react'

interface PaymentCompleteContentProps {}

function PaymentCompleteContent({}: PaymentCompleteContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingRef = (searchParams?.get('ref') || '') as string
  const status = (searchParams?.get('status') || '') as string
  const [isUpdating, setIsUpdating] = useState(true)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const updateBookingStatus = async () => {
      if (!bookingRef) {
        setError('No booking reference provided')
        setIsUpdating(false)
        return
      }

      try {
        // Attempt to mark the booking as paid
        // We'll need to create an API endpoint for this
        const response = await fetch('/api/booking/payment-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingReference: bookingRef,
            paymentStatus: status === 'success' ? 'paid' : 'pending'
          })
        })

        const data = await response.json()
        
        if (data.success) {
          setUpdateSuccess(true)
        } else {
          setError(data.error?.message || 'Failed to update booking status')
        }
      } catch (err) {
        console.error('Payment status update error:', err)
        setError('Failed to update payment status')
      } finally {
        setIsUpdating(false)
      }
    }

    if (bookingRef) {
      updateBookingStatus()
    } else {
      setIsUpdating(false)
    }
  }, [bookingRef, status])

  if (isUpdating) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Processing Payment
            </h1>
            <p className="text-text-secondary">
              We're updating your booking status...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Update Required
            </h1>
            <p className="text-text-secondary mb-6">
              {error}. Please contact us to confirm your payment.
            </p>
            <div className="space-y-3">
              <Link href="/dashboard/bookings">
                <Button className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  View My Bookings
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
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

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Payment Complete!
          </h1>
          <p className="text-text-secondary mb-6">
            Thank you for your payment. Your booking has been confirmed and you'll receive an email confirmation shortly.
          </p>
          
          {bookingRef && (
            <div className="bg-surface-secondary rounded-lg p-4 mb-6">
              <p className="text-sm text-text-secondary mb-1">Booking Reference</p>
              <p className="font-mono font-semibold text-brand-600">
                {bookingRef}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <Link href={`/booking/success?ref=${bookingRef}`}>
              <Button className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                View Booking Details
              </Button>
            </Link>
            <Link href="/dashboard/bookings">
              <Button variant="outline" className="w-full">
                <ArrowRight className="w-4 h-4 mr-2" />
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

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <PaymentCompleteContent />
    </Suspense>
  )
}