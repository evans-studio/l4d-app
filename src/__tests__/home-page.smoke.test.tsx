import React from 'react'
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}))

// Mock auth compatibility to avoid provider requirements in test
jest.mock('@/lib/auth-compat', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    signOut: jest.fn(),
    signIn: jest.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

describe('HomePage', () => {
  it('renders the hero and services section headings', () => {
    render(<HomePage />)
    expect(screen.getByText(/Our Services/i)).toBeInTheDocument()
  })
})


