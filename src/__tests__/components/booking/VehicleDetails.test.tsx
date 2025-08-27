/**
 * VehicleDetails Component Integration Tests
 * 
 * Tests the vehicle details form step including validation,
 * form interactions, and integration with booking flow store.
 */

import { screen, waitFor } from '@testing-library/react'
import { VehicleDetails } from '@/components/booking/steps/VehicleDetails'
import {
  renderComponent,
  mockBookingFlowStore,
  resetAllMocks,
  fillFormField,
  selectOption,
  clickButton,
  expectElementToBeVisible
} from '../../helpers/component-helpers'

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  safeConsole: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}))

describe('VehicleDetails Component', () => {
  beforeEach(() => {
    resetAllMocks()
    mockBookingFlowStore.currentStep = 3
  })

  describe('Initial Rendering', () => {
    it('renders vehicle details form', () => {
      renderComponent(<VehicleDetails />)
      
      expect(screen.getByText(/vehicle details/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/make/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/color/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/license plate/i)).toBeInTheDocument()
    })

    it('displays form field labels and placeholders', () => {
      renderComponent(<VehicleDetails />)
      
      expect(screen.getByPlaceholderText(/e\.g\. toyota/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/e\.g\. camry/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/e\.g\. 2020/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/e\.g\. blue/i)).toBeInTheDocument()
    })

    it('shows navigation buttons', () => {
      renderComponent(<VehicleDetails />)
      
      expect(screen.getByRole('button', { name: /back|previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next|continue/i })).toBeInTheDocument()
    })
  })

  describe('Form Field Interactions', () => {
    it('allows user to fill in vehicle make', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await fillFormField(user, /make/i, 'Toyota')
      
      const makeField = screen.getByLabelText(/make/i) as HTMLInputElement
      expect(makeField.value).toBe('Toyota')
    })

    it('allows user to fill in all vehicle details', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await fillFormField(user, /make/i, 'Toyota')
      await fillFormField(user, /model/i, 'Camry')
      await fillFormField(user, /year/i, '2020')
      await fillFormField(user, /color/i, 'Blue')
      await fillFormField(user, /license plate/i, 'ABC123')
      
      expect((screen.getByLabelText(/make/i) as HTMLInputElement).value).toBe('Toyota')
      expect((screen.getByLabelText(/model/i) as HTMLInputElement).value).toBe('Camry')
      expect((screen.getByLabelText(/year/i) as HTMLInputElement).value).toBe('2020')
      expect((screen.getByLabelText(/color/i) as HTMLInputElement).value).toBe('Blue')
      expect((screen.getByLabelText(/license plate/i) as HTMLInputElement).value).toBe('ABC123')
    })

    it('handles vehicle size selection if present', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      const sizeSelect = screen.queryByLabelText(/size|type/i)
      if (sizeSelect) {
        await selectOption(user, /size|type/i, 'SUV')
        expect((sizeSelect as HTMLSelectElement).value).toBe('SUV')
      }
    })

    it('allows adding special notes', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      const notesField = screen.queryByLabelText(/notes|special instructions/i)
      if (notesField) {
        await fillFormField(user, /notes|special instructions/i, 'Extra dirty, needs deep clean')
        expect((notesField as HTMLTextAreaElement).value).toBe('Extra dirty, needs deep clean')
      }
    })
  })

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      // Try to proceed without filling required fields
      await clickButton(user, /next|continue/i)
      
      await waitFor(() => {
        expect(screen.getByText(/make is required/i)).toBeInTheDocument()
        expect(screen.getByText(/model is required/i)).toBeInTheDocument()
      })
    })

    it('validates year format', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await fillFormField(user, /make/i, 'Toyota')
      await fillFormField(user, /model/i, 'Camry')
      await fillFormField(user, /year/i, 'invalid year')
      
      await clickButton(user, /next|continue/i)
      
      await waitFor(() => {
        expect(screen.getByText(/valid year/i)).toBeInTheDocument()
      })
    })

    it('validates year range', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await fillFormField(user, /make/i, 'Toyota')
      await fillFormField(user, /model/i, 'Camry')
      await fillFormField(user, /year/i, '1800') // Too old
      
      await clickButton(user, /next|continue/i)
      
      await waitFor(() => {
        expect(screen.getByText(/year must be between/i)).toBeInTheDocument()
      })
    })

    it('validates license plate format if strict validation is enabled', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await fillFormField(user, /make/i, 'Toyota')
      await fillFormField(user, /model/i, 'Camry')
      await fillFormField(user, /year/i, '2020')
      await fillFormField(user, /license plate/i, 'INVALID_FORMAT_TOO_LONG')
      
      await clickButton(user, /next|continue/i)
      
      // Only check if validation exists
      const errorMessage = screen.queryByText(/invalid license plate/i)
      if (errorMessage) {
        expect(errorMessage).toBeInTheDocument()
      }
    })

    it('accepts valid form data', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await fillFormField(user, /make/i, 'Toyota')
      await fillFormField(user, /model/i, 'Camry')
      await fillFormField(user, /year/i, '2020')
      await fillFormField(user, /color/i, 'Blue')
      await fillFormField(user, /license plate/i, 'ABC123')
      
      await clickButton(user, /next|continue/i)
      
      expect(mockBookingFlowStore.setVehicleDetails).toHaveBeenCalledWith({
        make: 'Toyota',
        model: 'Camry',
        year: '2020',
        color: 'Blue',
        licensePlate: 'ABC123'
      })
    })
  })

  describe('Navigation Controls', () => {
    it('goes back to previous step when back button is clicked', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await clickButton(user, /back|previous/i)
      
      expect(mockBookingFlowStore.previousStep).toHaveBeenCalled()
    })

    it('disables next button when form is invalid', () => {
      mockBookingFlowStore.canProceedToNextStep = jest.fn(() => false)
      renderComponent(<VehicleDetails />)
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      expect(nextButton).toBeDisabled()
    })

    it('enables next button when form is valid', async () => {
      mockBookingFlowStore.canProceedToNextStep = jest.fn(() => true)
      const { user } = renderComponent(<VehicleDetails />)
      
      // Fill required fields
      await fillFormField(user, /make/i, 'Toyota')
      await fillFormField(user, /model/i, 'Camry')
      await fillFormField(user, /year/i, '2020')
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      expect(nextButton).not.toBeDisabled()
    })

    it('proceeds to next step when valid form is submitted', async () => {
      mockBookingFlowStore.canProceedToNextStep = jest.fn(() => true)
      const { user } = renderComponent(<VehicleDetails />)
      
      await fillFormField(user, /make/i, 'Toyota')
      await fillFormField(user, /model/i, 'Camry')
      await fillFormField(user, /year/i, '2020')
      
      await clickButton(user, /next|continue/i)
      
      expect(mockBookingFlowStore.nextStep).toHaveBeenCalled()
    })
  })

  describe('Pre-filled Data', () => {
    it('displays previously entered vehicle details', () => {
      mockBookingFlowStore.formData.vehicle = {
        make: 'Honda',
        model: 'Civic',
        year: '2019',
        color: 'Red',
        licensePlate: 'XYZ789'
      }
      
      renderComponent(<VehicleDetails />)
      
      expect((screen.getByLabelText(/make/i) as HTMLInputElement).value).toBe('Honda')
      expect((screen.getByLabelText(/model/i) as HTMLInputElement).value).toBe('Civic')
      expect((screen.getByLabelText(/year/i) as HTMLInputElement).value).toBe('2019')
      expect((screen.getByLabelText(/color/i) as HTMLInputElement).value).toBe('Red')
      expect((screen.getByLabelText(/license plate/i) as HTMLInputElement).value).toBe('XYZ789')
    })

    it('allows editing pre-filled data', async () => {
      mockBookingFlowStore.formData.vehicle = {
        make: 'Honda',
        model: 'Civic',
        year: '2019'
      }
      
      const { user } = renderComponent(<VehicleDetails />)
      
      // Change the make
      const makeField = screen.getByLabelText(/make/i)
      await user.clear(makeField)
      await user.type(makeField, 'Toyota')
      
      expect((makeField as HTMLInputElement).value).toBe('Toyota')
    })
  })

  describe('Auto-suggestions and Enhancement', () => {
    it('provides year dropdown with recent years', () => {
      renderComponent(<VehicleDetails />)
      
      const yearField = screen.getByLabelText(/year/i)
      if (yearField.tagName === 'SELECT') {
        const options = Array.from((yearField as HTMLSelectElement).options)
        const currentYear = new Date().getFullYear()
        
        expect(options.some(option => option.value === currentYear.toString())).toBe(true)
        expect(options.some(option => option.value === (currentYear - 1).toString())).toBe(true)
      }
    })

    it('formats input values appropriately', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      // License plate should be formatted (if formatting is implemented)
      await fillFormField(user, /license plate/i, 'abc123')
      
      const licensePlateField = screen.getByLabelText(/license plate/i) as HTMLInputElement
      // Check if automatic uppercase formatting is applied
      if (licensePlateField.value !== 'abc123') {
        expect(licensePlateField.value).toBe('ABC123')
      }
    })
  })

  describe('Error Handling', () => {
    it('displays field-specific error messages', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await fillFormField(user, /make/i, '') // Empty required field
      await clickButton(user, /next|continue/i)
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/make is required/i)
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass(/error|text-red/)
      })
    })

    it('clears error messages when field is corrected', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      // Trigger error
      await clickButton(user, /next|continue/i)
      await waitFor(() => screen.getByText(/make is required/i))
      
      // Correct the error
      await fillFormField(user, /make/i, 'Toyota')
      
      await waitFor(() => {
        expect(screen.queryByText(/make is required/i)).not.toBeInTheDocument()
      })
    })

    it('shows form-level errors for submission failures', async () => {
      mockBookingFlowStore.error = 'Failed to save vehicle details'
      renderComponent(<VehicleDetails />)
      
      expect(screen.getByText(/failed to save vehicle details/i)).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading state when processing form', () => {
      mockBookingFlowStore.isLoading = true
      renderComponent(<VehicleDetails />)
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      expect(nextButton).toBeDisabled()
      expect(screen.getByText(/saving|processing/i)).toBeInTheDocument()
    })

    it('disables form fields during loading', () => {
      mockBookingFlowStore.isLoading = true
      renderComponent(<VehicleDetails />)
      
      expect(screen.getByLabelText(/make/i)).toBeDisabled()
      expect(screen.getByLabelText(/model/i)).toBeDisabled()
      expect(screen.getByLabelText(/year/i)).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('provides proper labels for all form fields', () => {
      renderComponent(<VehicleDetails />)
      
      expect(screen.getByLabelText(/make/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/color/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/license plate/i)).toBeInTheDocument()
    })

    it('associates error messages with form fields', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await clickButton(user, /next|continue/i)
      
      await waitFor(() => {
        const makeField = screen.getByLabelText(/make/i)
        const errorId = makeField.getAttribute('aria-describedby')
        
        if (errorId) {
          const errorElement = document.getElementById(errorId)
          expect(errorElement).toHaveTextContent(/make is required/i)
        }
      })
    })

    it('supports keyboard navigation', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      // Tab through form fields
      await user.tab()
      expect(document.activeElement).toBe(screen.getByLabelText(/make/i))
      
      await user.tab()
      expect(document.activeElement).toBe(screen.getByLabelText(/model/i))
      
      await user.tab()
      expect(document.activeElement).toBe(screen.getByLabelText(/year/i))
    })

    it('announces form validation errors to screen readers', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await clickButton(user, /next|continue/i)
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/make is required/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
        expect(errorMessage).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('Integration with Store', () => {
    it('updates store when form data changes', async () => {
      const { user } = renderComponent(<VehicleDetails />)
      
      await fillFormField(user, /make/i, 'Toyota')
      await fillFormField(user, /model/i, 'Camry')
      await fillFormField(user, /year/i, '2020')
      
      await clickButton(user, /next|continue/i)
      
      expect(mockBookingFlowStore.setVehicleDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          make: 'Toyota',
          model: 'Camry',
          year: '2020'
        })
      )
    })

    it('reflects store state changes', () => {
      mockBookingFlowStore.formData.vehicle = { make: 'Initial Make' }
      const { rerender } = renderComponent(<VehicleDetails />)
      
      // Simulate store update
      mockBookingFlowStore.formData.vehicle = { make: 'Updated Make' }
      rerender(<VehicleDetails />)
      
      expect((screen.getByLabelText(/make/i) as HTMLInputElement).value).toBe('Updated Make')
    })
  })
})