import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { BookingFlowData, PricingBreakdown, CustomerVehicle, CustomerAddress } from '@/lib/utils/booking-types'
import { Database } from '@/lib/db/database.types'

// Type aliases for database types  
type ServiceRow = Database['public']['Tables']['services']['Row']
type VehicleSizeRow = Database['public']['Tables']['vehicle_sizes']['Row']
type TimeSlotRow = Database['public']['Tables']['time_slots']['Row']

// Booking flow step types
export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6

export interface SlotSelection {
  slotId: string
  date: string
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
}

export interface VehicleData {
  make: string
  model: string
  year: number
  size: 'small' | 'medium' | 'large' | 'extra_large'
  color?: string
  registration?: string
  notes?: string
}

export interface ServiceSelection {
  serviceId: string
  name: string
  basePrice: number
  duration: number
}

export interface AddressData {
  street: string
  city: string
  state: string
  zipCode: string
  isExisting?: boolean
  addressId?: string
}

export interface PriceCalculation {
  basePrice: number
  sizeMultiplier: number
  finalPrice: number
  currency: string
  breakdown?: PricingBreakdown
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
  // Current step (1-5)
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
  isLoading: false,
  isSubmitting: false,
  error: null,
  availableSlots: [],
  availableServices: [],
  userVehicles: [],
  userAddresses: [],
  vehicleSizes: [],
}

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
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
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
      
      // Pricing calculation
      calculatePrice: async () => {
        const { formData, setLoading, setError } = get()
        
        if (!formData.service || !formData.vehicle) {
          setError('Service and vehicle data required for pricing')
          return
        }
        
        setLoading(true)
        
        try {
          const response = await apiCall<PriceCalculation>('/api/pricing/calculate', {
            method: 'POST',
            body: JSON.stringify({
              serviceId: formData.service.serviceId,
              vehicleSize: formData.vehicle.size,
              // TODO: Add address for distance calculation if available
            }),
          })
          
          if (response.success && response.data) {
            set({ calculatedPrice: response.data })
          } else {
            setError(response.error?.message || 'Failed to calculate price')
          }
        } catch (error) {
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
            userId?: string
            vehicles?: CustomerVehicle[]
            addresses?: CustomerAddress[]
          }>('/api/booking/validate-user', {
            method: 'POST',
            body: JSON.stringify({ email, phone }),
          })
          
          if (response.success && response.data) {
            set({
              isExistingUser: response.data.isExistingUser,
              userVehicles: response.data.vehicles || [],
              userAddresses: response.data.addresses || [],
            })
          } else {
            setError(response.error?.message || 'Failed to validate user')
          }
        } catch (error) {
          setError('Failed to validate user')
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
      
      // Load vehicle sizes
      loadVehicleSizes: async () => {
        try {
          const response = await apiCall<VehicleSizeRow[]>('/api/vehicle-sizes')
          
          if (response.success && response.data) {
            set({ vehicleSizes: response.data })
          }
        } catch (error) {
          console.error('Failed to load vehicle sizes:', error)
          // Silent fail for vehicle sizes as they might be cached
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
                phone: formData.user.phone
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
                addressLine1: formData.address.street,
                addressLine2: '',
                city: formData.address.city,
                county: formData.address.state, // Map state to county for now
                postalCode: formData.address.zipCode,
                country: 'United Kingdom'
              },
              services: [{
                serviceId: formData.service.serviceId,
                serviceName: formData.service.name,
                duration: formData.service.duration,
                basePrice: formData.service.basePrice,
                vehicleSizeMultiplier: 1 // This will be calculated by the API
              }],
              timeSlot: {
                date: formData.slot.date,
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
          case 1:
            return !!formData.slot && !!formData.slot.slotId && !!formData.slot.date
          case 2:
            return !!formData.user && !!formData.user.email && !!formData.user.phone && !!formData.user.name
          case 3:
            return !!formData.vehicle && !!formData.vehicle.make && !!formData.vehicle.model && !!formData.vehicle.size
          case 4:
            return !!formData.service
          case 5:
            return !!formData.address && !!formData.address.street && !!formData.address.city
          case 6:
            return !!formData.slot && !!formData.address && !!formData.user && !!formData.vehicle && !!formData.service
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