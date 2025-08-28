export * from '../store/bookingFlowStore'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { BookingFlowData, PricingBreakdown, CustomerVehicle, CustomerAddress } from '@/lib/utils/booking-types'
import { Database } from '@/lib/db/database.types'
import { calculatePostcodeDistance } from '@/lib/utils/postcode-distance'
import { calculateBookingPrice, PriceBreakdown as EnhancedPriceBreakdown } from '@/lib/pricing/calculator'
import { logger } from '@/lib/utils/logger'

// Type aliases for database types  
type ServiceRow = Database['public']['Tables']['services']['Row']
type TimeSlotRow = Database['public']['Tables']['time_slots']['Row']

// Vehicle size is no longer from database, using hardcoded type
type VehicleSizeRow = {
  id: string
  name: string
  price_multiplier: number
  description?: string | null
  examples?: string[] | null
  display_order?: number | null
  is_active?: boolean | null
}

// Booking flow step types
export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6

export interface SlotSelection {
  slotId: string
  slot_date: string
  startTime: string
  endTime: string
  duration: number
}

export interface UserData {
  email: string
  phone: string
  name: string
  isExistingUser: boolean
  userId?: string
  password?: string // Optional password for new users
}

export interface VehicleData {
  make: string
  model: string
  year: number
  size: 'S' | 'M' | 'L' | 'XL' // Updated to match pricing calculator
  color?: string
  registration?: string
  notes?: string
}

export interface ServiceSelection {
  serviceId: string
  name: string
  description?: string
  basePrice: number
  duration: number
  category?: string
}

export interface AddressData {
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postcode: string // UK postcode for distance calculation
  isExisting?: boolean
  addressId?: string
}

export interface PriceCalculation {
  basePrice: number
  sizeMultiplier: number
  servicePrice: number // base price × size multiplier
  travelDistance?: number
  travelSurcharge: number
  finalPrice: number // service price + travel surcharge
  currency: string
  breakdown?: EnhancedPriceBreakdown
  withinFreeRadius?: boolean
}

// API response types following the PRD standard format
export interface ApiResponse<T = Record<string, unknown> | Array<Record<string, unknown>> | null> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
  }
  metadata?: {
    pagination?: {
      page?: number
      limit?: number
      total?: number
    }
    timestamp?: string
  }
}

export interface BookingResponse {
  bookingId: string
  confirmationNumber: string
  userId: string
  requiresPassword: boolean
  passwordSetupToken?: string
}

// Store state interface
interface BookingFlowState {
  // Current step (1-6)
  currentStep: BookingStep
  
  // Form data for each step
  formData: {
    slot: SlotSelection | null
    user: UserData | null
    vehicle: VehicleData | null
    service: ServiceSelection | null
    address: AddressData | null
  }
  
  // Calculated pricing
  calculatedPrice: PriceCalculation | null
  
  // User state
  isExistingUser: boolean
  isRebooking: boolean
  
  // Session management
  sessionTimestamp: number
  sessionExpiry: number // 30 minutes in milliseconds
  
  // Loading states
  isLoading: boolean
  isSubmitting: boolean
  
  // Error state
  error: string | null
  
  // Available data for selections
  availableSlots: TimeSlotRow[]
  availableServices: ServiceRow[]
  userVehicles: CustomerVehicle[]
  userAddresses: CustomerAddress[]
  vehicleSizes: VehicleSizeRow[]
  recentBookings: Array<{
    id: string
    booking_reference: string
    scheduled_date: string
    status: string
    total_price: number
    vehicle_details: { make?: string; model?: string; year?: number; size?: 'S' | 'M' | 'L' | 'XL'; color?: string; license_plate?: string } | null
    service_address: { address_line_1?: string; address_line_2?: string | null; city?: string; postal_code?: string } | null
    services: {
      id: string
      name: string
      short_description: string
      category: string
      base_price: number
      estimated_duration: number
    }
    time_slots: {
      id: string
      start_time: string
      end_time: string
    }
  }>
}

// Store actions interface
interface BookingFlowActions {
  // Step navigation
  setStep: (step: BookingStep) => void
  nextStep: () => void
  previousStep: () => void
  
  // Form data updates
  updateFormData: <K extends keyof BookingFlowState['formData']>(
    key: K, 
    value: BookingFlowState['formData'][K]
  ) => void
  
  // Specific field updates
  setSlotSelection: (slot: SlotSelection) => void
  setUserData: (user: UserData) => void
  setVehicleData: (vehicle: VehicleData) => void
  setServiceSelection: (service: ServiceSelection) => void
  setAddressData: (address: AddressData) => void
  
  // Pricing
  calculatePrice: () => Promise<void>
  
  // Data loading
  loadExistingUserData: (email: string, phone: string) => Promise<void>
  loadAvailableSlots: (date: string, serviceId: string, duration: number) => Promise<void>
  loadVehicleSizes: () => Promise<void>
  loadAvailableServices: () => Promise<void>
  
  // Utility functions
  getVehicleSizeId: (sizeLetter: 'S' | 'M' | 'L' | 'XL') => string | null
  
  // Rebooking
  initializeRebooking: (bookingId: string) => Promise<void>
  
  // Booking submission
  submitBooking: () => Promise<BookingResponse>
  
  // State management
  setLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
  resetFlow: () => void
  
  // Validation
  validateCurrentStep: () => boolean
  canProceedToNextStep: () => boolean
}

// Combined store type
type BookingFlowStore = BookingFlowState & BookingFlowActions

// Session expiry time: 30 minutes
const SESSION_EXPIRY_MS = 30 * 60 * 1000;

// Initial state
const initialState: BookingFlowState = {
  currentStep: 1,
  formData: {
    slot: null,
    user: null,
    vehicle: null,
    service: null,
    address: null,
  },
  calculatedPrice: null,
  isExistingUser: false,
  isRebooking: false,
  sessionTimestamp: Date.now(),
  sessionExpiry: SESSION_EXPIRY_MS,
  isLoading: false,
  isSubmitting: false,
  error: null,
  availableSlots: [],
  availableServices: [],
  userVehicles: [],
  userAddresses: [],
  vehicleSizes: [],
  recentBookings: [],
}

// Session utility functions
const isSessionExpired = (sessionTimestamp: number, sessionExpiry: number): boolean => {
  const now = Date.now();
  return (now - sessionTimestamp) > sessionExpiry;
};

// API utility functions
const apiCall = async <T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })
    
    
    
    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = `HTTP error! status: ${response.status}`
      try {
        const errorBody = await response.text()
        
        if (errorBody) {
          const parsedError = JSON.parse(errorBody)
          errorDetails = parsedError.error?.message || errorDetails
        }
      } catch (parseError) {
        
      }
      
      throw new Error(errorDetails)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network error occurred',
        code: 'NETWORK_ERROR'
      }
    }
  }
}

// Create the store
export const useBookingFlowStore = create<BookingFlowStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Step navigation
      setStep: (step: BookingStep) => {
        set({ currentStep: step, error: null })
      },
      
      nextStep: () => {
        const { currentStep, canProceedToNextStep } = get()
        if (canProceedToNextStep() && currentStep < 6) {
          set({ currentStep: (currentStep + 1) as BookingStep, error: null })
        }
      },
      
      previousStep: () => {
        const { currentStep } = get()
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as BookingStep, error: null })
        }
      },
      
      // Form data updates
      updateFormData: (key, value) => {
        set((state) => ({
          formData: {
            ...state.formData,
            [key]: value,
          },
          error: null,
        }))
      },
      
      // Specific field updates
      setSlotSelection: (slot) => {
        set((state) => ({
          formData: { ...state.formData, slot },
          error: null,
        }))
      },
      
      setUserData: (user) => {
        set((state) => ({
          formData: { ...state.formData, user },
          isExistingUser: user.isExistingUser,
          error: null,
        }))
      },
      
      setVehicleData: (vehicle) => {
        set((state) => ({
          formData: { ...state.formData, vehicle },
          error: null,
        }))
      },
      
      setServiceSelection: (service) => {
        set((state) => ({
          formData: { ...state.formData, service },
          error: null,
        }))
      },
      
      setAddressData: (address) => {
        set((state) => ({
          formData: { ...state.formData, address },
          error: null,
        }))
      },
      
      // Pricing calculation with travel surcharge integration
      calculatePrice: async () => {
        const { formData, setLoading, setError } = get()
        
        logger.debug('💰 Starting price calculation with data:', {
          service: formData.service ? {
            id: formData.service.serviceId,
            name: formData.service.name,
            basePrice: formData.service.basePrice
          } : null,
          vehicle: formData.vehicle ? {
            make: formData.vehicle.make,
            model: formData.vehicle.model,
            size: formData.vehicle.size
          } : null,
          address: formData.address ? {
            postcode: formData.address.postcode
          } : null
        })
        
        if (!formData.service || !formData.vehicle) {
          logger.error('❌ Missing required data for pricing')
          setError('Service and vehicle data required for pricing')
          return
        }
        
        setLoading(true)
        
        try {
          // If we have address data, use comprehensive pricing calculator
          if (formData.address && formData.address.postcode) {
            logger.debug('🏠 Using comprehensive pricing with address')
            
            const serviceDetails = {
              id: formData.service.serviceId,
              name: formData.service.name,
              basePrice: formData.service.basePrice,
              duration: formData.service.duration
            }
            
            const vehicleDetails = {
              make: formData.vehicle.make,
              model: formData.vehicle.model,
              year: formData.vehicle.year,
              size: formData.vehicle.size
            }
            
            const addressDetails = {
              addressLine1: formData.address.addressLine1,
              addressLine2: formData.address.addressLine2,
              city: formData.address.city,
              postcode: formData.address.postcode
            }
            
            logger.debug('🔄 Calling calculateBookingPrice with:', {
              serviceDetails,
              vehicleDetails,
              addressDetails
            })
            
            const priceBreakdown = await calculateBookingPrice(
              serviceDetails,
              vehicleDetails,
              addressDetails
            )
            
            logger.debug('📊 Price breakdown result:', priceBreakdown)
            
            // Convert to store format with fallback calculation
            const servicePrice = priceBreakdown.servicePrice || priceBreakdown.serviceBasePrice || 0
            const travelSurcharge = priceBreakdown.travelSurcharge || 0
            const fallbackFinalPrice = servicePrice + travelSurcharge
            
            const calculatedPrice: PriceCalculation = {
              basePrice: priceBreakdown.serviceBasePrice,
              sizeMultiplier: priceBreakdown.vehicleSizeMultiplier,
              servicePrice: servicePrice,
              travelDistance: priceBreakdown.travelDistance,
              travelSurcharge: travelSurcharge,
              finalPrice: priceBreakdown.totalPrice || fallbackFinalPrice,
              currency: 'GBP',
              breakdown: priceBreakdown,
              withinFreeRadius: priceBreakdown.breakdown.travel.withinFreeRadius
            }
            
            logger.debug('🔍 Store conversion details:', {
              'priceBreakdown.totalPrice': priceBreakdown.totalPrice,
              'fallbackFinalPrice': fallbackFinalPrice,
              'calculatedPrice.finalPrice': calculatedPrice.finalPrice,
              'servicePrice': servicePrice,
              'travelSurcharge': travelSurcharge
            })
            
            logger.debug('✅ Setting calculated price:', calculatedPrice)
            set({ calculatedPrice })
          } else {
            // Fallback to basic service pricing without address
            logger.debug('🔧 Using fallback pricing without address')
            
            const response = await apiCall<PriceCalculation>('/api/pricing/calculate', {
              method: 'POST',
              body: JSON.stringify({
                serviceId: formData.service.serviceId,
                vehicleSize: formData.vehicle.size, // Now sending size letter directly
              }),
            })
            
            logger.debug('📡 Fallback API response:', response)
            
            if (response.success && response.data) {
              logger.debug('✅ Setting fallback calculated price:', response.data)
              set({ calculatedPrice: response.data })
            } else {
              logger.error('❌ Fallback pricing failed:', response.error)
              setError(response.error?.message || 'Failed to calculate price')
            }
          }
        } catch (error) {
          logger.error('❌ Price calculation error:', error instanceof Error ? error : undefined)
          setError('Failed to calculate price')
        } finally {
          setLoading(false)
        }
      },
      
      // Load existing user data
      loadExistingUserData: async (email: string, phone: string) => {
        const { setLoading, setError } = get()
        setLoading(true)
        
        // Clear any previous user validation state before making new API call
        logger.debug('🔍 Starting user validation for:', { email, phone })
        set({
          isExistingUser: false,
          userVehicles: [],
          userAddresses: [],
          recentBookings: [],
          error: null
        })
        
        try {
          const response = await apiCall<{
            isExistingUser: boolean
            user?: {
              id: string
              email: string
              name: string
              phone: string
            }
            vehicles?: CustomerVehicle[]
            addresses?: CustomerAddress[]
            recentBookings?: Array<{
              id: string
              booking_reference: string
              scheduled_date: string
              status: string
              total_price: number
              vehicle_details: { make?: string; model?: string; year?: number; size?: 'S' | 'M' | 'L' | 'XL'; color?: string; license_plate?: string } | null
              service_address: { address_line_1?: string; address_line_2?: string | null; city?: string; postal_code?: string } | null
              services: {
                id: string
                name: string
                short_description: string
                category: string
                base_price: number
                estimated_duration: number
              }
              time_slots: {
                id: string
                start_time: string
                end_time: string
              }
            }>
          }>('/api/booking/validate-user', {
            method: 'POST',
            body: JSON.stringify({ email, phone }),
          })
          
          if (response.success && response.data) {
            logger.debug('✅ User validation API response:', response.data)
            logger.debug('📊 Setting isExistingUser to', { isExistingUser: response.data.isExistingUser })
            
            set({
              isExistingUser: response.data.isExistingUser,
              userVehicles: response.data.vehicles || [],
              userAddresses: response.data.addresses || [],
              recentBookings: response.data.recentBookings || [],
            })
            
            // Verify the state was set correctly
            const currentState = get()
            logger.debug('🔄 State after update - isExistingUser', { isExistingUser: currentState.isExistingUser })
          } else {
            logger.error('❌ User validation API failed:', response.error)
            setError(response.error?.message || 'Failed to validate user')
          }
        } catch (error) {
          logger.error('BookingFlowStore: loadExistingUserData error:', error instanceof Error ? error : undefined)
          
          // Enhanced error logging
          if (error instanceof Error) {
            logger.error('BookingFlowStore: Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            })
          }
          
          setError('Failed to validate user')
        } finally {
          setLoading(false)
        }
      },

      // Initialize rebooking from existing booking
      initializeRebooking: async (bookingId: string) => {
        const { setLoading, setError, resetFlow } = get()
        setLoading(true)
        
        try {
          // First reset the flow
          resetFlow()
          
          // Fetch the specific booking details
          const response = await apiCall<{
            id: string
            booking_reference: string
            scheduled_date: string
            total_price: number
            vehicle_details: { make?: string; model?: string; year?: number; size?: 'S' | 'M' | 'L' | 'XL'; color?: string; license_plate?: string } | null
            service_address: { address_line_1?: string; address_line_2?: string | null; city?: string; postal_code?: string; county?: string | null } | null
            customer: {
              id: string
              email: string
              first_name: string
              last_name: string
              phone: string
            }
            services: {
              id: string
              name: string
              short_description: string
              category: string
              base_price: number
              estimated_duration: number
            }
            time_slots: {
              id: string
              start_time: string
              end_time: string
            }
          }>(`/api/customer/bookings/${bookingId}`)
          
          if (response.success && response.data) {
            const booking = response.data
            
            // Pre-populate form data from previous booking
            const rebookingData: Partial<BookingFlowState['formData']> = {
              service: booking.services ? {
                serviceId: booking.services.id,
                name: booking.services.name,
                basePrice: booking.services.base_price,
                duration: booking.services.estimated_duration
              } : undefined,
              vehicle: booking.vehicle_details ? {
                make: booking.vehicle_details.make || '',
                model: booking.vehicle_details.model || '',
                year: booking.vehicle_details.year || new Date().getFullYear(),
                size: (booking.vehicle_details.size as 'S' | 'M' | 'L' | 'XL') || 'M',
                color: booking.vehicle_details.color || '',
                registration: booking.vehicle_details.license_plate || ''
              } : undefined,
              address: booking.service_address ? {
                addressLine1: booking.service_address.address_line_1 || '',
                addressLine2: booking.service_address.address_line_2 || '',
                city: booking.service_address.city || '',
                postcode: booking.service_address.postal_code || '',
                state: booking.service_address.county || ''
              } : undefined,
              user: {
                email: booking.customer.email,
                name: `${booking.customer.first_name} ${booking.customer.last_name}`.trim(),
                phone: booking.customer.phone,
                isExistingUser: true
              }
              // Note: Don't pre-populate slot as they'll need to select a new time
            }
            
            // Update the store with pre-populated data
            set({
              formData: { ...get().formData, ...rebookingData },
              isExistingUser: true,
              currentStep: 1, // Start from service step but data is pre-filled
              isRebooking: true
            })
            
            // Trigger price calculation if we have enough data
            if (rebookingData.service && rebookingData.vehicle && rebookingData.address) {
              get().calculatePrice()
            }
            
          } else {
            setError(response.error?.message || 'Failed to load booking details')
          }
        } catch (error) {
          setError('Failed to initialize rebooking')
        } finally {
          setLoading(false)
        }
      },
      
      // Load available slots using the real-time availability API
      loadAvailableSlots: async (date: string, serviceId: string, duration: number) => {
        const { setLoading, setError } = get()
        setLoading(true)
        
        try {
          // Use the time-slots availability API
          const response = await apiCall<TimeSlotRow[]>(`/api/time-slots/availability?date=${date}`)
          
          if (response.success && response.data) {
            // Filter slots that are available
            const availableSlots = response.data.filter(slot => slot.is_available)
            set({ availableSlots })
          } else {
            setError(response.error?.message || 'Failed to load available slots')
          }
        } catch (error) {
          setError('Failed to load available slots')
        } finally {
          setLoading(false)
        }
      },
      
      // Helper function - now deprecated but kept for compatibility
      getVehicleSizeId: (sizeLetter: 'S' | 'M' | 'L' | 'XL'): string | null => {
        // No longer using vehicle_sizes table, just return the size letter
        return sizeLetter
      },

      // Load vehicle sizes - now returns hardcoded categories (vehicle_sizes table removed)
      loadVehicleSizes: async () => {
        try {
          const response = await apiCall<VehicleSizeRow[]>('/api/services/vehicle-sizes')
          
          if (response.success && response.data) {
            set({ vehicleSizes: response.data })
          }
        } catch (error) {
          // Silent fail for vehicle sizes as they're now hardcoded
          logger.warn('Vehicle sizes API unavailable, using defaults')
        }
      },
      
      // Load available services
      loadAvailableServices: async () => {
        try {
          const response = await apiCall<ServiceRow[]>('/api/services')
          
          if (response.success && response.data) {
            set({ availableServices: response.data })
          }
        } catch (error) {
          // Silent fail for services as they might be cached
        }
      },
      
      // Submit booking
      submitBooking: async () => {
        const { formData, setSubmitting, setError } = get()
        
        // Validate all required data
        if (!formData.user || !formData.vehicle || !formData.service || !formData.address || !formData.slot) {
          setError('All booking information is required')
          throw new Error('Incomplete booking data')
        }
        
        setSubmitting(true)
        
        try {
          const response = await apiCall<BookingResponse>('/api/bookings/create', {
            method: 'POST',
            body: JSON.stringify({
              customer: {
                firstName: formData.user.name.split(' ')[0] || formData.user.name,
                lastName: formData.user.name.split(' ').slice(1).join(' ') || 'Customer',
                email: formData.user.email,
                phone: formData.user.phone,
                password: formData.user.password // Include password for new users
              },
              vehicle: {
                make: formData.vehicle.make,
                model: formData.vehicle.model,
                year: formData.vehicle.year,
                color: formData.vehicle.color || '',
                licenseNumber: formData.vehicle.registration,
                vehicleSize: formData.vehicle.size,
                notes: formData.vehicle.notes
              },
              address: {
                addressLine1: formData.address.addressLine1,
                addressLine2: formData.address.addressLine2 || '',
                city: formData.address.city,
                county: formData.address.state || '',
                postalCode: formData.address.postcode,
                country: 'United Kingdom'
              },
              services: [{
                serviceId: formData.service.serviceId,
                serviceName: formData.service.name,
                duration: formData.service.duration,
                basePrice: formData.service.basePrice
                // Vehicle size multiplier calculated dynamically by API based on service pricing
              }],
              timeSlot: {
                date: formData.slot.slot_date,
                startTime: formData.slot.startTime,
                endTime: formData.slot.endTime,
                slotId: formData.slot.slotId
              },
              specialRequests: '', // TODO: Add special requests field
              totalPrice: (() => {
                const calculatedPrice = get().calculatedPrice
                if (!calculatedPrice) return 0
                
                // Try multiple ways to get the total price
                const finalPrice = calculatedPrice.finalPrice
                const servicePrice = calculatedPrice.servicePrice || calculatedPrice.basePrice || 0
                const travelSurcharge = calculatedPrice.travelSurcharge || 0
                const fallbackTotal = servicePrice + travelSurcharge
                
                const totalPrice = finalPrice || fallbackTotal || 0
                
                logger.debug('🎯 Booking submission total price calculation:', {
                  'calculatedPrice.finalPrice': finalPrice,
                  'servicePrice': servicePrice,
                  'travelSurcharge': travelSurcharge,
                  'fallbackTotal': fallbackTotal,
                  'submitting totalPrice': totalPrice
                })
                
                return totalPrice
              })()
            }),
          })
          
          if (response.success && response.data) {
            // Map API response to expected format
            const apiData = response.data as unknown as {
              bookingId: string
              bookingReference: string
              customerId: string
              requiresPasswordSetup?: boolean
              passwordSetupToken?: string
            }
            return {
              bookingId: apiData.bookingId,
              confirmationNumber: apiData.bookingReference,
              userId: apiData.customerId,
              requiresPassword: apiData.requiresPasswordSetup || false,
              passwordSetupToken: apiData.passwordSetupToken || undefined
            }
          } else {
            const errorMessage = response.error?.message || 'Failed to create booking'
            setError(errorMessage)
            throw new Error(errorMessage)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create booking'
          setError(errorMessage)
          throw error
        } finally {
          setSubmitting(false)
        }
      },
      
      // State management
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setSubmitting: (submitting: boolean) => set({ isSubmitting: submitting }),
      setError: (error: string | null) => set({ error }),
      
      resetFlow: () => set({
        ...initialState,
        sessionTimestamp: Date.now(), // Refresh session timestamp on reset
      }),
      
      // Validation
      validateCurrentStep: () => {
        const { currentStep, formData } = get()
        
        switch (currentStep) {
          case 1: // ServiceSelection
            return !!formData.service
          case 2: // VehicleDetails
            return !!formData.vehicle && !!formData.vehicle.make && !!formData.vehicle.model && !!formData.vehicle.size
          case 3: // TimeSlotSelection
            return !!formData.slot && !!formData.slot.slotId && !!formData.slot.slot_date
          case 4: // AddressCollection
            return !!formData.address && !!formData.address.addressLine1 && !!formData.address.city && !!formData.address.postcode
          case 5: // UserDetails
            return !!formData.user && !!formData.user.email && !!formData.user.phone && !!formData.user.name && 
              (formData.user.isExistingUser || !!formData.user.password) // New users must have password
          case 6: // PricingConfirmation - No validation needed, just display summary
            return !!formData.slot && !!formData.address && !!formData.vehicle && !!formData.service && !!formData.user
          default:
            return false
        }
      },
      
      canProceedToNextStep: () => {
        const { validateCurrentStep } = get()
        return validateCurrentStep()
      },
    }),
    {
      name: 'love4detailing-booking-flow',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist form data and current step, not loading states or cached data
      // Note: isExistingUser is intentionally NOT persisted to prevent old validation results
      // from affecting new email/phone validations
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData,
        calculatedPrice: state.calculatedPrice,
        sessionTimestamp: state.sessionTimestamp,
        sessionExpiry: state.sessionExpiry,
      }),
      // Check for expired sessions on rehydration
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          logger.warn('Failed to rehydrate booking flow state:', error)
          return
        }
        
        // Check if session has expired
        if (state && isSessionExpired(state.sessionTimestamp || 0, state.sessionExpiry || SESSION_EXPIRY_MS)) {
          logger.debug('📅 Booking session expired, resetting to fresh state')
          // Reset to initial state if session has expired
          Object.assign(state, {
            ...initialState,
            sessionTimestamp: Date.now(),
          })
        }
      },
    }
  )
)

// Utility hook for step-specific data
export const useBookingStep = (step: BookingStep) => {
  const store = useBookingFlowStore()
  return {
    isCurrentStep: store.currentStep === step,
    isCompleted: store.currentStep > step,
    canAccess: store.currentStep >= step,
  }
}

// Utility hook for form validation
export const useBookingValidation = () => {
  const { validateCurrentStep, canProceedToNextStep, error } = useBookingFlowStore()
  return {
    isCurrentStepValid: validateCurrentStep(),
    canProceed: canProceedToNextStep(),
    error,
  }
}