/**
 * BookingActionModals Component Integration Tests
 * 
 * Tests the admin booking action modals including confirm, cancel, 
 * reschedule, and complete booking actions.
 */

import { screen, waitFor } from '@testing-library/react'
import { BookingActionModals } from '@/components/admin/BookingActionModals'
import {
  renderComponent,
  mockAdminStore,
  resetAllMocks,
  clickButton,
  fillFormField,
  mockFetch,
  mockApiResponse,
  simulateApiError
} from '../../helpers/component-helpers'

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}))

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: jest.fn(),
}))

describe('BookingActionModals Component', () => {
  const mockBooking = {
    id: 'booking-123',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    serviceName: 'Exterior Detail',
    date: '2024-03-15',
    startTime: '10:00',
    endTime: '12:00',
    status: 'pending',
    address: '123 Test Street',
    totalPrice: 35,
    notes: 'Test booking notes'
  }

  const defaultProps = {
    booking: mockBooking,
    isConfirmOpen: false,
    isCancelOpen: false,
    isRescheduleOpen: false,
    isCompleteOpen: false,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    onReschedule: jest.fn(),
    onComplete: jest.fn(),
  }

  beforeEach(() => {
    resetAllMocks()
    mockFetch(mockApiResponse({ success: true }))
  })

  describe('Confirm Booking Modal', () => {
    const confirmProps = { ...defaultProps, isConfirmOpen: true }

    it('renders confirm modal with booking details', () => {
      renderComponent(<BookingActionModals {...confirmProps} />)
      
      expect(screen.getByText(/confirm booking/i)).toBeInTheDocument()
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
      expect(screen.getByText(/exterior detail/i)).toBeInTheDocument()
      expect(screen.getByText(/march 15/i)).toBeInTheDocument()
    })

    it('confirms booking when confirm button is clicked', async () => {
      const { user } = renderComponent(<BookingActionModals {...confirmProps} />)
      
      await clickButton(user, /confirm booking/i)
      
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(mockBooking.id)
    })

    it('closes modal when cancel is clicked', async () => {
      const { user } = renderComponent(<BookingActionModals {...confirmProps} />)
      
      await clickButton(user, /cancel/i)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('shows loading state during confirmation', async () => {
      mockAdminStore.isLoading = true
      const { user } = renderComponent(<BookingActionModals {...confirmProps} />)
      
      const confirmButton = screen.getByRole('button', { name: /confirm booking/i })
      expect(confirmButton).toBeDisabled()
      expect(screen.getByText(/confirming/i)).toBeInTheDocument()
    })

    it('displays error message if confirmation fails', async () => {
      simulateApiError('Failed to confirm booking')
      const { user } = renderComponent(<BookingActionModals {...confirmProps} />)
      
      await clickButton(user, /confirm booking/i)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to confirm/i)).toBeInTheDocument()
      })
    })
  })

  describe('Cancel Booking Modal', () => {
    const cancelProps = { ...defaultProps, isCancelOpen: true }

    it('renders cancel modal with warning message', () => {
      renderComponent(<BookingActionModals {...cancelProps} />)
      
      expect(screen.getByText(/cancel booking/i)).toBeInTheDocument()
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
    })

    it('requires cancellation reason', async () => {
      const { user } = renderComponent(<BookingActionModals {...cancelProps} />)
      
      const cancelButton = screen.getByRole('button', { name: /cancel booking/i })
      expect(cancelButton).toBeDisabled()
      
      await fillFormField(user, /reason/i, 'Customer requested cancellation')
      
      expect(cancelButton).not.toBeDisabled()
    })

    it('cancels booking with reason when confirmed', async () => {
      const { user } = renderComponent(<BookingActionModals {...cancelProps} />)
      
      await fillFormField(user, /reason/i, 'Customer requested cancellation')
      await clickButton(user, /cancel booking/i)
      
      expect(defaultProps.onCancel).toHaveBeenCalledWith(
        mockBooking.id,
        'Customer requested cancellation'
      )
    })

    it('validates required cancellation reason', async () => {
      const { user } = renderComponent(<BookingActionModals {...cancelProps} />)
      
      await clickButton(user, /cancel booking/i)
      
      expect(screen.getByText(/reason is required/i)).toBeInTheDocument()
      expect(defaultProps.onCancel).not.toHaveBeenCalled()
    })
  })

  describe('Reschedule Booking Modal', () => {
    const rescheduleProps = { ...defaultProps, isRescheduleOpen: true }

    it('renders reschedule modal with date and time pickers', () => {
      renderComponent(<BookingActionModals {...rescheduleProps} />)
      
      expect(screen.getByText(/reschedule booking/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/new date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/new time/i)).toBeInTheDocument()
    })

    it('validates new date and time selection', async () => {
      const { user } = renderComponent(<BookingActionModals {...rescheduleProps} />)
      
      const rescheduleButton = screen.getByRole('button', { name: /reschedule/i })
      expect(rescheduleButton).toBeDisabled()
      
      // Select new date and time
      await fillFormField(user, /new date/i, '2024-03-20')
      await fillFormField(user, /new time/i, '14:00')
      
      expect(rescheduleButton).not.toBeDisabled()
    })

    it('reschedules booking with new date and time', async () => {
      const { user } = renderComponent(<BookingActionModals {...rescheduleProps} />)
      
      await fillFormField(user, /new date/i, '2024-03-20')
      await fillFormField(user, /new time/i, '14:00')
      await clickButton(user, /reschedule/i)
      
      expect(defaultProps.onReschedule).toHaveBeenCalledWith(
        mockBooking.id,
        expect.objectContaining({
          date: '2024-03-20',
          time: '14:00'
        })
      )
    })

    it('prevents scheduling in the past', async () => {
      const { user } = renderComponent(<BookingActionModals {...rescheduleProps} />)
      
      await fillFormField(user, /new date/i, '2024-01-01') // Past date
      await fillFormField(user, /new time/i, '10:00')
      
      expect(screen.getByText(/cannot schedule in the past/i)).toBeInTheDocument()
      
      const rescheduleButton = screen.getByRole('button', { name: /reschedule/i })
      expect(rescheduleButton).toBeDisabled()
    })

    it('shows available time slots for selected date', async () => {
      const availableSlots = [
        { time: '09:00', available: true },
        { time: '11:00', available: true },
        { time: '14:00', available: false }
      ]
      
      mockFetch(mockApiResponse(availableSlots))
      
      const { user } = renderComponent(<BookingActionModals {...rescheduleProps} />)
      
      await fillFormField(user, /new date/i, '2024-03-20')
      
      await waitFor(() => {
        expect(screen.getByText(/09:00/)).toBeInTheDocument()
        expect(screen.getByText(/11:00/)).toBeInTheDocument()
        expect(screen.getByText(/14:00.*unavailable/i)).toBeInTheDocument()
      })
    })
  })

  describe('Complete Booking Modal', () => {
    const completeProps = { ...defaultProps, isCompleteOpen: true }

    it('renders complete modal with completion details', () => {
      renderComponent(<BookingActionModals {...completeProps} />)
      
      expect(screen.getByText(/complete booking/i)).toBeInTheDocument()
      expect(screen.getByText(/mark this booking as completed/i)).toBeInTheDocument()
    })

    it('allows adding completion notes', async () => {
      const { user } = renderComponent(<BookingActionModals {...completeProps} />)
      
      await fillFormField(user, /completion notes/i, 'Service completed successfully')
      
      const notesField = screen.getByLabelText(/completion notes/i)
      expect(notesField).toHaveValue('Service completed successfully')
    })

    it('completes booking when confirmed', async () => {
      const { user } = renderComponent(<BookingActionModals {...completeProps} />)
      
      await fillFormField(user, /completion notes/i, 'Service completed successfully')
      await clickButton(user, /complete booking/i)
      
      expect(defaultProps.onComplete).toHaveBeenCalledWith(
        mockBooking.id,
        'Service completed successfully'
      )
    })

    it('allows completion without notes', async () => {
      const { user } = renderComponent(<BookingActionModals {...completeProps} />)
      
      await clickButton(user, /complete booking/i)
      
      expect(defaultProps.onComplete).toHaveBeenCalledWith(mockBooking.id, '')
    })
  })

  describe('Modal Interactions', () => {
    it('closes modal when clicking outside', async () => {
      const confirmProps = { ...defaultProps, isConfirmOpen: true }
      const { user } = renderComponent(<BookingActionModals {...confirmProps} />)
      
      // Click on overlay/backdrop
      const overlay = screen.getByRole('dialog').parentElement
      await user.click(overlay!)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('closes modal when pressing escape key', async () => {
      const confirmProps = { ...defaultProps, isConfirmOpen: true }
      const { user } = renderComponent(<BookingActionModals {...confirmProps} />)
      
      await user.keyboard('{Escape}')
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('traps focus within modal', async () => {
      const confirmProps = { ...defaultProps, isConfirmOpen: true }
      const { user } = renderComponent(<BookingActionModals {...confirmProps} />)
      
      const modal = screen.getByRole('dialog')
      const buttons = screen.getAllByRole('button')
      
      // Tab should cycle through buttons within modal
      await user.tab()
      expect(document.activeElement).toBeInstanceOf(HTMLButtonElement)
      expect(modal).toContain(document.activeElement)
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels for modals', () => {
      const confirmProps = { ...defaultProps, isConfirmOpen: true }
      renderComponent(<BookingActionModals {...confirmProps} />)
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('announces modal content to screen readers', () => {
      const confirmProps = { ...defaultProps, isConfirmOpen: true }
      renderComponent(<BookingActionModals {...confirmProps} />)
      
      const title = screen.getByText(/confirm booking/i)
      expect(title).toHaveAttribute('id')
    })

    it('provides clear button labels', () => {
      const confirmProps = { ...defaultProps, isConfirmOpen: true }
      renderComponent(<BookingActionModals {...confirmProps} />)
      
      const confirmButton = screen.getByRole('button', { name: /confirm booking/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      
      expect(confirmButton).toHaveAccessibleName()
      expect(cancelButton).toHaveAccessibleName()
    })
  })

  describe('Error Handling', () => {
    it('displays API error messages', async () => {
      simulateApiError('Booking not found')
      const confirmProps = { ...defaultProps, isConfirmOpen: true }
      const { user } = renderComponent(<BookingActionModals {...confirmProps} />)
      
      await clickButton(user, /confirm booking/i)
      
      await waitFor(() => {
        expect(screen.getByText(/booking not found/i)).toBeInTheDocument()
      })
    })

    it('handles network errors gracefully', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))
      
      const confirmProps = { ...defaultProps, isConfirmOpen: true }
      const { user } = renderComponent(<BookingActionModals {...confirmProps} />)
      
      await clickButton(user, /confirm booking/i)
      
      await waitFor(() => {
        expect(screen.getByText(/network error|connection failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('does not render modal content when closed', () => {
      renderComponent(<BookingActionModals {...defaultProps} />)
      
      expect(screen.queryByText(/confirm booking/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/cancel booking/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/reschedule booking/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/complete booking/i)).not.toBeInTheDocument()
    })

    it('lazy loads time slot data only when reschedule modal is opened', () => {
      renderComponent(<BookingActionModals {...defaultProps} />)
      
      expect(mockFetch).not.toHaveBeenCalled()
      
      // Open reschedule modal
      const rescheduleProps = { ...defaultProps, isRescheduleOpen: true }
      const { rerender } = renderComponent(<BookingActionModals {...rescheduleProps} />)
      
      // Should load time slots when modal opens
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})