/**
 * ServiceSelection Component Integration Tests
 * 
 * Tests the service selection step of the booking flow,
 * including user interactions, validation, and store integration.
 */

import { screen, waitFor } from '@testing-library/react'
import { ServiceSelection } from '@/components/booking/steps/ServiceSelection'
import {
  renderComponent,
  mockBookingFlowStore,
  resetAllMocks,
  clickButton,
  expectElementToBeVisible,
  simulateApiError,
  mockFetch,
  mockApiResponse
} from '../../helpers/component-helpers'

// Mock the logger to prevent console output during tests
jest.mock('@/lib/utils/logger', () => ({
  safeConsole: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}))

describe('ServiceSelection Component', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders service selection interface correctly', () => {
      renderComponent(<ServiceSelection />)
      
      expect(screen.getByText(/choose your service/i)).toBeInTheDocument()
      expect(screen.getByText(/exterior detail/i)).toBeInTheDocument()
      expect(screen.getByText(/interior detail/i)).toBeInTheDocument()
    })

    it('displays service details including price and duration', () => {
      renderComponent(<ServiceSelection />)
      
      // Check for service pricing and duration
      expect(screen.getByText(/£25/)).toBeInTheDocument()
      expect(screen.getByText(/£30/)).toBeInTheDocument()
      expect(screen.getByText(/120/)).toBeInTheDocument() // duration
      expect(screen.getByText(/90/)).toBeInTheDocument() // duration
    })

    it('loads available services on component mount', () => {
      renderComponent(<ServiceSelection />)
      
      expect(mockBookingFlowStore.loadAvailableServices).toHaveBeenCalledTimes(1)
    })
  })

  describe('Service Selection Interaction', () => {
    it('allows user to select a service', async () => {
      const { user } = renderComponent(<ServiceSelection />)
      
      const exteriorService = screen.getByText(/exterior detail/i)
      await user.click(exteriorService.closest('button')!)
      
      // Service should be highlighted/selected
      const serviceCard = exteriorService.closest('[data-testid="service-card"]') || 
                         exteriorService.closest('button')
      expect(serviceCard).toHaveClass(/selected|bg-brand|border-brand/)
    })

    it('calls setServiceSelection when service is selected', async () => {
      const { user } = renderComponent(<ServiceSelection />)
      
      const serviceButton = screen.getByText(/exterior detail/i).closest('button')!
      await user.click(serviceButton)
      
      expect(mockBookingFlowStore.setServiceSelection).toHaveBeenCalledWith({
        serviceId: '1',
        name: 'Exterior Detail',
        basePrice: 25,
        duration: 120
      })
    })

    it('updates selection when different service is chosen', async () => {
      const { user } = renderComponent(<ServiceSelection />)
      
      // Select first service
      const exteriorButton = screen.getByText(/exterior detail/i).closest('button')!
      await user.click(exteriorButton)
      
      // Select second service
      const interiorButton = screen.getByText(/interior detail/i).closest('button')!
      await user.click(interiorButton)
      
      expect(mockBookingFlowStore.setServiceSelection).toHaveBeenLastCalledWith({
        serviceId: '2',
        name: 'Interior Detail',
        basePrice: 30,
        duration: 90
      })
    })
  })

  describe('Navigation Controls', () => {
    it('disables next button when no service is selected', () => {
      mockBookingFlowStore.canProceedToNextStep = jest.fn(() => false)
      renderComponent(<ServiceSelection />)
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      expect(nextButton).toBeDisabled()
    })

    it('enables next button when service is selected', () => {
      mockBookingFlowStore.canProceedToNextStep = jest.fn(() => true)
      mockBookingFlowStore.formData.service = { serviceId: '1', name: 'Test Service' }
      
      renderComponent(<ServiceSelection />)
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      expect(nextButton).not.toBeDisabled()
    })

    it('calls nextStep when next button is clicked', async () => {
      mockBookingFlowStore.canProceedToNextStep = jest.fn(() => true)
      mockBookingFlowStore.formData.service = { serviceId: '1', name: 'Test Service' }
      
      const { user } = renderComponent(<ServiceSelection />)
      
      await clickButton(user, /next|continue/i)
      
      expect(mockBookingFlowStore.nextStep).toHaveBeenCalledTimes(1)
    })

    it('calls previousStep when back button is clicked', async () => {
      const { user } = renderComponent(<ServiceSelection />)
      
      const backButton = screen.getByRole('button', { name: /back|previous/i })
      await user.click(backButton)
      
      expect(mockBookingFlowStore.previousStep).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading States', () => {
    it('displays loading indicator when services are being fetched', () => {
      mockBookingFlowStore.isLoading = true
      renderComponent(<ServiceSelection />)
      
      expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('hides loading indicator when services are loaded', () => {
      mockBookingFlowStore.isLoading = false
      renderComponent(<ServiceSelection />)
      
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when service loading fails', () => {
      mockBookingFlowStore.error = 'Failed to load services'
      renderComponent(<ServiceSelection />)
      
      expect(screen.getByText(/failed to load services/i)).toBeInTheDocument()
    })

    it('allows retry when service loading fails', async () => {
      mockBookingFlowStore.error = 'Failed to load services'
      const { user } = renderComponent(<ServiceSelection />)
      
      const retryButton = screen.getByRole('button', { name: /retry|try again/i })
      await user.click(retryButton)
      
      expect(mockBookingFlowStore.loadAvailableServices).toHaveBeenCalledTimes(2) // Initial + retry
    })
  })

  describe('Pre-selected Service', () => {
    it('shows previously selected service as selected', () => {
      mockBookingFlowStore.formData.service = {
        serviceId: '1',
        name: 'Exterior Detail',
        basePrice: 25,
        duration: 120
      }
      
      renderComponent(<ServiceSelection />)
      
      const serviceCard = screen.getByText(/exterior detail/i).closest('button')
      expect(serviceCard).toHaveClass(/selected|bg-brand|border-brand/)
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels for service selection', () => {
      renderComponent(<ServiceSelection />)
      
      const serviceButtons = screen.getAllByRole('button')
      const serviceSelectionButtons = serviceButtons.filter(button => 
        button.textContent?.includes('Exterior Detail') || 
        button.textContent?.includes('Interior Detail')
      )
      
      serviceSelectionButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
        expect(button).toHaveAttribute('role', 'button')
      })
    })

    it('supports keyboard navigation', async () => {
      const { user } = renderComponent(<ServiceSelection />)
      
      // Tab to service selection
      await user.tab()
      
      const focusedElement = document.activeElement
      expect(focusedElement?.tagName).toBe('BUTTON')
      
      // Enter should select service
      await user.keyboard('{Enter}')
      
      expect(mockBookingFlowStore.setServiceSelection).toHaveBeenCalled()
    })
  })

  describe('Responsive Behavior', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      renderComponent(<ServiceSelection />)
      
      // Service cards should stack vertically on mobile
      const container = screen.getByText(/exterior detail/i).closest('div')
      expect(container).toHaveClass(/flex-col|block/)
    })
  })

  describe('Integration with Store', () => {
    it('reflects store state changes', async () => {
      const { rerender } = renderComponent(<ServiceSelection />)
      
      // Simulate store update
      mockBookingFlowStore.isLoading = true
      rerender(<ServiceSelection />)
      
      expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('maintains selection state across re-renders', () => {
      mockBookingFlowStore.formData.service = {
        serviceId: '2',
        name: 'Interior Detail',
        basePrice: 30,
        duration: 90
      }
      
      const { rerender } = renderComponent(<ServiceSelection />)
      rerender(<ServiceSelection />)
      
      const serviceCard = screen.getByText(/interior detail/i).closest('button')
      expect(serviceCard).toHaveClass(/selected|bg-brand|border-brand/)
    })
  })
})