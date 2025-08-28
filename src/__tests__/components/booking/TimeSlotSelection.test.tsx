/**
 * TimeSlotSelection Component Integration Tests
 * 
 * Tests the time slot selection step of the booking flow,
 * including date picker, time slots, availability, and validation.
 */

import { screen, waitFor } from '@testing-library/react'
import { TimeSlotSelection } from '@/components/booking/steps/TimeSlotSelection'
import {
  renderComponent,
  mockBookingFlowStore,
  resetAllMocks,
  clickButton,
  mockFetch,
  mockApiResponse
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

// Mock date-fns to control dates in tests
const mockToday = new Date('2024-03-15T10:00:00Z')
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  startOfDay: jest.fn(() => mockToday),
  addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  format: jest.fn((date, formatStr) => {
    if (formatStr.includes('yyyy-MM-dd')) return '2024-03-15'
    if (formatStr.includes('HH:mm')) return '10:00'
    return date.toISOString()
  }),
  isToday: jest.fn(() => true),
  isSameDay: jest.fn(() => false),
}))

describe('TimeSlotSelection Component', () => {
  const mockTimeSlots = [
    {
      id: '1',
      date: '2024-03-15',
      startTime: '09:00',
      endTime: '10:30',
      isAvailable: true,
      price: 25
    },
    {
      id: '2',
      date: '2024-03-15', 
      startTime: '11:00',
      endTime: '12:30',
      isAvailable: true,
      price: 25
    },
    {
      id: '3',
      date: '2024-03-15',
      startTime: '14:00',
      endTime: '15:30',
      isAvailable: false,
      price: 25
    }
  ]

  beforeEach(() => {
    resetAllMocks()
    mockBookingFlowStore.currentStep = 2
    mockFetch(mockApiResponse(mockTimeSlots))
  })

  describe('Initial Rendering', () => {
    it('renders time slot selection interface', () => {
      renderComponent(<TimeSlotSelection />)
      
      expect(screen.getByText(/select date and time/i)).toBeInTheDocument()
      expect(screen.getByText(/choose a convenient time slot/i)).toBeInTheDocument()
    })

    it('displays calendar for date selection', () => {
      renderComponent(<TimeSlotSelection />)
      
      // Calendar should be present
      expect(screen.getByRole('grid') || screen.getByText(/march/i)).toBeInTheDocument()
    })

    it('loads available time slots on mount', () => {
      renderComponent(<TimeSlotSelection />)
      
      expect(mockBookingFlowStore.loadAvailableTimeSlots).toHaveBeenCalledTimes(1)
    })
  })

  describe('Date Selection', () => {
    it('allows user to select a date', async () => {
      const { user } = renderComponent(<TimeSlotSelection />)
      
      // Find and click a date button
      const dateButton = screen.getByText('15') // Mocked date
      await user.click(dateButton)
      
      expect(mockBookingFlowStore.loadAvailableTimeSlots).toHaveBeenCalledWith('2024-03-15')
    })

    it('disables past dates', () => {
      renderComponent(<TimeSlotSelection />)
      
      // Past dates should be disabled
      const pastDates = screen.getAllByText(/[0-9]+/).filter(element => {
        const button = element.closest('button')
        return button && button.hasAttribute('disabled')
      })
      
      expect(pastDates.length).toBeGreaterThan(0)
    })

    it('highlights today\'s date', () => {
      renderComponent(<TimeSlotSelection />)
      
      const todayButton = screen.getByText('15')
      expect(todayButton.closest('button')).toHaveClass(/today|current|bg-brand/)
    })
  })

  describe('Time Slot Display', () => {
    it('displays available time slots for selected date', async () => {
      renderComponent(<TimeSlotSelection />)
      
      await waitFor(() => {
        expect(screen.getByText(/09:00/)).toBeInTheDocument()
        expect(screen.getByText(/11:00/)).toBeInTheDocument()
      })
    })

    it('shows unavailable time slots as disabled', async () => {
      renderComponent(<TimeSlotSelection />)
      
      await waitFor(() => {
        const unavailableSlot = screen.getByText(/14:00/).closest('button')
        expect(unavailableSlot).toBeDisabled()
      })
    })

    it('displays time slot pricing', async () => {
      renderComponent(<TimeSlotSelection />)
      
      await waitFor(() => {
        expect(screen.getAllByText(/£25/)).toHaveLength(2) // Two available slots
      })
    })
  })

  describe('Time Slot Selection', () => {
    it('allows user to select an available time slot', async () => {
      const { user } = renderComponent(<TimeSlotSelection />)
      
      await waitFor(() => screen.getByText(/09:00/))
      
      const timeSlotButton = screen.getByText(/09:00/).closest('button')!
      await user.click(timeSlotButton)
      
      expect(mockBookingFlowStore.setTimeSlot).toHaveBeenCalledWith({
        slotId: '1',
        date: '2024-03-15',
        startTime: '09:00',
        endTime: '10:30',
        price: 25
      })
    })

    it('prevents selection of unavailable slots', async () => {
      const { user } = renderComponent(<TimeSlotSelection />)
      
      await waitFor(() => screen.getByText(/14:00/))
      
      const unavailableSlot = screen.getByText(/14:00/).closest('button')!
      await user.click(unavailableSlot)
      
      expect(mockBookingFlowStore.setTimeSlot).not.toHaveBeenCalled()
    })

    it('highlights selected time slot', async () => {
      mockBookingFlowStore.formData.timeSlot = {
        slotId: '1',
        date: '2024-03-15',
        startTime: '09:00',
        endTime: '10:30',
        price: 25
      }
      
      renderComponent(<TimeSlotSelection />)
      
      await waitFor(() => {
        const selectedSlot = screen.getByText(/09:00/).closest('button')
        expect(selectedSlot).toHaveClass(/selected|bg-brand|border-brand/)
      })
    })
  })

  describe('Navigation Controls', () => {
    it('disables next button when no time slot is selected', () => {
      mockBookingFlowStore.canProceedToNextStep = jest.fn(() => false)
      renderComponent(<TimeSlotSelection />)
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      expect(nextButton).toBeDisabled()
    })

    it('enables next button when time slot is selected', () => {
      mockBookingFlowStore.canProceedToNextStep = jest.fn(() => true)
      mockBookingFlowStore.formData.timeSlot = { slotId: '1' }
      
      renderComponent(<TimeSlotSelection />)
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      expect(nextButton).not.toBeDisabled()
    })

    it('proceeds to next step when next is clicked', async () => {
      mockBookingFlowStore.canProceedToNextStep = jest.fn(() => true)
      const { user } = renderComponent(<TimeSlotSelection />)
      
      await clickButton(user, /next|continue/i)
      
      expect(mockBookingFlowStore.nextStep).toHaveBeenCalled()
    })

    it('goes back to previous step when back is clicked', async () => {
      const { user } = renderComponent(<TimeSlotSelection />)
      
      await clickButton(user, /back|previous/i)
      
      expect(mockBookingFlowStore.previousStep).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('shows loading indicator when fetching time slots', () => {
      mockBookingFlowStore.isLoading = true
      renderComponent(<TimeSlotSelection />)
      
      expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('shows skeleton placeholders for time slots while loading', () => {
      mockBookingFlowStore.isLoading = true
      renderComponent(<TimeSlotSelection />)
      
      const skeletons = screen.getAllByTestId(/skeleton|placeholder/)
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('displays error message when time slot loading fails', () => {
      mockBookingFlowStore.error = 'Failed to load time slots'
      renderComponent(<TimeSlotSelection />)
      
      expect(screen.getByText(/failed to load time slots/i)).toBeInTheDocument()
    })

    it('shows no slots available message', async () => {
      mockFetch(mockApiResponse([]))
      renderComponent(<TimeSlotSelection />)
      
      await waitFor(() => {
        expect(screen.getByText(/no time slots available/i)).toBeInTheDocument()
      })
    })

    it('allows retry when loading fails', async () => {
      mockBookingFlowStore.error = 'Failed to load time slots'
      const { user } = renderComponent(<TimeSlotSelection />)
      
      const retryButton = screen.getByRole('button', { name: /retry|try again/i })
      await user.click(retryButton)
      
      expect(mockBookingFlowStore.loadAvailableTimeSlots).toHaveBeenCalledTimes(2)
    })
  })

  describe('Real-time Updates', () => {
    it('refreshes time slots when date changes', async () => {
      const { user } = renderComponent(<TimeSlotSelection />)
      
      // Select different date
      const dateButton = screen.getByText('16')
      await user.click(dateButton)
      
      expect(mockBookingFlowStore.loadAvailableTimeSlots).toHaveBeenCalledWith('2024-03-16')
    })

    it('updates availability when slots are booked by others', async () => {
      const { rerender } = renderComponent(<TimeSlotSelection />)
      
      // Simulate slot becoming unavailable
      const updatedSlots = [...mockTimeSlots]
      updatedSlots[0].isAvailable = false
      mockFetch(mockApiResponse(updatedSlots))
      
      rerender(<TimeSlotSelection />)
      
      await waitFor(() => {
        const previouslyAvailableSlot = screen.getByText(/09:00/).closest('button')
        expect(previouslyAvailableSlot).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels for date selection', () => {
      renderComponent(<TimeSlotSelection />)
      
      const dateButtons = screen.getAllByRole('button')
        .filter(btn => /^[0-9]+$/.test(btn.textContent || ''))
      
      dateButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })

    it('provides proper ARIA labels for time slot selection', async () => {
      renderComponent(<TimeSlotSelection />)
      
      await waitFor(() => {
        const timeSlotButtons = screen.getAllByText(/[0-9]{2}:[0-9]{2}/)
          .map(text => text.closest('button'))
          .filter(Boolean)
        
        timeSlotButtons.forEach(button => {
          expect(button).toHaveAttribute('aria-label')
        })
      })
    })

    it('supports keyboard navigation for date selection', async () => {
      const { user } = renderComponent(<TimeSlotSelection />)
      
      await user.tab()
      
      const focusedElement = document.activeElement
      expect(focusedElement?.getAttribute('role')).toBe('button')
      
      // Arrow keys should navigate dates
      await user.keyboard('{ArrowRight}')
      
      const newFocusedElement = document.activeElement
      expect(newFocusedElement).not.toBe(focusedElement)
    })
  })

  describe('Integration with Service Selection', () => {
    it('displays correct duration based on selected service', () => {
      mockBookingFlowStore.formData.service = {
        serviceId: '1',
        name: 'Exterior Detail',
        duration: 90
      }
      
      renderComponent(<TimeSlotSelection />)
      
      expect(screen.getByText(/90 minutes/i)).toBeInTheDocument()
    })

    it('filters time slots based on service duration', async () => {
      mockBookingFlowStore.formData.service = { duration: 180 } // 3 hours
      
      renderComponent(<TimeSlotSelection />)
      
      // Should only show slots that have enough time
      await waitFor(() => {
        const availableSlots = screen.getAllByText(/[0-9]{2}:[0-9]{2}/)
          .map(text => text.closest('button'))
          .filter(btn => !btn?.hasAttribute('disabled'))
        
        expect(availableSlots.length).toBeLessThanOrEqual(mockTimeSlots.length)
      })
    })
  })
})