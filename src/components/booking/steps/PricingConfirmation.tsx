'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingFlowStore, useBookingStep } from '@/lib/store/bookingFlowStore'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { PasswordSetupModal } from '@/components/auth/PasswordSetupModal'
import { 
  ChevronLeftIcon, 
  CheckCircleIcon, 
  CalendarIcon, 
  ClockIcon, 
  CarIcon, 
  UserIcon, 
  MapPinIcon,
  CreditCardIcon,
  LoaderIcon,
  AlertCircleIcon,
  PhoneIcon,
  MailIcon,
  Calculator,
  Receipt
} from 'lucide-react'
import { format } from 'date-fns'

export function PricingConfirmation() {
  const router = useRouter()
  const {
    formData,
    calculatedPrice,
    isSubmitting,
    error,
    submitBooking,
    previousStep,
    resetFlow
  } = useBookingFlowStore()

  const { isCurrentStep } = useBookingStep(6)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookingResult, setBookingResult] = useState<{
    success: boolean
    confirmationNumber?: string
    bookingId?: string
    requiresPassword?: boolean
    passwordSetupToken?: string
  } | null>(null)
  
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const handleConfirmBooking = async () => {
    setIsProcessing(true)
    
    try {
      const result = await submitBooking()
      const bookingData = {
        success: true,
        confirmationNumber: result.confirmationNumber,
        bookingId: result.bookingId,
        requiresPassword: result.requiresPassword,
        passwordSetupToken: result.passwordSetupToken
      }
      setBookingResult(bookingData)
      
      // Show password modal immediately if password setup is required
      if (result.requiresPassword && result.passwordSetupToken) {
        setShowPasswordModal(true)
      }
    } catch (error) {
      setBookingResult({
        success: false
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartNewBooking = () => {
    resetFlow()
    router.push('/book')
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  const handlePasswordSetupSuccess = () => {
    setShowPasswordModal(false)
    // The modal will handle the redirect to dashboard
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy')
  }

  if (!isCurrentStep) {
    return <div></div>
  }

  // Show success screen after booking confirmation
  if (bookingResult?.success) {
    return (
      <div className="space-y-8 text-center">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-text-secondary text-lg">
            Your detailing service has been successfully booked
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center border-b border-border-secondary pb-4">
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  Confirmation Number
                </h3>
                <p className="text-2xl font-bold text-brand-400 font-mono">
                  {bookingResult.confirmationNumber}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <h4 className="font-medium text-text-primary mb-1">Service</h4>
                  <p className="text-text-secondary">{formData.service?.name}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-primary mb-1">Date & Time</h4>
                  <p className="text-text-secondary">
                    {formData.slot && formatDate(formData.slot.date)}
                  </p>
                  <p className="text-text-secondary">
                    {formData.slot && formatTime(formData.slot.startTime)} - {formData.slot && formatTime(formData.slot.endTime)}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-primary mb-1">Vehicle</h4>
                  <p className="text-text-secondary">
                    {formData.vehicle?.year} {formData.vehicle?.make} {formData.vehicle?.model}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-primary mb-1">Total Price</h4>
                  <p className="text-text-secondary font-semibold">
                    £{calculatedPrice?.finalPrice}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-blue-800 text-sm space-y-1 text-left">
            <li>• You&apos;ll receive a confirmation email shortly</li>
            <li>• We&apos;ll send you a reminder 24 hours before your appointment</li>
            <li>• Our team will arrive at your location at the scheduled time</li>
            {bookingResult.requiresPassword && !showPasswordModal && (
              <li>• Your account is ready - access your dashboard anytime</li>
            )}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleGoToDashboard}
            size="lg"
            rightIcon={<UserIcon className="w-4 h-4" />}
          >
            View Dashboard
          </Button>
          <Button
            onClick={handleStartNewBooking}
            variant="outline"
            size="lg"
          >
            Book Another Service
          </Button>
        </div>

        <div className="text-center pt-6">
          <p className="text-text-secondary text-sm mb-2">Need to make changes?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a href="tel:+447123456789" className="flex items-center gap-2 text-brand-400 hover:text-brand-300">
              <PhoneIcon className="w-4 h-4" />
              07123 456789
            </a>
            <a href="mailto:info@love4detailing.co.uk" className="flex items-center gap-2 text-brand-400 hover:text-brand-300">
              <MailIcon className="w-4 h-4" />
              info@love4detailing.co.uk
            </a>
          </div>
        </div>

        {/* Password Setup Modal */}
        {showPasswordModal && bookingResult.passwordSetupToken && formData.user && (
          <PasswordSetupModal
            isOpen={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
            passwordSetupToken={bookingResult.passwordSetupToken}
            userEmail={formData.user.email}
            onSuccess={handlePasswordSetupSuccess}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          Review & Confirm
        </h2>
        <p className="text-text-secondary text-lg">
          Please review your booking details before confirming
        </p>
      </div>

      {/* Booking Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Details */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-brand-400" />
              Service
            </h3>
          </CardHeader>
          <CardContent>
            {formData.service && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-text-primary">{formData.service.name}</h4>
                  <p className="text-sm text-text-secondary">
                    Duration: ~{Math.round(formData.service.duration / 60)} hours
                  </p>
                  <p className="text-sm text-text-secondary">
                    Base Price: £{formData.service.basePrice}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact & Vehicle */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-brand-400" />
              Details
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.user && (
                <div>
                  <h4 className="font-medium text-text-primary">{formData.user.name}</h4>
                  <p className="text-sm text-text-secondary">{formData.user.email}</p>
                  <p className="text-sm text-text-secondary">{formData.user.phone}</p>
                </div>
              )}
              
              {formData.vehicle && (
                <div className="pt-2 border-t border-border-secondary">
                  <div className="flex items-center gap-2 mb-1">
                    <CarIcon className="w-4 h-4 text-brand-400" />
                    <h4 className="font-medium text-text-primary">
                      {formData.vehicle.year} {formData.vehicle.make} {formData.vehicle.model}
                    </h4>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Size: {formData.vehicle.size} • Color: {formData.vehicle.color}
                  </p>
                  {formData.vehicle.registration && (
                    <p className="text-sm text-text-secondary">
                      Reg: {formData.vehicle.registration}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Location */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-brand-400" />
              Schedule
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.slot && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon className="w-4 h-4 text-brand-400" />
                    <h4 className="font-medium text-text-primary">
                      {formatDate(formData.slot.date)}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-brand-400" />
                    <p className="text-sm text-text-secondary">
                      {formatTime(formData.slot.startTime)} - {formatTime(formData.slot.endTime)}
                    </p>
                  </div>
                </div>
              )}
              
              {formData.address && (
                <div className="pt-2 border-t border-border-secondary">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPinIcon className="w-4 h-4 text-brand-400" />
                    <h4 className="font-medium text-text-primary">Service Location</h4>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {formData.address.addressLine1}<br />
                    {formData.address.addressLine2 && <>{formData.address.addressLine2}<br /></>}
                    {formData.address.city}, {formData.address.postcode}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Breakdown */}
      {calculatedPrice && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand-400" />
              Pricing Breakdown
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Service Price Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">
                    {formData.service?.name} ({formData.vehicleDetails?.size || 'Vehicle Size'})
                  </span>
                  <span className="text-text-primary">£{calculatedPrice.servicePrice}</span>
                </div>
                
                <div className="flex justify-between items-center font-medium">
                  <span className="text-text-primary">Service Subtotal</span>
                  <span className="text-text-primary">£{calculatedPrice.servicePrice}</span>
                </div>
              </div>
              
              {/* Travel Surcharge Section */}
              <div className="border-t border-border-secondary pt-3 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-brand-400" />
                  <h4 className="font-medium text-text-primary">Travel Information</h4>
                </div>
                
                {calculatedPrice.travelDistance && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Distance from SW9</span>
                    <span className="text-text-primary">{calculatedPrice.travelDistance} miles</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">
                    Travel Surcharge {calculatedPrice.withinFreeRadius ? '(Within 17.5 miles)' : '(Beyond 17.5 miles)'}
                  </span>
                  <span className={`font-medium ${
                    calculatedPrice.withinFreeRadius ? 'text-green-600' : 'text-text-primary'
                  }`}>
                    {calculatedPrice.withinFreeRadius ? 'FREE' : `£${calculatedPrice.travelSurcharge}`}
                  </span>
                </div>
                
                {!calculatedPrice.withinFreeRadius && (
                  <div className="text-xs text-text-muted">
                    £0.50 per mile beyond free radius
                  </div>
                )}
              </div>
              
              {/* Total Section */}
              <div className="border-t border-border-secondary pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-text-primary">Total Price</span>
                  <span className="text-2xl font-bold text-brand-400">£{calculatedPrice.finalPrice}</span>
                </div>
                <div className="text-xs text-text-muted mt-1 text-right">
                  Payment due on completion
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms and Payment Info */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h4 className="font-medium text-text-primary">Payment & Terms</h4>
            <div className="text-sm text-text-secondary space-y-2">
              <p>• Payment is due on completion of service</p>
              <p>• We accept cash, card, and bank transfer</p>
              <p>• Free cancellation up to 24 hours before your appointment</p>
              <p>• Our team will arrive within a 30-minute window of your scheduled time</p>
              <p>• All services include a 7-day satisfaction guarantee</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {(error || bookingResult?.success === false) && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircleIcon className="w-5 h-5 text-red-600" />
              <p className="text-red-600">
                {error || 'Failed to confirm booking. Please try again or contact us for assistance.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        {/* Mobile: Stacked */}
        <div className="sm:hidden space-y-3 pt-6 w-full">
          <Button
            onClick={handleConfirmBooking}
            disabled={isProcessing || isSubmitting}
            size="lg"
            fullWidth
            className="min-h-[48px]"
            rightIcon={
              (isProcessing || isSubmitting) ? 
                <LoaderIcon className="w-4 h-4 animate-spin" /> : 
                <CheckCircleIcon className="w-4 h-4" />
            }
          >
            {isProcessing || isSubmitting ? 'Confirming...' : 'Confirm Booking'}
          </Button>
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={isProcessing || isSubmitting}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
            fullWidth
            className="min-h-[48px]"
          >
            Back to Personal Details
          </Button>
        </div>
        
        {/* Desktop: Side by side */}
        <div className="hidden sm:flex justify-between items-center pt-6 w-full">
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={isProcessing || isSubmitting}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
          >
            Back to Personal Details
          </Button>
        
          <Button
            onClick={handleConfirmBooking}
            disabled={isProcessing || isSubmitting}
            size="lg"
            className="min-w-[200px]"
            rightIcon={
              (isProcessing || isSubmitting) ? 
                <LoaderIcon className="w-4 h-4 animate-spin" /> : 
                <CheckCircleIcon className="w-4 h-4" />
            }
          >
            {isProcessing || isSubmitting ? 'Confirming...' : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </div>
  )
}