'use client'

/**
 * UK License Plate Validation and Formatting Utilities
 * Supports current UK format and historical formats
 */

// UK license plate patterns (current format: AB12 CDE)
const UK_PLATE_PATTERNS = {
  current: /^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$/i,
  oldFormat: /^[A-Z][0-9]{1,3}\s?[A-Z]{3}$/i,
  personalised: /^[A-Z]{1,3}[0-9]{1,4}$/i,
  dvla: /^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}|[A-Z][0-9]{1,3}\s?[A-Z]{3}|[A-Z]{1,3}[0-9]{1,4}$/i
}

/**
 * Validates if a string is a valid UK license plate
 */
export function validateUKLicensePlate(plate: string): boolean {
  if (!plate || plate.trim().length === 0) return false
  
  const cleanPlate = plate.trim().replace(/\s+/g, ' ').toUpperCase()
  
  // Check against all supported formats
  return UK_PLATE_PATTERNS.dvla.test(cleanPlate)
}

/**
 * Formats a UK license plate to standard display format
 * AB12CDE -> AB12 CDE
 */
export function formatUKLicensePlate(plate: string): string {
  if (!plate) return ''
  
  // Remove all spaces and convert to uppercase
  const cleanPlate = plate.replace(/\s+/g, '').toUpperCase()
  
  // Current format: AB12CDE -> AB12 CDE
  if (/^[A-Z]{2}[0-9]{2}[A-Z]{3}$/i.test(cleanPlate)) {
    return `${cleanPlate.slice(0, 4)} ${cleanPlate.slice(4)}`
  }
  
  // Old format: A123BCD -> A123 BCD
  if (/^[A-Z][0-9]{1,3}[A-Z]{3}$/i.test(cleanPlate)) {
    const match = cleanPlate.match(/^([A-Z])([0-9]{1,3})([A-Z]{3})$/i)
    if (match) {
      return `${match[1]}${match[2]} ${match[3]}`
    }
  }
  
  // For other formats, return as-is with single spaces
  return cleanPlate.replace(/\s+/g, ' ')
}

/**
 * Formats license plate as user types with validation
 * Returns formatted value and validation state
 */
export function formatLicensePlateInput(
  value: string,
  maxLength: number = 8
): { 
  formatted: string
  isValid: boolean
  error?: string 
} {
  if (!value) {
    return { formatted: '', isValid: false }
  }
  
  // Remove invalid characters and limit length
  const cleaned = value
    .replace(/[^A-Za-z0-9\s]/g, '') // Only allow letters, numbers, spaces
    .slice(0, maxLength)
    .toUpperCase()
  
  // Auto-format as user types for current format
  let formatted = cleaned
  
  // For current format AB12CDE, add space after 4th character
  if (cleaned.length > 4 && !cleaned.includes(' ')) {
    const letters = cleaned.match(/^[A-Z]{2}/)
    const numbers = cleaned.match(/^[A-Z]{2}([0-9]{1,2})/)
    const remainingLetters = cleaned.slice(4)
    
    if (letters && numbers && remainingLetters) {
      formatted = `${letters[0]}${numbers[1]} ${remainingLetters}`
    }
  }
  
  // Validate the current input
  const isComplete = cleaned.replace(/\s/g, '').length >= 5
  const isValid = isComplete ? validateUKLicensePlate(formatted) : true // Don't show error while typing
  
  let error: string | undefined
  if (isComplete && !isValid) {
    error = 'Please enter a valid UK license plate (e.g., AB12 CDE)'
  }
  
  return { formatted, isValid, error }
}

/**
 * License plate examples for placeholder text
 */
export const LICENSE_PLATE_EXAMPLES = [
  'AB12 CDE',
  'A123 BCD', 
  'AB1 CDE',
  'A1 BCD'
]

/**
 * Get random license plate example for placeholder
 */
export function getRandomLicensePlateExample(): string {
  return LICENSE_PLATE_EXAMPLES[Math.floor(Math.random() * LICENSE_PLATE_EXAMPLES.length)]
}