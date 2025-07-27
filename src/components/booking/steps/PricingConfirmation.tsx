'use client'

import { useState, useEffect } from 'react'
import { BookingFlowData } from '@/lib/utils/booking-types'
import { Button } from '@/components/ui/primitives/Button'
import { ChevronLeftIcon, CheckCircleIcon, CreditCardIcon, LoaderIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PricingConfirmationProps {
  bookingData: BookingFlowData
  updateBookingData: (updates: Partial<BookingFlowData>) => void
  onPrev: () => void
}

export function PricingConfirmation({ 
  bookingData, 
  updateBookingData, 
  onPrev
}: PricingConfirmationProps) {
  const router = useRouter()
  const [pricingCalculation, setPricingCalculation] = useState<{
    summary: {
      totalPrice: number
      totalDistanceSurcharge: number
      calculations: Array<{
        serviceName: string
        totalPrice: number
      }>
    }
  } | null>(null)
  const [customerNotes, setCustomerNotes] = useState(bookingData.customerNotes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalculatingPricing, setIsCalculatingPricing] = useState(false)

  // Calculate pricing when component mounts
  useEffect(() => {
    const calculatePricing = async () => {
      if (!bookingData.selectedServices || 
          !bookingData.vehicleDetails?.size_id || 
          !bookingData.addressDetails?.postcode) {
        return
      }

      setIsCalculatingPricing(true)
      try {
        const response = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceIds: bookingData.selectedServices,
            vehicleSizeId: bookingData.vehicleDetails.size_id,
            customPostcode: bookingData.addressDetails.postcode
          })
        })

        const data = await response.json()
        if (data.success) {
          setPricingCalculation(data.data)
          updateBookingData({ pricingCalculation: data.data })
        }
      } catch (error) {
        console.error('Failed to calculate pricing:', error)
      } finally {
        setIsCalculatingPricing(false)
      }
    }

    calculatePricing()
  }, [bookingData.selectedServices, bookingData.vehicleDetails?.size_id, bookingData.addressDetails?.postcode, updateBookingData])

  const handleSubmit = async () => {
    if (!bookingData.selectedServices || 
        !bookingData.vehicleDetails || 
        !bookingData.addressDetails ||
        !bookingData.selectedDate ||
        !bookingData.selectedTimeSlot) {
      return
    }

    setIsSubmitting(true)
    try {
      const bookingPayload = {
        services: bookingData.selectedServices,
        vehicle: {
          size_id: bookingData.vehicleDetails.size_id,
          make: bookingData.vehicleDetails.make,
          model: bookingData.vehicleDetails.model,
          year: bookingData.vehicleDetails.year,
          color: bookingData.vehicleDetails.color,
          license_plate: bookingData.vehicleDetails.registration,
          notes: bookingData.vehicleDetails.notes,
        },
        address: {
          name: bookingData.addressDetails.name || 'Service Address',
          address_line_1: bookingData.addressDetails.address_line_1,
          address_line_2: bookingData.addressDetails.address_line_2,
          city: bookingData.addressDetails.city,
          postcode: bookingData.addressDetails.postcode,
        },
        scheduled_date: bookingData.selectedDate,
        time_slot_id: 'temp-slot-id', // This would be the actual slot ID
        special_instructions: customerNotes,
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      })

      const data = await response.json()
      if (data.success) {
        // Redirect to success page
        router.push(`/booking-success?booking=${data.data.booking_reference}`)
      } else {
        console.error('Booking failed:', data.error)
        // Handle error appropriately
      }
    } catch (error) {
      console.error('Failed to create booking:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format time display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Review & Confirm
        </h2>
        <p className="text-[var(--text-secondary)] text-lg">
          Please review your booking details before confirming
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services */}
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              Selected Services
            </h3>
            <div className="space-y-3">
              {bookingData.selectedServices?.map((serviceId, index) => (
                <div key={serviceId} className="flex items-center justify-between p-3 bg-[var(--surface-tertiary)] rounded-lg">
                  <span className="text-[var(--text-primary)]">Service {index + 1}</span>
                  <span className="text-[var(--primary)] font-semibold">£--</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              Vehicle Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--text-secondary)]">Make & Model:</span>
                <p className="text-[var(--text-primary)] font-medium">
                  {bookingData.vehicleDetails?.make} {bookingData.vehicleDetails?.model}
                </p>
              </div>
              {bookingData.vehicleDetails?.year && (
                <div>
                  <span className="text-[var(--text-secondary)]">Year:</span>
                  <p className="text-[var(--text-primary)] font-medium">{bookingData.vehicleDetails.year}</p>
                </div>
              )}
              {bookingData.vehicleDetails?.color && (
                <div>
                  <span className="text-[var(--text-secondary)]">Color:</span>
                  <p className="text-[var(--text-primary)] font-medium">{bookingData.vehicleDetails.color}</p>
                </div>
              )}
              {bookingData.vehicleDetails?.registration && (
                <div>
                  <span className="text-[var(--text-secondary)]">License Plate:</span>
                  <p className="text-[var(--text-primary)] font-medium">
                    {bookingData.vehicleDetails.registration}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Service Address */}
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              Service Address
            </h3>
            <div className="text-[var(--text-primary)]">
              <p>{bookingData.addressDetails?.address_line_1}</p>
              {bookingData.addressDetails?.address_line_2 && (
                <p>{bookingData.addressDetails.address_line_2}</p>
              )}
              <p>{bookingData.addressDetails?.city}, {bookingData.addressDetails?.postcode}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              Appointment Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[var(--text-secondary)]">Date:</span>
                <p className="text-[var(--text-primary)] font-medium">
                  {bookingData.selectedDate && new Date(bookingData.selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Time:</span>
                <p className="text-[var(--text-primary)] font-medium">
                  {bookingData.selectedTimeSlot?.start_time && formatTime(bookingData.selectedTimeSlot.start_time)}
                </p>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              Special Instructions
            </h3>
            <textarea
              value={customerNotes}
              onChange={(e) => {
                setCustomerNotes(e.target.value)
                updateBookingData({ customerNotes: e.target.value })
              }}
              placeholder="Any special requirements, access instructions, or notes for our team..."
              rows={4}
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="space-y-6">
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border-2 border-[var(--border-accent)]">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
              Pricing Summary
            </h3>

            {isCalculatingPricing ? (
              <div className="flex items-center justify-center py-8">
                <LoaderIcon className="w-6 h-6 animate-spin text-[var(--primary)]" />
                <span className="ml-2 text-[var(--text-secondary)]">Calculating...</span>
              </div>
            ) : pricingCalculation ? (
              <div className="space-y-4">
                {/* Services Breakdown */}
                {pricingCalculation.summary?.calculations?.map((calc, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">{calc.serviceName}</span>
                    <span className="font-medium text-[var(--text-primary)]">£{calc.totalPrice}</span>
                  </div>
                ))}

                <div className="border-t border-[var(--border-secondary)] pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Subtotal</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      £{pricingCalculation.summary?.totalPrice - pricingCalculation.summary?.totalDistanceSurcharge || 0}
                    </span>
                  </div>
                  
                  {pricingCalculation.summary?.totalDistanceSurcharge > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Travel Surcharge</span>
                      <span className="font-medium text-[var(--text-primary)]">
                        £{pricingCalculation.summary.totalDistanceSurcharge}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--border-primary)] pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-[var(--text-primary)]">Total</span>
                    <span className="text-2xl font-bold text-[var(--primary)]">
                      £{pricingCalculation.summary?.totalPrice || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-[var(--text-muted)]">
                Unable to calculate pricing
              </div>
            )}

            {/* Payment Info */}
            <div className="mt-6 p-4 bg-[var(--info-bg)] border border-[var(--info)] rounded-md">
              <div className="flex items-start gap-3">
                <CreditCardIcon className="w-5 h-5 text-[var(--info)] mt-0.5" />
                <div>
                  <p className="text-[var(--info)] text-sm font-medium mb-1">
                    Payment on Completion
                  </p>
                  <p className="text-[var(--info)] text-xs">
                    Payment is due after service completion. We accept cash, card, and bank transfer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
            <h4 className="font-semibold text-[var(--text-primary)] mb-3">
              Terms & Conditions
            </h4>
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <p>• 24-hour cancellation policy applies</p>
              <p>• Access to water and power required</p>
              <p>• Weather-dependent service</p>
              <p>• Final pricing confirmed on-site</p>
            </div>
            <div className="mt-4">
              <label className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-[var(--primary)] border border-[var(--border-primary)] rounded focus:ring-[var(--primary)]"
                  required
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  I agree to the <a href="/terms" className="text-[var(--text-link)] hover:text-[var(--text-link-hover)]">terms and conditions</a>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          onClick={onPrev}
          variant="outline"
          className="flex items-center gap-2"
          size="lg"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Time Selection
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !pricingCalculation}
          className="flex items-center gap-2"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <LoaderIcon className="w-4 h-4 animate-spin" />
              Creating Booking...
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-4 h-4" />
              Confirm Booking
            </>
          )}
        </Button>
      </div>
    </div>
  )
}