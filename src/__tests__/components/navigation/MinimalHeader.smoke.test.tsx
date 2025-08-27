import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn() })
}))

jest.mock('@/lib/auth-compat', () => ({
  useAuth: () => ({ user: null, profile: null, isLoading: false, logout: jest.fn() })
}))

import MinimalHeader from '@/components/navigation/MinimalHeader'

describe('MinimalHeader (smoke)', () => {
  it('renders brand text and auth buttons', () => {
    render(<MinimalHeader />)
    expect(screen.getByText('LOVE 4 DETAILING')).toBeInTheDocument()
    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})


