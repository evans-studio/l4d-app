/**
 * Status Transition Validation System
 * Ensures only valid status transitions are allowed
 */

export type BookingStatus = 
  | 'pending'
  | 'processing'
  | 'payment_failed'
  | 'confirmed'
  | 'rescheduled'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'no_show'

// Define valid status transitions
export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['processing', 'confirmed', 'declined', 'cancelled'],
  processing: ['confirmed', 'payment_failed', 'cancelled'],
  payment_failed: ['processing', 'cancelled'],
  confirmed: ['in_progress', 'rescheduled', 'cancelled'],
  rescheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['in_progress'], // Allow reversal if needed
  declined: ['pending'], // Allow reconsideration
  cancelled: ['pending'], // Allow reactivation
  no_show: ['pending'] // Allow reactivation
}

// Status categories for business logic
export const STATUS_CATEGORIES = {
  ACTIVE: ['pending', 'processing', 'confirmed', 'rescheduled', 'in_progress'],
  PAYMENT_REQUIRED: ['processing', 'payment_failed'],
  SERVICE_READY: ['confirmed', 'rescheduled'],
  COMPLETED: ['completed'],
  INACTIVE: ['declined', 'cancelled', 'no_show']
}

// Status priorities (higher number = more advanced in workflow)
export const STATUS_PRIORITY: Record<BookingStatus, number> = {
  pending: 1,
  processing: 2,
  payment_failed: 2,
  confirmed: 3,
  rescheduled: 3,
  in_progress: 4,
  completed: 5,
  declined: 0,
  cancelled: 0,
  no_show: 0
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(fromStatus: BookingStatus, toStatus: BookingStatus): boolean {
  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) || false
}

/**
 * Get all valid next statuses for a given current status
 */
export function getValidNextStatuses(currentStatus: BookingStatus): BookingStatus[] {
  return VALID_TRANSITIONS[currentStatus] || []
}

/**
 * Get transition validation result with detailed information
 */
export interface TransitionValidation {
  valid: boolean
  reason?: string
  warning?: string
  requiresConfirmation?: boolean
}

export function validateTransition(
  fromStatus: BookingStatus, 
  toStatus: BookingStatus,
  paymentStatus?: 'pending' | 'completed' | 'failed'
): TransitionValidation {
  // Check basic transition validity
  if (!isValidTransition(fromStatus, toStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from "${fromStatus}" to "${toStatus}". Invalid status change.`
    }
  }

  // Business logic validations
  const validation: TransitionValidation = { valid: true }

  // Payment-related validations
  if (toStatus === 'confirmed' && fromStatus === 'processing') {
    if (paymentStatus !== 'completed') {
      validation.warning = 'Marking as confirmed without payment confirmation. Ensure payment was received.'
      validation.requiresConfirmation = true
    }
  }

  if (toStatus === 'payment_failed' && fromStatus === 'processing') {
    validation.requiresConfirmation = true
    validation.warning = 'This will mark the payment as failed and may trigger cancellation.'
  }

  // Service progression validations
  if (toStatus === 'in_progress' && !STATUS_CATEGORIES.SERVICE_READY.includes(fromStatus)) {
    return {
      valid: false,
      reason: 'Cannot start service until booking is confirmed and payment is received.'
    }
  }

  // Completion validations
  if (toStatus === 'completed' && fromStatus !== 'in_progress') {
    validation.warning = 'Completing service without marking as in progress first.'
    validation.requiresConfirmation = true
  }

  // Destructive action warnings
  if (['cancelled', 'declined', 'no_show'].includes(toStatus)) {
    validation.requiresConfirmation = true
    if (STATUS_CATEGORIES.ACTIVE.includes(fromStatus)) {
      validation.warning = `This will ${toStatus === 'cancelled' ? 'cancel' : toStatus === 'declined' ? 'decline' : 'mark as no-show'} an active booking.`
    }
  }

  return validation
}

/**
 * Get user-friendly status labels
 */
export function getStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    pending: 'Pending Review',
    processing: 'Processing Payment',
    payment_failed: 'Payment Failed',
    confirmed: 'Confirmed',
    rescheduled: 'Rescheduled',
    in_progress: 'Service In Progress',
    completed: 'Completed',
    declined: 'Declined',
    cancelled: 'Cancelled',
    no_show: 'No Show'
  }
  return labels[status] || status
}

/**
 * Get status color coding for UI
 */
export function getStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    pending: 'gray',
    processing: 'blue',
    payment_failed: 'red',
    confirmed: 'green',
    rescheduled: 'purple',
    in_progress: 'orange',
    completed: 'emerald',
    declined: 'yellow',
    cancelled: 'red',
    no_show: 'gray'
  }
  return colors[status] || 'gray'
}

/**
 * Check if status requires payment
 */
export function requiresPayment(status: BookingStatus): boolean {
  return STATUS_CATEGORIES.PAYMENT_REQUIRED.includes(status)
}

/**
 * Check if status is active (not terminated)
 */
export function isActiveStatus(status: BookingStatus): boolean {
  return STATUS_CATEGORIES.ACTIVE.includes(status)
}

/**
 * Get recommended next actions for a status
 */
export function getRecommendedActions(status: BookingStatus): string[] {
  const actions: Record<BookingStatus, string[]> = {
    pending: ['Review booking details', 'Send payment link', 'Confirm or decline'],
    processing: ['Monitor payment', 'Follow up if overdue', 'Confirm when paid'],
    payment_failed: ['Contact customer', 'Provide payment assistance', 'Retry or cancel'],
    confirmed: ['Schedule service', 'Prepare equipment', 'Contact customer'],
    rescheduled: ['Confirm new time', 'Update schedule', 'Notify team'],
    in_progress: ['Provide updates', 'Complete service', 'Document completion'],
    completed: ['Follow up', 'Request feedback', 'Archive booking'],
    declined: ['Explain reason', 'Offer alternatives', 'Document decision'],
    cancelled: ['Process refunds', 'Update schedule', 'Document cancellation'],
    no_show: ['Attempt contact', 'Document incident', 'Follow policy']
  }
  return actions[status] || []
}