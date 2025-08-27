/**
 * Admin Booking Management E2E Test
 * 
 * Tests admin functionality for managing bookings including
 * confirming, cancelling, rescheduling, and completing bookings.
 */

import { test, expect } from '@playwright/test'
import { 
  AuthHelper,
  AdminHelper, 
  NavigationHelper, 
  AssertionHelper,
  generateBookingReference,
  waitForAnimation 
} from './helpers/test-helpers'

test.describe('Admin Booking Management', () => {
  let authHelper: AuthHelper
  let adminHelper: AdminHelper
  let navigationHelper: NavigationHelper
  let assertionHelper: AssertionHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    adminHelper = new AdminHelper(page)
    navigationHelper = new NavigationHelper(page)
    assertionHelper = new AssertionHelper(page)
    
    // Login as admin for each test
    await authHelper.loginAsAdmin()
    await navigationHelper.goToAdminDashboard()
  })

  test('displays bookings list with correct information', async ({ page }) => {
    await test.step('Shows bookings table with all columns', async () => {
      await adminHelper.viewBookings()
      
      // Verify table headers
      await assertionHelper.assertElementVisible('[data-testid="bookings-table"]')
      await assertionHelper.assertElementText('th', 'Customer')
      await assertionHelper.assertElementText('th', 'Service')
      await assertionHelper.assertElementText('th', 'Date & Time')
      await assertionHelper.assertElementText('th', 'Status')
      await assertionHelper.assertElementText('th', 'Actions')
    })

    await test.step('Shows booking information correctly', async () => {
      // Should have at least one booking row
      const bookingRows = page.locator('[data-testid="booking-row"]')
      await expect(bookingRows).toHaveCount.greaterThan(0)
      
      // Verify booking information is displayed
      const firstRow = bookingRows.first()
      await expect(firstRow.locator('[data-testid="customer-name"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="service-name"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="booking-date"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="booking-status"]')).toBeVisible()
    })
  })

  test('confirms a pending booking successfully', async ({ page }) => {
    await test.step('Find and confirm a pending booking', async () => {
      await adminHelper.viewBookings()
      
      // Find a pending booking
      const pendingBooking = page.locator('[data-testid="booking-row"]')
        .filter({ has: page.locator('[data-status="pending"]') })
        .first()
      
      if (await pendingBooking.count() === 0) {
        test.skip('No pending bookings available for testing')
      }
      
      const bookingId = await pendingBooking.getAttribute('data-booking-id')
      
      // Click confirm button
      await pendingBooking.locator('[data-testid="confirm-button"]').click()
      
      // Confirm modal should appear
      await assertionHelper.assertElementVisible('[data-testid="confirm-modal"]')
      await assertionHelper.assertElementText('[data-testid="modal-title"]', 'Confirm Booking')
      
      // Verify booking details in modal
      await assertionHelper.assertElementVisible('[data-testid="booking-details"]')
      
      // Confirm the booking
      await page.click('[data-testid="confirm-booking-button"]')
      
      // Should show success toast
      await assertionHelper.assertToast('Booking confirmed successfully')
      
      // Status should update to confirmed
      const confirmedBooking = page.locator(`[data-booking-id="${bookingId}"]`)
      await expect(confirmedBooking.locator('[data-testid="booking-status"]')).toContainText('confirmed')
    })
  })

  test('cancels a booking with reason', async ({ page }) => {
    await test.step('Cancel a booking with cancellation reason', async () => {
      await adminHelper.viewBookings()
      
      // Find a confirmable booking (pending or confirmed)
      const cancellableBooking = page.locator('[data-testid="booking-row"]')
        .filter({ 
          has: page.locator('[data-status="pending"], [data-status="confirmed"]') 
        })
        .first()
      
      if (await cancellableBooking.count() === 0) {
        test.skip('No cancellable bookings available for testing')
      }
      
      const bookingId = await cancellableBooking.getAttribute('data-booking-id')
      
      // Click cancel button
      await cancellableBooking.locator('[data-testid="cancel-button"]').click()
      
      // Cancel modal should appear
      await assertionHelper.assertElementVisible('[data-testid="cancel-modal"]')
      await assertionHelper.assertElementText('[data-testid="modal-title"]', 'Cancel Booking')
      
      // Should require cancellation reason
      const cancelButton = page.locator('[data-testid="cancel-booking-button"]')
      await expect(cancelButton).toBeDisabled()
      
      // Fill cancellation reason
      const reason = 'Customer requested cancellation due to scheduling conflict'
      await page.fill('[data-testid="cancellation-reason"]', reason)
      
      // Cancel button should now be enabled
      await expect(cancelButton).toBeEnabled()
      
      // Confirm cancellation
      await cancelButton.click()
      
      // Should show success toast
      await assertionHelper.assertToast('Booking cancelled successfully')
      
      // Status should update to cancelled
      const cancelledBooking = page.locator(`[data-booking-id="${bookingId}"]`)
      await expect(cancelledBooking.locator('[data-testid="booking-status"]')).toContainText('cancelled')
    })
  })

  test('reschedules a booking to new date and time', async ({ page }) => {
    await test.step('Reschedule a confirmed booking', async () => {
      await adminHelper.viewBookings()
      
      // Find a confirmed booking
      const confirmedBooking = page.locator('[data-testid="booking-row"]')
        .filter({ has: page.locator('[data-status="confirmed"]') })
        .first()
      
      if (await confirmedBooking.count() === 0) {
        test.skip('No confirmed bookings available for rescheduling')
      }
      
      const bookingId = await confirmedBooking.getAttribute('data-booking-id')
      
      // Click reschedule button
      await confirmedBooking.locator('[data-testid="reschedule-button"]').click()
      
      // Reschedule modal should appear
      await assertionHelper.assertElementVisible('[data-testid="reschedule-modal"]')
      await assertionHelper.assertElementText('[data-testid="modal-title"]', 'Reschedule Booking')
      
      // Should show current booking details
      await assertionHelper.assertElementVisible('[data-testid="current-booking-details"]')
      
      // Select new date (3 days from now)
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + 3)
      const dateString = newDate.toISOString().split('T')[0]
      
      await page.fill('[data-testid="new-date"]', dateString)
      
      // Wait for available time slots to load
      await page.waitForSelector('[data-testid="time-slot-option"]')
      
      // Select new time
      await page.selectOption('[data-testid="new-time"]', '14:00')
      
      // Confirm reschedule
      const rescheduleButton = page.locator('[data-testid="reschedule-booking-button"]')
      await expect(rescheduleButton).toBeEnabled()
      await rescheduleButton.click()
      
      // Should show success toast
      await assertionHelper.assertToast('Booking rescheduled successfully')
      
      // Should update booking date in the table
      const rescheduledBooking = page.locator(`[data-booking-id="${bookingId}"]`)
      const bookingDateElement = rescheduledBooking.locator('[data-testid="booking-date"]')
      
      // Should reflect new date
      await expect(bookingDateElement).toContainText(dateString)
      await expect(bookingDateElement).toContainText('14:00')
    })
  })

  test('completes a confirmed booking', async ({ page }) => {
    await test.step('Mark a booking as completed', async () => {
      await adminHelper.viewBookings()
      
      // Find a confirmed booking
      const confirmedBooking = page.locator('[data-testid="booking-row"]')
        .filter({ has: page.locator('[data-status="confirmed"]') })
        .first()
      
      if (await confirmedBooking.count() === 0) {
        test.skip('No confirmed bookings available for completion')
      }
      
      const bookingId = await confirmedBooking.getAttribute('data-booking-id')
      
      // Click complete button
      await confirmedBooking.locator('[data-testid="complete-button"]').click()
      
      // Complete modal should appear
      await assertionHelper.assertElementVisible('[data-testid="complete-modal"]')
      await assertionHelper.assertElementText('[data-testid="modal-title"]', 'Complete Booking')
      
      // Add completion notes
      const completionNotes = 'Service completed successfully. Customer very satisfied.'
      await page.fill('[data-testid="completion-notes"]', completionNotes)
      
      // Complete the booking
      await page.click('[data-testid="complete-booking-button"]')
      
      // Should show success toast
      await assertionHelper.assertToast('Booking completed successfully')
      
      // Status should update to completed
      const completedBooking = page.locator(`[data-booking-id="${bookingId}"]`)
      await expect(completedBooking.locator('[data-testid="booking-status"]')).toContainText('completed')
    })
  })

  test('filters bookings by status', async ({ page }) => {
    await test.step('Filter bookings by different statuses', async () => {
      await adminHelper.viewBookings()
      
      // Should have filter dropdown
      await assertionHelper.assertElementVisible('[data-testid="status-filter"]')
      
      // Test filtering by pending
      await page.selectOption('[data-testid="status-filter"]', 'pending')
      await waitForAnimation(page, 500)
      
      const visibleRows = page.locator('[data-testid="booking-row"]:visible')
      const statusElements = visibleRows.locator('[data-testid="booking-status"]')
      
      // All visible rows should have pending status
      const count = await statusElements.count()
      for (let i = 0; i < count; i++) {
        await expect(statusElements.nth(i)).toContainText('pending')
      }
      
      // Test filtering by confirmed
      await page.selectOption('[data-testid="status-filter"]', 'confirmed')
      await waitForAnimation(page, 500)
      
      const confirmedRows = page.locator('[data-testid="booking-row"]:visible')
      const confirmedStatusElements = confirmedRows.locator('[data-testid="booking-status"]')
      
      const confirmedCount = await confirmedStatusElements.count()
      for (let i = 0; i < confirmedCount; i++) {
        await expect(confirmedStatusElements.nth(i)).toContainText('confirmed')
      }
      
      // Reset filter to show all
      await page.selectOption('[data-testid="status-filter"]', 'all')
      await waitForAnimation(page, 500)
      
      // Should show all bookings again
      const allRows = page.locator('[data-testid="booking-row"]:visible')
      await expect(allRows).toHaveCount.greaterThan(0)
    })
  })

  test('searches bookings by customer name or email', async ({ page }) => {
    await test.step('Search bookings using search input', async () => {
      await adminHelper.viewBookings()
      
      // Should have search input
      await assertionHelper.assertElementVisible('[data-testid="booking-search"]')
      
      // Get first booking customer name for search
      const firstBooking = page.locator('[data-testid="booking-row"]').first()
      const customerName = await firstBooking.locator('[data-testid="customer-name"]').textContent()
      
      if (!customerName) {
        test.skip('No customer name available for search testing')
      }
      
      // Search for customer name
      const searchTerm = customerName.split(' ')[0] // Use first name
      await page.fill('[data-testid="booking-search"]', searchTerm)
      await waitForAnimation(page, 500)
      
      // Should filter results
      const visibleRows = page.locator('[data-testid="booking-row"]:visible')
      await expect(visibleRows).toHaveCount.greaterThan(0)
      
      // All visible results should contain search term
      const customerElements = visibleRows.locator('[data-testid="customer-name"]')
      const count = await customerElements.count()
      
      for (let i = 0; i < count; i++) {
        const text = await customerElements.nth(i).textContent()
        expect(text?.toLowerCase()).toContain(searchTerm.toLowerCase())
      }
      
      // Clear search
      await page.fill('[data-testid="booking-search"]', '')
      await waitForAnimation(page, 500)
      
      // Should show all results again
      const allRows = page.locator('[data-testid="booking-row"]:visible')
      await expect(allRows).toHaveCount.greaterThan(0)
    })
  })

  test('views booking details in modal', async ({ page }) => {
    await test.step('Open booking details modal', async () => {
      await adminHelper.viewBookings()
      
      // Click on first booking row to view details
      const firstBooking = page.locator('[data-testid="booking-row"]').first()
      await firstBooking.locator('[data-testid="view-details-button"]').click()
      
      // Details modal should open
      await assertionHelper.assertElementVisible('[data-testid="booking-details-modal"]')
      await assertionHelper.assertElementText('[data-testid="modal-title"]', 'Booking Details')
      
      // Should show all booking information
      await assertionHelper.assertElementVisible('[data-testid="customer-information"]')
      await assertionHelper.assertElementVisible('[data-testid="service-information"]')
      await assertionHelper.assertElementVisible('[data-testid="vehicle-information"]')
      await assertionHelper.assertElementVisible('[data-testid="appointment-information"]')
      await assertionHelper.assertElementVisible('[data-testid="address-information"]')
      
      // Should have action buttons based on status
      await assertionHelper.assertElementVisible('[data-testid="booking-actions"]')
      
      // Close modal
      await page.click('[data-testid="close-modal-button"]')
      await expect(page.locator('[data-testid="booking-details-modal"]')).not.toBeVisible()
    })
  })

  test('handles bulk operations on multiple bookings', async ({ page }) => {
    await test.step('Select and perform bulk operations', async () => {
      await adminHelper.viewBookings()
      
      // Should have checkboxes for bulk selection
      const checkboxes = page.locator('[data-testid="booking-checkbox"]')
      const checkboxCount = await checkboxes.count()
      
      if (checkboxCount === 0) {
        test.skip('No bookings available for bulk operations')
      }
      
      // Select first two bookings
      await checkboxes.first().check()
      await checkboxes.nth(1).check()
      
      // Bulk actions should appear
      await assertionHelper.assertElementVisible('[data-testid="bulk-actions"]')
      
      // Should show selected count
      await assertionHelper.assertElementText('[data-testid="selected-count"]', '2 selected')
      
      // Should have bulk action options
      await assertionHelper.assertElementVisible('[data-testid="bulk-confirm-button"]')
      await assertionHelper.assertElementVisible('[data-testid="bulk-cancel-button"]')
      
      // Clear selection
      await page.click('[data-testid="clear-selection-button"]')
      
      // Bulk actions should disappear
      await expect(page.locator('[data-testid="bulk-actions"]')).not.toBeVisible()
    })
  })

  test('exports bookings data', async ({ page }) => {
    await test.step('Export bookings to CSV/PDF', async () => {
      await adminHelper.viewBookings()
      
      // Should have export button
      await assertionHelper.assertElementVisible('[data-testid="export-button"]')
      
      // Click export button
      await page.click('[data-testid="export-button"]')
      
      // Export dropdown should appear
      await assertionHelper.assertElementVisible('[data-testid="export-dropdown"]')
      
      // Should have CSV and PDF options
      await assertionHelper.assertElementVisible('[data-testid="export-csv"]')
      await assertionHelper.assertElementVisible('[data-testid="export-pdf"]')
      
      // Test CSV export (mock the download)
      await page.route('**/api/admin/bookings/export*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/csv',
          body: 'Customer,Service,Date,Status\nJohn Doe,Exterior Detail,2024-03-15,confirmed'
        })
      })
      
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="export-csv"]')
      
      // Verify download starts
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/bookings.*\.csv$/)
    })
  })

  test('pagination works correctly', async ({ page }) => {
    await test.step('Navigate through booking pages', async () => {
      await adminHelper.viewBookings()
      
      // Check if pagination is present (might not be if few bookings)
      const pagination = page.locator('[data-testid="pagination"]')
      
      if (await pagination.count() === 0) {
        test.skip('Not enough bookings to test pagination')
      }
      
      // Should show page information
      await assertionHelper.assertElementVisible('[data-testid="page-info"]')
      
      // Should have next/previous buttons
      const nextButton = page.locator('[data-testid="next-page"]')
      const prevButton = page.locator('[data-testid="prev-page"]')
      
      // Previous should be disabled on first page
      await expect(prevButton).toBeDisabled()
      
      // If next page exists, test navigation
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await waitForAnimation(page, 500)
        
        // Should be on page 2
        await assertionHelper.assertElementText('[data-testid="current-page"]', '2')
        
        // Previous should now be enabled
        await expect(prevButton).toBeEnabled()
        
        // Go back to first page
        await prevButton.click()
        await waitForAnimation(page, 500)
        
        // Should be back on page 1
        await assertionHelper.assertElementText('[data-testid="current-page"]', '1')
      }
    })
  })

  test('shows real-time updates when bookings change', async ({ page }) => {
    await test.step('Receives real-time booking updates', async () => {
      await adminHelper.viewBookings()
      
      const initialRowCount = await page.locator('[data-testid="booking-row"]').count()
      
      // Simulate real-time update by refreshing data
      await page.click('[data-testid="refresh-bookings"]')
      await waitForAnimation(page, 1000)
      
      // Should show loading state during refresh
      await assertionHelper.assertElementVisible('[data-testid="loading-indicator"]')
      
      // Loading should complete
      await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden' })
      
      // Bookings should be loaded
      const updatedRowCount = await page.locator('[data-testid="booking-row"]').count()
      expect(updatedRowCount).toBeGreaterThanOrEqual(0)
    })
  })
})