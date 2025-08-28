import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/primitives/Button'

describe('Button (smoke)', () => {
  it('renders primary label', () => {
    render(<Button variant="primary">Book Now</Button>)
    expect(screen.getByText('Book Now')).toBeInTheDocument()
  })
})


