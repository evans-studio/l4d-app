'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingFlowStore, useBookingStep } from '@/lib/store/bookingFlowStore'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { PasswordSetupModal } from '@/components/auth/PasswordSetupModal'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/composites/Modal'
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
  Receipt,
  ArrowRight
} from 'lucide-react'
import { formatDate, formatTime, getSlotStartTime, calculateEndTime } from '@/lib/utils/date-formatting'

export function PricingConfirmation() {
  const router = useRouter()
  const {
    formData,
    calculatedPrice,
    isSubmitting,
    error,
    submitBooking,
    previousStep,
    resetFlow,
    setUserData
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
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // Check authentication status and auto-populate user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user')
        const data = await response.json()
        
        if (data.success && data.data?.authenticated) {
          const user = data.data.user
          
          // Verify email is confirmed
          if (!user.email_verified) {
            // This shouldn't happen since booking page checks, but handle gracefully
            router.push('/auth/verify-email?reason=booking')
            return
          }
          
          setIsAuthenticated(true)
          
          // Auto-populate user data if not already set
          if (!formData.user && user) {
            setUserData({
              email: user.email || '',
              phone: user.phone || '',
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
              isExistingUser: true,
              userId: user.id
            })
          }
        } else {
          // User is not authenticated - this is now expected for new users
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
        // Don't redirect - allow unauthenticated users to continue
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleConfirmBooking = async () => {
    setIsProcessing(true)
    
    try {
      const result = await submitBooking()
      
      const bookingData = {
        success: true,
        confirmationNumber: result.confirmationNumber,
        bookingId: result.bookingId,
        isNewUser: !isAuthenticated // Track if this was a new user
      }
      setBookingResult(bookingData)
      
      if (!isAuthenticated) {
        // For new users, show verification message instead of redirecting
      } else {
        // Redirect existing users to booking success page
        router.push(`/booking/success?ref=${result.confirmationNumber}`)
      }
    } catch (error) {
      console.error('❌ Booking submission failed:', error)
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

  // Helper to get proper time values from slot data
  const getSlotTimes = () => {
    if (!formData.slot) return { startTime: '', endTime: '' }
    
    const startTime = getSlotStartTime(formData.slot)
    let endTime = formData.slot.endTime || ''
    
    // If no endTime, calculate it from duration
    if (!endTime && startTime && formData.service?.duration) {
      endTime = calculateEndTime(startTime, formData.service.duration)
    }
    
    return { startTime, endTime }
  }

  if (!isCurrentStep) {
    return <div></div>
  }

  // Show success screen after booking confirmation
  if (bookingResult?.success) {
    const isNewUser = (bookingResult as any)?.isNewUser
    
    return (
      <div className="space-y-8 text-center">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            {isNewUser ? 'Account Created & Booking Confirmed!' : 'Booking Confirmed!'}
          </h2>
          <p className="text-text-secondary text-lg">
            {isNewUser 
              ? 'Your account has been created and your detailing service has been booked'
              : 'Your detailing service has been successfully booked'
            }
          </p>
          {isNewUser && (
            <div className="mt-4 p-4 bg-brand-600/10 border border-brand-400/30 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-brand-700 mb-2">
                <MailIcon className="w-5 h-5" />
                <span className="font-medium">Email Verification Required</span>
              </div>
              <p className="text-sm text-brand-600">
                Please check your email and click the verification link to activate your account and access your dashboard.
              </p>
            </div>
          )}
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
                    {formData.slot ? formatDate(formData.slot.slot_date) : 'Date not available'}
                  </p>
                  <p className="text-text-secondary">
                    {(() => {
                      const { startTime, endTime } = getSlotTimes()
                      return `${formatTime(startTime)} - ${formatTime(endTime)}`
                    })()}
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
                    £{calculatedPrice?.finalPrice || '0'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PayPal Payment Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white rounded-lg p-3">
              <CreditCardIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-bold text-blue-900 text-lg mb-2">💳 Payment Required</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Complete your payment within 48 hours to secure your booking and confirm your appointment.
                </p>
              </div>
              
              <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-900 font-medium">Amount Due:</span>
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold">
                    £{calculatedPrice?.finalPrice || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-900 font-medium">Payment Deadline:</span>
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    48 Hours
                  </span>
                </div>
                <div className="text-blue-800 text-sm space-y-2">
                  <p className="font-medium">📧 Check your email for:</p>
                  <div className="ml-4 space-y-1">
                    <p>• Secure PayPal payment link</p>
                    <p>• Complete booking confirmation</p>
                    <p>• Service details and timeline</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-blue-800 text-sm space-y-1 text-left">
            {isNewUser ? (
              <>
                <li>• <span className="font-medium">Email Verification:</span> Check your email and click the verification link to activate your account</li>
                <li>• <span className="font-medium">Payment Link:</span> You'll receive a secure PayPal payment link in your confirmation email</li>
                <li>• <span className="font-medium">Complete Payment:</span> Pay within 48 hours to confirm your booking</li>
                <li>• <span className="font-medium">Service Reminder:</span> We'll send you a reminder 24 hours before your appointment</li>
                <li>• <span className="font-medium">Professional Service:</span> Our team will arrive at your location at the scheduled time</li>
              </>
            ) : (
              <>
                <li>• <span className="font-medium">Confirmation Email:</span> You'll receive your booking confirmation with PayPal payment link shortly</li>
                <li>• <span className="font-medium">Secure Payment:</span> Complete payment within 48 hours using the PayPal link</li>
                <li>• <span className="font-medium">Service Reminder:</span> We'll send you a reminder 24 hours before your appointment</li>
                <li>• <span className="font-medium">Professional Service:</span> Our team will arrive at your location at the scheduled time</li>
                <li>• <span className="font-medium">Account Access:</span> Your dashboard is ready - manage bookings anytime</li>
              </>
            )}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isNewUser ? (
            <>
              <Button
                onClick={() => window.location.href = '/'}
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Back to Home
              </Button>
              <Button
                onClick={() => router.push('/auth/login')}
                variant="outline"
                size="lg"
                rightIcon={<UserIcon className="w-4 h-4" />}
              >
                Sign In (After Verification)
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="text-center pt-6">
          <p className="text-text-secondary text-sm mb-2">Need to make changes?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a href="tel:+447908625581" className="flex items-center gap-2 text-brand-400 hover:text-brand-300">
              <PhoneIcon className="w-4 h-4" />
              07908 625581
            </a>
            <a href="mailto:zell@love4detailing.com" className="flex items-center gap-2 text-brand-400 hover:text-brand-300">
              <MailIcon className="w-4 h-4" />
              zell@love4detailing.com
            </a>
          </div>
        </div>

        {/* Password setup no longer needed - users must register first */}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center px-4 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">
          Review & Confirm
        </h2>
        <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto">
          Please review your booking details before confirming
        </p>
      </div>

      {/* Booking Summary */}
      <div className="px-4 sm:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Service Details */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <h3 className="text-xl font-semibold text-text-primary flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-brand-400" />
                Service
              </h3>
            </CardHeader>
            <CardContent className="pt-0 pb-6">
              {formData.service && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-text-primary text-lg mb-3">{formData.service.name}</h4>
                    <div className="space-y-2">
                      <p className="text-base text-text-secondary">
                        Duration: ~{Math.round(formData.service.duration / 60)} hours
                      </p>
                      <p className="text-base text-text-secondary">
                        Base Price: £{formData.service.basePrice}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact & Vehicle */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <h3 className="text-xl font-semibold text-text-primary flex items-center gap-3">
                <UserIcon className="w-6 h-6 text-brand-400" />
                Details
              </h3>
            </CardHeader>
            <CardContent className="pt-0 pb-6">
              <div className="space-y-5">
                {formData.user && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-text-primary text-lg">{formData.user.name}</h4>
                    <p className="text-base text-text-secondary">{formData.user.email}</p>
                    <p className="text-base text-text-secondary">{formData.user.phone}</p>
                  </div>
                )}
                
                {formData.vehicle && (
                  <div className="pt-4 border-t border-border-secondary space-y-3">
                    <div className="flex items-start gap-3">
                      <CarIcon className="w-5 h-5 text-brand-400 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="font-semibold text-text-primary text-lg">
                          {formData.vehicle.year} {formData.vehicle.make} {formData.vehicle.model}
                        </h4>
                        <p className="text-base text-text-secondary">
                          Size: {formData.vehicle.size} • Color: {formData.vehicle.color}
                        </p>
                        {formData.vehicle.registration && (
                          <p className="text-base text-text-secondary">
                            Registration: {formData.vehicle.registration}
                          </p>
                        )}
                      </div>
                    </div>
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
                      {formatDate(formData.slot.slot_date)}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-brand-400" />
                    <p className="text-sm text-text-secondary">
                      {(() => {
                        const { startTime, endTime } = getSlotTimes()
                        return `${formatTime(startTime)} - ${formatTime(endTime)}`
                      })()}
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
      </div>

      {/* Pricing Breakdown */}
      <div className="px-4 sm:px-0">
        {calculatedPrice ? (
          <Card>
            <CardHeader className="pb-6">
              <h3 className="text-xl font-semibold text-text-primary flex items-center gap-3">
                <Receipt className="w-6 h-6 text-brand-400" />
                Pricing Breakdown
              </h3>
            </CardHeader>
            <CardContent className="pt-0 pb-6">
              <div className="space-y-6">
                {/* Service Price Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-2">
                    <span className="text-sm sm:text-base text-text-secondary leading-snug">
                      {formData.service?.name} ({formData.vehicle?.size || 'Vehicle Size'})
                    </span>
                    <span className="text-base text-text-primary font-medium">£{calculatedPrice.servicePrice || calculatedPrice.basePrice || '0'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-t border-border-secondary">
                    <span className="text-base font-semibold text-text-primary">Service Subtotal</span>
                    <span className="text-base font-semibold text-text-primary">£{calculatedPrice.servicePrice || calculatedPrice.basePrice || '0'}</span>
                  </div>
                </div>
                
                {/* Travel Surcharge Section */}
                <div className="border-t border-border-secondary pt-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Calculator className="w-5 h-5 text-brand-400" />
                    <h4 className="font-semibold text-text-primary text-lg">Travel Information</h4>
                  </div>
                  
                  {(calculatedPrice.travelDistance || (calculatedPrice.breakdown as any)?.breakdown?.travel?.distance) && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-base text-text-secondary">Distance from SW9</span>
                      <span className="text-base text-text-primary font-medium">{calculatedPrice.travelDistance || (calculatedPrice.breakdown as any)?.breakdown?.travel?.distance || '0'} miles</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-2">
                    <span className="text-sm sm:text-base text-text-secondary leading-snug">
                      Travel Surcharge {(calculatedPrice.withinFreeRadius || (calculatedPrice.breakdown as any)?.breakdown?.travel?.withinFreeRadius) ? '(Within 17.5 miles)' : '(Beyond 17.5 miles)'}
                    </span>
                    <span className={`text-base font-semibold ${
                      (calculatedPrice.withinFreeRadius || (calculatedPrice.breakdown as any)?.breakdown?.travel?.withinFreeRadius) ? 'text-green-600' : 'text-text-primary'
                    }`}>
                      {(calculatedPrice.withinFreeRadius || (calculatedPrice.breakdown as any)?.breakdown?.travel?.withinFreeRadius) ? 'FREE' : `£${calculatedPrice.travelSurcharge || (calculatedPrice.breakdown as any)?.breakdown?.travel?.surcharge || '0'}`}
                    </span>
                  </div>
                  
                  {!(calculatedPrice.withinFreeRadius || (calculatedPrice.breakdown as any)?.breakdown?.travel?.withinFreeRadius) && (
                    <div className="text-sm text-text-muted mt-2">
                      £0.50 per mile beyond free radius
                    </div>
                  )}
                </div>
                
                {/* Total Section */}
                <div className="border-t-2 border-brand-200 pt-6">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xl font-bold text-text-primary">Total Price</span>
                    <span className="text-2xl font-bold text-brand-400">£{(() => {
                      // Try multiple ways to get the total price
                      const servicePrice = calculatedPrice.servicePrice || calculatedPrice.basePrice || 0
                      const travelSurcharge = calculatedPrice.travelSurcharge || 0
                      const calculatedTotal = servicePrice + travelSurcharge
                      
                      const finalPrice = calculatedPrice.finalPrice || 
                                      (calculatedPrice.breakdown as any)?.totalPrice ||
                                      (calculatedPrice.breakdown as any)?.breakdown?.total ||
                                      calculatedTotal ||
                                      '0'
                      
                      console.log('🔍 Total Price Display:', {
                        'calculatedPrice.finalPrice': calculatedPrice.finalPrice,
                        'calculatedPrice.breakdown?.totalPrice': (calculatedPrice.breakdown as any)?.totalPrice,
                        'calculatedPrice.breakdown?.breakdown?.total': (calculatedPrice.breakdown as any)?.breakdown?.total,
                        'servicePrice': servicePrice,
                        'travelSurcharge': travelSurcharge,
                        'calculatedTotal': calculatedTotal,
                        'final displayed value': finalPrice
                      })
                      return finalPrice
                    })()}</span>
                  </div>
                  <div className="text-sm text-text-muted text-right mt-2">
                    <strong className="text-red-600">Important:</strong> You must complete payment within 48 hours to secure your booking. Your appointment will be automatically cancelled if payment is not received by the deadline.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-6">
              <h3 className="text-xl font-semibold text-text-primary flex items-center gap-3">
                <Receipt className="w-6 h-6 text-brand-400" />
                Pricing Breakdown
              </h3>
            </CardHeader>
            <CardContent className="pt-0 pb-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-text-secondary">Calculating pricing...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>


      {/* Error Display */}
      <div className="px-4 sm:px-0">
        {(error || bookingResult?.success === false) && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <AlertCircleIcon className="w-6 h-6 text-red-600" />
                <p className="text-red-600 text-base">
                  {error || 'Failed to confirm booking. Please try again or contact us for assistance.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation - Mobile-first responsive design */}
      <div className="px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center pt-8">
        {/* Back button - first on mobile, left on desktop */}
        <Button
          variant="outline"
          onClick={previousStep}
          disabled={isProcessing || isSubmitting}
          leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
          size="lg"
          fullWidth={true}
          className="sm:w-auto order-2 sm:order-1"
          >
          Back
        </Button>
        
        {/* Confirm button - second on mobile, right on desktop */}
        <Button
          onClick={handleConfirmBooking}
          disabled={isProcessing || isSubmitting}
          size="lg"
          fullWidth={true}
          className="sm:w-auto sm:min-w-[200px] order-1 sm:order-2"
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

      {/* Auth modal no longer needed - users must be authenticated to reach this step */}
    </div>
  )
}