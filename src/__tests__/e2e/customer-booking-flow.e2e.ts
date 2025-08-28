/**
 * Customer Booking Flow E2E Test
 * 
 * Tests the complete customer booking journey from service selection
 * to booking confirmation, including form validation and error handling.
 */

import { test, expect } from '@playwright/test'
import { 
  BookingHelper, 
  NavigationHelper, 
  AssertionHelper, 
  generateTestEmail,
  waitForAnimation 
} from './helpers/test-helpers'

test.describe('Customer Booking Flow', () => {
  let bookingHelper: BookingHelper
  let navigationHelper: NavigationHelper
  let assertionHelper: AssertionHelper

  test.beforeEach(async ({ page }) => {
    bookingHelper = new BookingHelper(page)
    navigationHelper = new NavigationHelper(page)
    assertionHelper = new AssertionHelper(page)
    
    // Start fresh for each test
    await navigationHelper.goToBooking()
  })

  test('completes full booking flow successfully', async ({ page }) => {
    // Step 1: Service Selection
    await test.step('Select service', async () => {
      await assertionHelper.assertElementVisible('[data-testid="service-selection"]')
      await bookingHelper.selectService('Exterior Detail')
    })

    // Step 2: Time Slot Selection  
    await test.step('Select time slot', async () => {
      await assertionHelper.assertElementVisible('[data-testid="time-slot-selection"]')
      await bookingHelper.selectTimeSlot(1) // Tomorrow
    })

    // Step 3: Vehicle Details
    await test.step('Fill vehicle details', async () => {
      await assertionHelper.assertElementVisible('[data-testid="vehicle-details"]')
      await bookingHelper.fillVehicleDetails({
        make: 'Honda',
        model: 'Civic',
        year: '2021',
        color: 'White',
        licensePlate: 'ABC123'
      })
    })

    // Step 4: User Details
    await test.step('Fill user details', async () => {
      await assertionHelper.assertElementVisible('[data-testid="user-details"]')
      await bookingHelper.fillUserDetails({
        firstName: 'Jane',
        lastName: 'Smith', 
        email: generateTestEmail(),
        phone: '07987654321'
      })
    })

    // Step 5: Address Details
    await test.step('Fill address details', async () => {
      await assertionHelper.assertElementVisible('[data-testid="address-details"]')
      await bookingHelper.fillAddress({
        street: '456 Oak Avenue',
        city: 'London',
        postcode: 'W1B 5TG'
      })
    })

    // Step 6: Confirmation
    await test.step('Confirm booking', async () => {
      await assertionHelper.assertElementVisible('[data-testid="booking-confirmation"]')
      
      // Verify booking summary
      await assertionHelper.assertElementText('[data-testid="service-name"]', 'Exterior Detail')
      await assertionHelper.assertElementText('[data-testid="vehicle-info"]', 'Honda Civic')
      await assertionHelper.assertElementText('[data-testid="customer-name"]', 'Jane Smith')
      
      // Confirm booking
      await page.click('[data-testid="confirm-booking"]')
      
      // Wait for success message
      await assertionHelper.assertElementVisible('[data-testid="booking-success"]')
      await assertionHelper.assertElementText('[data-testid="success-message"]', 'Booking confirmed')
      
      // Should show booking reference
      const bookingRef = await page.locator('[data-testid="booking-reference"]').textContent()
      expect(bookingRef).toMatch(/^[A-Z0-9]{6,}$/) // Alphanumeric reference
    })
  })

  test('validates required fields at each step', async ({ page }) => {
    // Step 1: Service Selection - try to proceed without selection
    await test.step('Validates service selection requirement', async () => {
      const nextButton = page.locator('[data-testid="next-button"]')
      await expect(nextButton).toBeDisabled()
    })

    // Select service and proceed to next step
    await bookingHelper.selectService()

    // Step 2: Time Slot Selection - try to proceed without selection
    await test.step('Validates time slot selection requirement', async () => {
      const nextButton = page.locator('[data-testid="next-button"]')
      await expect(nextButton).toBeDisabled()
    })

    // Select time slot and proceed
    await bookingHelper.selectTimeSlot()

    // Step 3: Vehicle Details - validate required fields
    await test.step('Validates vehicle details requirements', async () => {
      // Try to proceed without filling form
      await page.click('[data-testid="next-button"]')
      
      await assertionHelper.assertValidationError('[data-testid="vehicle-make"]', 'Make is required')
      await assertionHelper.assertValidationError('[data-testid="vehicle-model"]', 'Model is required')
      await assertionHelper.assertValidationError('[data-testid="vehicle-year"]', 'Year is required')
    })

    // Fill valid vehicle details
    await bookingHelper.fillVehicleDetails()

    // Step 4: User Details - validate required fields and formats
    await test.step('Validates user details requirements', async () => {
      // Try to proceed without filling form
      await page.click('[data-testid="next-button"]')
      
      await assertionHelper.assertValidationError('[data-testid="first-name"]', 'First name is required')
      await assertionHelper.assertValidationError('[data-testid="last-name"]', 'Last name is required')
      await assertionHelper.assertValidationError('[data-testid="email"]', 'Email is required')
      
      // Test invalid email format
      await page.fill('[data-testid="email"]', 'invalid-email')
      await page.click('[data-testid="next-button"]')
      await assertionHelper.assertValidationError('[data-testid="email"]', 'Invalid email format')
      
      // Test invalid phone format
      await page.fill('[data-testid="phone"]', '123')
      await page.click('[data-testid="next-button"]')
      await assertionHelper.assertValidationError('[data-testid="phone"]', 'Invalid phone number')
    })
  })

  test('handles unavailable time slots gracefully', async ({ page }) => {
    // Select service first
    await bookingHelper.selectService()
    
    await test.step('Shows no available slots message', async () => {
      // Mock API response for no available slots
      await page.route('**/api/booking/time-slots*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        })
      })
      
      // Select a date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 7)
      const dateButton = page.locator(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`)
      await dateButton.click()
      
      // Should show no slots message
      await assertionHelper.assertElementVisible('[data-testid="no-slots-message"]')
      await assertionHelper.assertElementText('[data-testid="no-slots-message"]', 'No time slots available')
    })
  })

  test('allows editing previous steps', async ({ page }) => {
    // Complete first two steps
    await bookingHelper.selectService('Interior Detail')
    await bookingHelper.selectTimeSlot(2)
    
    await test.step('Can navigate back to edit service', async () => {
      // Click back to service selection
      await page.click('[data-testid="step-indicator-1"]')
      await assertionHelper.assertElementVisible('[data-testid="service-selection"]')
      
      // Change service selection
      await bookingHelper.selectService('Exterior Detail')
      
      // Should advance back to time slot with new service
      await assertionHelper.assertElementVisible('[data-testid="time-slot-selection"]')
      await assertionHelper.assertElementText('[data-testid="selected-service"]', 'Exterior Detail')
    })
  })

  test('persists form data across page refresh', async ({ page }) => {
    // Fill some form data
    await bookingHelper.selectService('Exterior Detail')
    await bookingHelper.selectTimeSlot()
    
    // Fill vehicle details
    await page.fill('[data-testid="vehicle-make"]', 'Tesla')
    await page.fill('[data-testid="vehicle-model"]', 'Model 3')
    
    await test.step('Form data persists after page refresh', async () => {
      // Refresh the page
      await page.reload()
      
      // Should be on the same step with data preserved
      await assertionHelper.assertElementVisible('[data-testid="vehicle-details"]')
      
      const makeField = page.locator('[data-testid="vehicle-make"]')
      const modelField = page.locator('[data-testid="vehicle-model"]')
      
      await expect(makeField).toHaveValue('Tesla')
      await expect(modelField).toHaveValue('Model 3')
    })
  })

  test('handles API errors gracefully', async ({ page }) => {
    // Select service and time slot
    await bookingHelper.selectService()
    await bookingHelper.selectTimeSlot()
    await bookingHelper.fillVehicleDetails()
    await bookingHelper.fillUserDetails()
    await bookingHelper.fillAddress()
    
    await test.step('Shows error message when booking fails', async () => {
      // Mock API error response
      await page.route('**/api/booking/create', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              message: 'Failed to create booking',
              code: 'BOOKING_ERROR'
            }
          })
        })
      })
      
      // Try to confirm booking
      await page.click('[data-testid="confirm-booking"]')
      
      // Should show error message
      await assertionHelper.assertElementVisible('[data-testid="error-message"]')
      await assertionHelper.assertElementText('[data-testid="error-message"]', 'Failed to create booking')
      
      // Should still be on confirmation step
      await assertionHelper.assertElementVisible('[data-testid="booking-confirmation"]')
    })
  })

  test('calculates pricing correctly', async ({ page }) => {
    await test.step('Shows correct pricing based on selections', async () => {
      // Select a service with known pricing
      await bookingHelper.selectService('Exterior Detail')
      
      // Should show base price
      await assertionHelper.assertElementText('[data-testid="base-price"]', '£25')
      
      // Select time slot and proceed
      await bookingHelper.selectTimeSlot()
      await bookingHelper.fillVehicleDetails()
      
      // On confirmation step, verify total calculation
      await bookingHelper.fillUserDetails()
      await bookingHelper.fillAddress()
      
      await assertionHelper.assertElementVisible('[data-testid="booking-confirmation"]')
      await assertionHelper.assertElementText('[data-testid="total-price"]', '£25')
      
      // Pricing breakdown should be visible
      await assertionHelper.assertElementVisible('[data-testid="pricing-breakdown"]')
    })
  })

  test('is accessible via keyboard navigation', async ({ page }) => {
    await test.step('Can navigate booking form with keyboard', async () => {
      // Tab through service selection
      await page.keyboard.press('Tab')
      
      // Should focus on first service
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toHaveAttribute('data-testid', 'service-card')
      
      // Enter key should select service
      await page.keyboard.press('Enter')
      await page.keyboard.press('Tab')
      
      // Should focus on next button
      await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'next-button')
      
      // Enter should proceed to next step
      await page.keyboard.press('Enter')
      await assertionHelper.assertElementVisible('[data-testid="time-slot-selection"]')
    })
  })

  test('works on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await test.step('Booking flow works on mobile', async () => {
      // Service selection should be touch-friendly
      await assertionHelper.assertElementVisible('[data-testid="service-selection"]')
      
      const serviceCard = page.locator('[data-testid="service-card"]').first()
      await expect(serviceCard).toHaveCSS('min-height', /48px|44px/) // Touch target size
      
      // Complete booking flow on mobile
      await bookingHelper.selectService()
      await bookingHelper.selectTimeSlot()
      await bookingHelper.fillVehicleDetails()
      await bookingHelper.fillUserDetails()
      await bookingHelper.fillAddress()
      
      // Confirmation should be visible on mobile
      await assertionHelper.assertElementVisible('[data-testid="booking-confirmation"]')
    })
  })
})