/**
 * BookingFlowIndicator Component Integration Tests
 * 
 * Tests the step navigation indicator that shows booking progress,
 * step completion status, and navigation between steps.
 */

import { screen, waitFor } from '@testing-library/react'
import { BookingFlowIndicator } from '@/components/booking/BookingFlowIndicator'
import {
  renderComponent,
  mockBookingFlowStore,
  resetAllMocks,
} from '../../helpers/component-helpers'

describe('BookingFlowIndicator Component', () => {
  const mockSteps = [
    { id: 1, title: 'Service Selection', description: 'Choose your service' },
    { id: 2, title: 'Time & Date', description: 'Select appointment time' },
    { id: 3, title: 'Vehicle Details', description: 'Add vehicle information' },
    { id: 4, title: 'Your Details', description: 'Contact information' },
    { id: 5, title: 'Confirmation', description: 'Review and confirm' }
  ]

  beforeEach(() => {
    resetAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders all booking steps', () => {
      renderComponent(<BookingFlowIndicator />)
      
      expect(screen.getByText(/service selection/i)).toBeInTheDocument()
      expect(screen.getByText(/time & date/i)).toBeInTheDocument()
      expect(screen.getByText(/vehicle details/i)).toBeInTheDocument()
      expect(screen.getByText(/your details/i)).toBeInTheDocument()
      expect(screen.getByText(/confirmation/i)).toBeInTheDocument()
    })

    it('shows step numbers for each step', () => {
      renderComponent(<BookingFlowIndicator />)
      
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('displays step descriptions', () => {
      renderComponent(<BookingFlowIndicator />)
      
      expect(screen.getByText(/choose your service/i)).toBeInTheDocument()
      expect(screen.getByText(/select appointment time/i)).toBeInTheDocument()
      expect(screen.getByText(/add vehicle information/i)).toBeInTheDocument()
    })
  })

  describe('Current Step Highlighting', () => {
    it('highlights current step (step 1)', () => {
      mockBookingFlowStore.currentStep = 1
      renderComponent(<BookingFlowIndicator />)
      
      const currentStepElement = screen.getByText('1').closest('[data-testid="step-1"]') ||
                                screen.getByText(/service selection/i).closest('div')
      
      expect(currentStepElement).toHaveClass(/current|active|bg-brand|text-brand/)
    })

    it('highlights current step (step 3)', () => {
      mockBookingFlowStore.currentStep = 3
      renderComponent(<BookingFlowIndicator />)
      
      const currentStepElement = screen.getByText('3').closest('[data-testid="step-3"]') ||
                                screen.getByText(/vehicle details/i).closest('div')
      
      expect(currentStepElement).toHaveClass(/current|active|bg-brand|text-brand/)
    })

    it('does not highlight non-current steps', () => {
      mockBookingFlowStore.currentStep = 2
      renderComponent(<BookingFlowIndicator />)
      
      const step1Element = screen.getByText('1').closest('div')
      const step3Element = screen.getByText('3').closest('div')
      
      expect(step1Element).not.toHaveClass(/current|active|bg-brand/)
      expect(step3Element).not.toHaveClass(/current|active|bg-brand/)
    })
  })

  describe('Completed Steps', () => {
    it('marks completed steps with checkmark', () => {
      mockBookingFlowStore.currentStep = 3
      renderComponent(<BookingFlowIndicator />)
      
      // Steps 1 and 2 should be completed
      const checkmarks = screen.getAllByTestId(/checkmark|check|completed/)
      expect(checkmarks.length).toBeGreaterThanOrEqual(2)
    })

    it('styles completed steps differently', () => {
      mockBookingFlowStore.currentStep = 4
      renderComponent(<BookingFlowIndicator />)
      
      const completedStep = screen.getByText('1').closest('div') ||
                           screen.getByText(/service selection/i).closest('div')
      
      expect(completedStep).toHaveClass(/completed|done|bg-green|text-green/)
    })

    it('shows all steps as completed when on final confirmation step', () => {
      mockBookingFlowStore.currentStep = 5
      renderComponent(<BookingFlowIndicator />)
      
      const checkmarks = screen.getAllByTestId(/checkmark|check|completed/)
      expect(checkmarks.length).toBe(4) // Steps 1-4 should be completed
    })
  })

  describe('Step Navigation', () => {
    it('allows clicking on completed steps to navigate back', async () => {
      mockBookingFlowStore.currentStep = 3
      const { user } = renderComponent(<BookingFlowIndicator />)
      
      // Click on completed step 1
      const step1 = screen.getByText('1') || screen.getByText(/service selection/i)
      await user.click(step1)
      
      expect(mockBookingFlowStore.goToStep).toHaveBeenCalledWith(1)
    })

    it('prevents clicking on future steps', async () => {
      mockBookingFlowStore.currentStep = 2
      const { user } = renderComponent(<BookingFlowIndicator />)
      
      // Try to click on future step 4
      const step4 = screen.getByText('4') || screen.getByText(/your details/i)
      await user.click(step4)
      
      expect(mockBookingFlowStore.goToStep).not.toHaveBeenCalledWith(4)
    })

    it('disables future steps visually', () => {
      mockBookingFlowStore.currentStep = 2
      renderComponent(<BookingFlowIndicator />)
      
      const futureStep = screen.getByText('4').closest('button') ||
                        screen.getByText(/your details/i).closest('button')
      
      expect(futureStep).toHaveClass(/disabled|opacity-50|cursor-not-allowed/)
      expect(futureStep).toHaveAttribute('disabled')
    })

    it('shows hover effects on clickable steps', async () => {
      mockBookingFlowStore.currentStep = 3
      const { user } = renderComponent(<BookingFlowIndicator />)
      
      const clickableStep = screen.getByText('1')
      await user.hover(clickableStep)
      
      const stepElement = clickableStep.closest('button')
      expect(stepElement).toHaveClass(/hover:/)
    })
  })

  describe('Step Validation Status', () => {
    it('shows validation errors for incomplete steps', () => {
      mockBookingFlowStore.currentStep = 3
      mockBookingFlowStore.formData.service = null // Step 1 incomplete
      
      renderComponent(<BookingFlowIndicator />)
      
      const step1 = screen.getByText('1').closest('div')
      expect(step1).toHaveClass(/error|invalid|border-red/)
      
      const errorIcon = screen.getByTestId(/error-icon|warning/)
      expect(errorIcon).toBeInTheDocument()
    })

    it('shows step as valid when properly completed', () => {
      mockBookingFlowStore.currentStep = 3
      mockBookingFlowStore.formData.service = { serviceId: '1', name: 'Test Service' }
      mockBookingFlowStore.formData.timeSlot = { slotId: '1', date: '2024-03-15' }
      
      renderComponent(<BookingFlowIndicator />)
      
      const step1 = screen.getByText('1').closest('div')
      const step2 = screen.getByText('2').closest('div')
      
      expect(step1).toHaveClass(/valid|completed|bg-green/)
      expect(step2).toHaveClass(/valid|completed|bg-green/)
    })
  })

  describe('Progress Bar', () => {
    it('shows progress bar indicating completion percentage', () => {
      mockBookingFlowStore.currentStep = 3
      renderComponent(<BookingFlowIndicator />)
      
      const progressBar = screen.getByRole('progressbar') || 
                         screen.getByTestId('progress-bar')
      
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '40') // 2/5 steps = 40%
    })

    it('updates progress bar as user advances through steps', () => {
      mockBookingFlowStore.currentStep = 1
      const { rerender } = renderComponent(<BookingFlowIndicator />)
      
      let progressBar = screen.getByRole('progressbar') || screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '0')
      
      // Advance to step 3
      mockBookingFlowStore.currentStep = 3
      rerender(<BookingFlowIndicator />)
      
      progressBar = screen.getByRole('progressbar') || screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '40')
    })

    it('shows 100% progress on final step', () => {
      mockBookingFlowStore.currentStep = 5
      renderComponent(<BookingFlowIndicator />)
      
      const progressBar = screen.getByRole('progressbar') || 
                         screen.getByTestId('progress-bar')
      
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    })
  })

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      renderComponent(<BookingFlowIndicator />)
      
      // Should show abbreviated step names or icons only on mobile
      const container = screen.getByText('1').closest('[data-testid="steps-container"]')
      expect(container).toHaveClass(/flex-col|sm:flex-row|mobile/)
    })

    it('shows full step descriptions on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      
      renderComponent(<BookingFlowIndicator />)
      
      expect(screen.getByText(/choose your service/i)).toBeVisible()
      expect(screen.getByText(/select appointment time/i)).toBeVisible()
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels for steps', () => {
      renderComponent(<BookingFlowIndicator />)
      
      const step1 = screen.getByText('1')
      expect(step1.closest('button')).toHaveAttribute('aria-label', 
        expect.stringMatching(/step 1.*service selection/i))
    })

    it('indicates current step to screen readers', () => {
      mockBookingFlowStore.currentStep = 2
      renderComponent(<BookingFlowIndicator />)
      
      const currentStep = screen.getByText('2')
      expect(currentStep.closest('button')).toHaveAttribute('aria-current', 'step')
    })

    it('provides progress information for screen readers', () => {
      mockBookingFlowStore.currentStep = 3
      renderComponent(<BookingFlowIndicator />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-label', 
        expect.stringMatching(/step 3 of 5|progress/i))
    })

    it('supports keyboard navigation between clickable steps', async () => {
      mockBookingFlowStore.currentStep = 3
      const { user } = renderComponent(<BookingFlowIndicator />)
      
      // Tab to first clickable step
      await user.tab()
      
      expect(document.activeElement).toHaveAttribute('role', 'button')
      
      // Arrow keys should navigate between steps
      await user.keyboard('{ArrowRight}')
      
      const newFocusedStep = document.activeElement
      expect(newFocusedStep).toHaveAttribute('role', 'button')
      expect(newFocusedStep).not.toBe(document.activeElement)
    })
  })

  describe('Animation and Visual Feedback', () => {
    it('animates step transitions', async () => {
      mockBookingFlowStore.currentStep = 1
      const { rerender } = renderComponent(<BookingFlowIndicator />)
      
      // Change step
      mockBookingFlowStore.currentStep = 2
      rerender(<BookingFlowIndicator />)
      
      // Should have transition classes
      const newCurrentStep = screen.getByText('2').closest('div')
      expect(newCurrentStep).toHaveClass(/transition|animate/)
    })

    it('shows loading states during step validation', () => {
      mockBookingFlowStore.isLoading = true
      mockBookingFlowStore.currentStep = 2
      
      renderComponent(<BookingFlowIndicator />)
      
      const currentStep = screen.getByText('2').closest('div')
      expect(currentStep).toHaveClass(/loading|animate-pulse/)
    })
  })

  describe('Integration with Booking Store', () => {
    it('updates when store state changes', async () => {
      mockBookingFlowStore.currentStep = 1
      const { rerender } = renderComponent(<BookingFlowIndicator />)
      
      // Simulate store update
      mockBookingFlowStore.currentStep = 4
      mockBookingFlowStore.formData.service = { serviceId: '1' }
      mockBookingFlowStore.formData.timeSlot = { slotId: '1' }
      mockBookingFlowStore.formData.vehicle = { make: 'Toyota' }
      
      rerender(<BookingFlowIndicator />)
      
      // Should show step 4 as current and previous steps as completed
      const currentStep = screen.getByText('4').closest('div')
      expect(currentStep).toHaveClass(/current|active/)
      
      const completedSteps = screen.getAllByTestId(/completed|checkmark/)
      expect(completedSteps.length).toBe(3)
    })
  })
})