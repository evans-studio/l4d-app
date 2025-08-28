import React from 'react'
import { render, screen } from '@testing-library/react'
import { TimeSlotSelection } from '@/components/booking/steps/TimeSlotSelection'

describe('Booking Flow Integration - minimal render', () => {
  it('renders TimeSlotSelection heading', () => {
    // Render within a minimal wrapper; store is mocked in setup
    render(<TimeSlotSelection />)
    expect(screen.getByText(/Choose Date & Time/i)).toBeInTheDocument()
  })
})


