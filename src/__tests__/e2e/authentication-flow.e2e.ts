/**
 * Authentication Flow E2E Test
 * 
 * Tests user authentication including registration, login, logout,
 * password reset, and role-based access control.
 */

import { test, expect } from '@playwright/test'
import { 
  AuthHelper,
  NavigationHelper, 
  AssertionHelper,
  generateTestEmail,
  waitForAnimation 
} from './helpers/test-helpers'

test.describe('Authentication Flow', () => {
  let authHelper: AuthHelper
  let navigationHelper: NavigationHelper
  let assertionHelper: AssertionHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    navigationHelper = new NavigationHelper(page)
    assertionHelper = new AssertionHelper(page)
  })

  test('registers new customer account successfully', async ({ page }) => {
    await test.step('Navigate to registration page', async () => {
      await page.goto('/auth/register')
      await assertionHelper.assertPageTitle('Register')
      await assertionHelper.assertElementVisible('[data-testid="register-form"]')
    })

    await test.step('Fill registration form with valid data', async () => {
      const testEmail = generateTestEmail()
      
      await page.fill('[data-testid="first-name"]', 'John')
      await page.fill('[data-testid="last-name"]', 'Doe')
      await page.fill('[data-testid="email"]', testEmail)
      await page.fill('[data-testid="password"]', 'TestPassword123!')
      await page.fill('[data-testid="confirm-password"]', 'TestPassword123!')
      
      // Accept terms and conditions
      await page.check('[data-testid="accept-terms"]')
      
      // Submit registration
      await page.click('[data-testid="register-button"]')
    })

    await test.step('Handle email verification', async () => {
      // Should redirect to email verification page
      await assertionHelper.assertURL(/\/auth\/verify/)
      await assertionHelper.assertElementVisible('[data-testid="verification-message"]')
      await assertionHelper.assertElementText('[data-testid="verification-message"]', 
        'Please check your email')
      
      // Should show resend verification option
      await assertionHelper.assertElementVisible('[data-testid="resend-verification"]')
    })
  })

  test('validates registration form fields', async ({ page }) => {
    await page.goto('/auth/register')

    await test.step('Shows validation errors for empty required fields', async () => {
      await page.click('[data-testid="register-button"]')
      
      await assertionHelper.assertValidationError('[data-testid="first-name"]', 'First name is required')
      await assertionHelper.assertValidationError('[data-testid="last-name"]', 'Last name is required')
      await assertionHelper.assertValidationError('[data-testid="email"]', 'Email is required')
      await assertionHelper.assertValidationError('[data-testid="password"]', 'Password is required')
    })

    await test.step('Validates email format', async () => {
      await page.fill('[data-testid="email"]', 'invalid-email')
      await page.click('[data-testid="register-button"]')
      
      await assertionHelper.assertValidationError('[data-testid="email"]', 'Invalid email format')
    })

    await test.step('Validates password strength', async () => {
      await page.fill('[data-testid="password"]', '123')
      await page.click('[data-testid="register-button"]')
      
      await assertionHelper.assertValidationError('[data-testid="password"]', 
        'Password must be at least 8 characters')
    })

    await test.step('Validates password confirmation', async () => {
      await page.fill('[data-testid="password"]', 'TestPassword123!')
      await page.fill('[data-testid="confirm-password"]', 'DifferentPassword')
      await page.click('[data-testid="register-button"]')
      
      await assertionHelper.assertValidationError('[data-testid="confirm-password"]', 
        'Passwords do not match')
    })

    await test.step('Requires terms acceptance', async () => {
      // Fill valid form but don't check terms
      await page.fill('[data-testid="first-name"]', 'John')
      await page.fill('[data-testid="last-name"]', 'Doe')
      await page.fill('[data-testid="email"]', generateTestEmail())
      await page.fill('[data-testid="password"]', 'TestPassword123!')
      await page.fill('[data-testid="confirm-password"]', 'TestPassword123!')
      
      await page.click('[data-testid="register-button"]')
      
      await assertionHelper.assertValidationError('[data-testid="accept-terms"]', 
        'You must accept the terms and conditions')
    })
  })

  test('logs in existing customer successfully', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto('/auth/login')
      await assertionHelper.assertPageTitle('Login')
      await assertionHelper.assertElementVisible('[data-testid="login-form"]')
    })

    await test.step('Login with valid credentials', async () => {
      await page.fill('[data-testid="email"]', 'test.customer@example.com')
      await page.fill('[data-testid="password"]', 'testpassword123')
      await page.click('[data-testid="login-button"]')
    })

    await test.step('Redirects to customer dashboard', async () => {
      await assertionHelper.assertURL(/\/dashboard/)
      await assertionHelper.assertElementVisible('[data-testid="customer-dashboard"]')
      
      // Should show user name in header
      await assertionHelper.assertElementVisible('[data-testid="user-menu"]')
      await assertionHelper.assertElementText('[data-testid="user-name"]', 'Test Customer')
    })
  })

  test('logs in admin user and shows admin interface', async ({ page }) => {
    await test.step('Login with admin credentials', async () => {
      await page.goto('/auth/login')
      await page.fill('[data-testid="email"]', 'test.admin@example.com')
      await page.fill('[data-testid="password"]', 'adminpassword123')
      await page.click('[data-testid="login-button"]')
    })

    await test.step('Redirects to admin dashboard', async () => {
      await assertionHelper.assertURL(/\/admin/)
      await assertionHelper.assertElementVisible('[data-testid="admin-dashboard"]')
      
      // Should show admin navigation
      await assertionHelper.assertElementVisible('[data-testid="admin-nav"]')
      await assertionHelper.assertElementVisible('[data-testid="admin-nav-bookings"]')
      await assertionHelper.assertElementVisible('[data-testid="admin-nav-customers"]')
    })
  })

  test('handles login validation and errors', async ({ page }) => {
    await page.goto('/auth/login')

    await test.step('Shows validation for empty fields', async () => {
      await page.click('[data-testid="login-button"]')
      
      await assertionHelper.assertValidationError('[data-testid="email"]', 'Email is required')
      await assertionHelper.assertValidationError('[data-testid="password"]', 'Password is required')
    })

    await test.step('Shows error for invalid credentials', async () => {
      await page.fill('[data-testid="email"]', 'invalid@example.com')
      await page.fill('[data-testid="password"]', 'wrongpassword')
      await page.click('[data-testid="login-button"]')
      
      await assertionHelper.assertElementVisible('[data-testid="error-message"]')
      await assertionHelper.assertElementText('[data-testid="error-message"]', 
        'Invalid email or password')
    })

    await test.step('Shows error for unverified account', async () => {
      // Mock API response for unverified account
      await page.route('**/api/auth/login', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              message: 'Email not verified',
              code: 'EMAIL_NOT_VERIFIED'
            }
          })
        })
      })
      
      await page.fill('[data-testid="email"]', 'unverified@example.com')
      await page.fill('[data-testid="password"]', 'password123')
      await page.click('[data-testid="login-button"]')
      
      await assertionHelper.assertElementText('[data-testid="error-message"]', 
        'Please verify your email before logging in')
    })
  })

  test('handles password reset flow', async ({ page }) => {
    await test.step('Navigate to forgot password page', async () => {
      await page.goto('/auth/login')
      await page.click('[data-testid="forgot-password-link"]')
      
      await assertionHelper.assertURL(/\/auth\/forgot-password/)
      await assertionHelper.assertElementVisible('[data-testid="forgot-password-form"]')
    })

    await test.step('Submit password reset request', async () => {
      await page.fill('[data-testid="email"]', 'test.customer@example.com')
      await page.click('[data-testid="send-reset-button"]')
      
      // Should show success message
      await assertionHelper.assertElementVisible('[data-testid="success-message"]')
      await assertionHelper.assertElementText('[data-testid="success-message"]', 
        'Password reset email sent')
    })

    await test.step('Validate email field', async () => {
      await page.goto('/auth/forgot-password')
      
      // Try with empty email
      await page.click('[data-testid="send-reset-button"]')
      await assertionHelper.assertValidationError('[data-testid="email"]', 'Email is required')
      
      // Try with invalid email
      await page.fill('[data-testid="email"]', 'invalid-email')
      await page.click('[data-testid="send-reset-button"]')
      await assertionHelper.assertValidationError('[data-testid="email"]', 'Invalid email format')
    })
  })

  test('logs out user successfully', async ({ page }) => {
    await test.step('Login first', async () => {
      await authHelper.loginAsCustomer()
      await navigationHelper.goToCustomerDashboard()
    })

    await test.step('Logout using user menu', async () => {
      await page.click('[data-testid="user-menu"]')
      await assertionHelper.assertElementVisible('[data-testid="user-dropdown"]')
      
      await page.click('[data-testid="logout-button"]')
    })

    await test.step('Redirects to home page and clears session', async () => {
      await assertionHelper.assertURL('/')
      
      // Should not show user menu anymore
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
      
      // Should show login/register buttons
      await assertionHelper.assertElementVisible('[data-testid="login-link"]')
      await assertionHelper.assertElementVisible('[data-testid="register-link"]')
    })

    await test.step('Cannot access protected pages after logout', async () => {
      await page.goto('/dashboard')
      
      // Should redirect to login
      await assertionHelper.assertURL(/\/auth\/login/)
      await assertionHelper.assertElementText('[data-testid="redirect-message"]', 
        'Please log in to access your dashboard')
    })
  })

  test('enforces role-based access control', async ({ page }) => {
    await test.step('Customer cannot access admin pages', async () => {
      await authHelper.loginAsCustomer()
      
      // Try to access admin page
      await page.goto('/admin')
      
      // Should redirect to unauthorized or login
      await assertionHelper.assertURL(/\/(auth|unauthorized)/)
      
      if (page.url().includes('/unauthorized')) {
        await assertionHelper.assertElementText('[data-testid="error-message"]', 
          'You do not have permission to access this page')
      }
    })

    await test.step('Admin can access admin pages', async () => {
      await authHelper.loginAsAdmin()
      
      // Should be able to access admin page
      await navigationHelper.goToAdminDashboard()
      await assertionHelper.assertElementVisible('[data-testid="admin-dashboard"]')
    })

    await test.step('Unauthenticated users cannot access protected pages', async () => {
      // Ensure logged out
      await page.goto('/')
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
      
      // Try to access customer dashboard
      await page.goto('/dashboard')
      await assertionHelper.assertURL(/\/auth\/login/)
      
      // Try to access admin dashboard
      await page.goto('/admin')
      await assertionHelper.assertURL(/\/auth\/login/)
    })
  })

  test('remembers user session across page refreshes', async ({ page }) => {
    await test.step('Login and verify session persistence', async () => {
      await authHelper.loginAsCustomer()
      await navigationHelper.goToCustomerDashboard()
      
      // Refresh the page
      await page.reload()
      
      // Should still be logged in
      await assertionHelper.assertElementVisible('[data-testid="customer-dashboard"]')
      await assertionHelper.assertElementVisible('[data-testid="user-menu"]')
    })

    await test.step('Session expires appropriately', async () => {
      // Mock expired session
      await page.evaluate(() => {
        localStorage.removeItem('supabase.auth.token')
      })
      
      await page.reload()
      
      // Should redirect to login
      await assertionHelper.assertURL(/\/auth\/login/)
    })
  })

  test('handles concurrent login attempts', async ({ page }) => {
    await test.step('Prevents multiple simultaneous login attempts', async () => {
      await page.goto('/auth/login')
      
      await page.fill('[data-testid="email"]', 'test.customer@example.com')
      await page.fill('[data-testid="password"]', 'testpassword123')
      
      // Click login button multiple times quickly
      await Promise.all([
        page.click('[data-testid="login-button"]'),
        page.click('[data-testid="login-button"]'),
        page.click('[data-testid="login-button"]')
      ])
      
      // Button should be disabled during processing
      const loginButton = page.locator('[data-testid="login-button"]')
      await expect(loginButton).toBeDisabled()
      
      // Should show loading state
      await assertionHelper.assertElementVisible('[data-testid="login-loading"]')
    })
  })

  test('supports social authentication', async ({ page }) => {
    await test.step('Shows social login options', async () => {
      await page.goto('/auth/login')
      
      // Should show social login buttons (if implemented)
      const socialButtons = page.locator('[data-testid="social-login"]')
      
      if (await socialButtons.count() > 0) {
        await assertionHelper.assertElementVisible('[data-testid="google-login"]')
        await assertionHelper.assertElementVisible('[data-testid="facebook-login"]')
      } else {
        test.skip('Social authentication not implemented')
      }
    })
  })

  test('handles email verification process', async ({ page }) => {
    await test.step('Resend verification email', async () => {
      await page.goto('/auth/verify')
      
      await assertionHelper.assertElementVisible('[data-testid="resend-verification"]')
      
      // Click resend
      await page.click('[data-testid="resend-verification"]')
      
      // Should show success message
      await assertionHelper.assertToast('Verification email sent')
      
      // Button should be disabled temporarily
      const resendButton = page.locator('[data-testid="resend-verification"]')
      await expect(resendButton).toBeDisabled()
    })

    await test.step('Handle verification link click', async () => {
      // Mock verification token in URL
      const token = 'mock-verification-token'
      await page.goto(`/auth/verify?token=${token}`)
      
      // Should show verification processing
      await assertionHelper.assertElementVisible('[data-testid="verifying-email"]')
      
      // Should redirect after successful verification
      await assertionHelper.assertURL(/\/dashboard/)
      await assertionHelper.assertToast('Email verified successfully')
    })
  })

  test('maintains accessibility standards', async ({ page }) => {
    await test.step('Login form is accessible', async () => {
      await page.goto('/auth/login')
      
      // Form fields should have proper labels
      const emailField = page.locator('[data-testid="email"]')
      const passwordField = page.locator('[data-testid="password"]')
      
      await expect(emailField).toHaveAttribute('aria-label')
      await expect(passwordField).toHaveAttribute('aria-label')
      
      // Form should be keyboard navigable
      await page.keyboard.press('Tab')
      await expect(emailField).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(passwordField).toBeFocused()
      
      await page.keyboard.press('Tab')
      const loginButton = page.locator('[data-testid="login-button"]')
      await expect(loginButton).toBeFocused()
    })

    await test.step('Error messages are announced to screen readers', async () => {
      await page.goto('/auth/login')
      
      await page.click('[data-testid="login-button"]')
      
      const errorMessage = page.locator('[data-testid="error-message"]')
      await expect(errorMessage).toHaveAttribute('role', 'alert')
      await expect(errorMessage).toHaveAttribute('aria-live', 'polite')
    })
  })
})