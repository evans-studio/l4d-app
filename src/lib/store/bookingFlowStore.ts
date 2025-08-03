import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { BookingFlowData, PricingBreakdown, CustomerVehicle, CustomerAddress } from '@/lib/utils/booking-types'
import { Database } from '@/lib/db/database.types'
import { calculatePostcodeDistance } from '@/lib/utils/postcode-distance'
import { calculateBookingPrice, PriceBreakdown as EnhancedPriceBreakdown } from '@/lib/pricing/calculator'

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
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
  }
  metadata?: {
    pagination?: any
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
    vehicle_details: any
    service_address: any
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

// API utility functions
const apiCall = async <T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    console.log(`BookingFlowStore: Making API call to ${url}`, { method: options?.method || 'GET' })
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })
    
    console.log(`BookingFlowStore: API response from ${url}`, { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok 
    })
    
    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = `HTTP error! status: ${response.status}`
      try {
        const errorBody = await response.text()
        console.error(`BookingFlowStore: Error response body from ${url}:`, errorBody)
        if (errorBody) {
          const parsedError = JSON.parse(errorBody)
          errorDetails = parsedError.error?.message || errorDetails
        }
      } catch (parseError) {
        console.error('BookingFlowStore: Could not parse error response:', parseError)
      }
      
      throw new Error(errorDetails)
    }
    
    const data = await response.json()
    console.log(`BookingFlowStore: Successful response from ${url}:`, data)
    return data
  } catch (error) {
    console.error(`BookingFlowStore: API call failed for ${url}:`, error)
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
        
        if (!formData.service || !formData.vehicle) {
          setError('Service and vehicle data required for pricing')
          return
        }
        
        setLoading(true)
        
        try {
          // If we have address data, use comprehensive pricing calculator
          if (formData.address && formData.address.postcode) {
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
            
            const priceBreakdown = await calculateBookingPrice(
              serviceDetails,
              vehicleDetails,
              addressDetails
            )
            
            // Convert to store format
            const calculatedPrice: PriceCalculation = {
              basePrice: priceBreakdown.serviceBasePrice,
              sizeMultiplier: priceBreakdown.vehicleSizeMultiplier,
              servicePrice: priceBreakdown.servicePrice,
              travelDistance: priceBreakdown.travelDistance,
              travelSurcharge: priceBreakdown.travelSurcharge,
              finalPrice: priceBreakdown.totalPrice,
              currency: 'GBP',
              breakdown: priceBreakdown,
              withinFreeRadius: priceBreakdown.breakdown.travel.withinFreeRadius
            }
            
            set({ calculatedPrice })
          } else {
            // Fallback to basic service pricing without address
            const response = await apiCall<PriceCalculation>('/api/pricing/calculate', {
              method: 'POST',
              body: JSON.stringify({
                serviceId: formData.service.serviceId,
                vehicleSize: formData.vehicle.size, // Now sending size letter directly
              }),
            })
            
            if (response.success && response.data) {
              set({ calculatedPrice: response.data })
            } else {
              setError(response.error?.message || 'Failed to calculate price')
            }
          }
        } catch (error) {
          console.error('Price calculation error:', error)
          setError('Failed to calculate price')
        } finally {
          setLoading(false)
        }
      },
      
      // Load existing user data
      loadExistingUserData: async (email: string, phone: string) => {
        const { setLoading, setError } = get()
        setLoading(true)
        
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
              vehicle_details: any
              service_address: any
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
            set({
              isExistingUser: response.data.isExistingUser,
              userVehicles: response.data.vehicles || [],
              userAddresses: response.data.addresses || [],
              recentBookings: response.data.recentBookings || [],
            })
          } else {
            setError(response.error?.message || 'Failed to validate user')
          }
        } catch (error) {
          console.error('BookingFlowStore: loadExistingUserData error:', error)
          
          // Enhanced error logging
          if (error instanceof Error) {
            console.error('BookingFlowStore: Error details:', {
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
            vehicle_details: any
            service_address: any
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
                make: booking.vehicle_details.make,
                model: booking.vehicle_details.model,
                year: booking.vehicle_details.year,
                size: booking.vehicle_details.size,
                color: booking.vehicle_details.color,
                registration: booking.vehicle_details.license_plate || ''
              } : undefined,
              address: booking.service_address ? {
                addressLine1: booking.service_address.address_line_1,
                addressLine2: booking.service_address.address_line_2 || '',
                city: booking.service_address.city,
                postcode: booking.service_address.postal_code,
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
          console.log(`BookingFlowStore: Loading slots for date ${date}`)
          
          // Use the time-slots availability API
          const response = await apiCall<TimeSlotRow[]>(`/api/time-slots/availability?date=${date}`)
          
          console.log('BookingFlowStore: Availability API response:', response)
          
          if (response.success && response.data) {
            // Filter slots that are available
            const availableSlots = response.data.filter(slot => slot.is_available)
            console.log(`BookingFlowStore: Found ${availableSlots.length} available slots out of ${response.data.length} total slots`)
            set({ availableSlots })
          } else {
            console.error('BookingFlowStore: API error:', response.error)
            setError(response.error?.message || 'Failed to load available slots')
          }
        } catch (error) {
          console.error('BookingFlowStore: Exception loading slots:', error)
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
          const response = await apiCall<VehicleSizeRow[]>('/api/vehicle-sizes')
          
          if (response.success && response.data) {
            set({ vehicleSizes: response.data })
          }
        } catch (error) {
          // Silent fail for vehicle sizes as they're now hardcoded
          console.warn('Vehicle sizes API unavailable, using defaults')
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
              totalPrice: get().calculatedPrice?.finalPrice || 0
            }),
          })
          
          if (response.success && response.data) {
            // Map API response to expected format
            const apiData = response.data as any // API response has different structure
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
      
      resetFlow: () => set(initialState),
      
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
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData,
        calculatedPrice: state.calculatedPrice,
        isExistingUser: state.isExistingUser,
      }),
      // Clear session storage on successful booking completion
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate booking flow state:', error)
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