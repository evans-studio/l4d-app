'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerLayout } from '@/components/layouts/CustomerLayout'
import { Button } from '@/components/ui/primitives/Button'
import { 
  ArrowLeftIcon,
  MapPinIcon,
  SaveIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  StarIcon,
  HomeIcon,
  Building2Icon,
  SearchIcon,
  LoaderIcon
} from 'lucide-react'

interface AddressFormData {
  label: string
  address_line_1: string
  address_line_2: string
  city: string
  county: string
  postal_code: string
  country: string
  notes: string
  is_primary: boolean
}

const ADDRESS_TYPES = [
  { value: 'Home', label: 'Home', icon: HomeIcon },
  { value: 'Work', label: 'Work', icon: Building2Icon },
  { value: 'Office', label: 'Office', icon: Building2Icon },
  { value: 'Other', label: 'Other', icon: MapPinIcon }
]

const UK_COUNTIES = [
  'Bedfordshire', 'Berkshire', 'Bristol', 'Buckinghamshire', 'Cambridgeshire',
  'Cheshire', 'City of London', 'Cornwall', 'Cumbria', 'Derbyshire', 'Devon',
  'Dorset', 'Durham', 'East Riding of Yorkshire', 'East Sussex', 'Essex',
  'Gloucestershire', 'Greater London', 'Greater Manchester', 'Hampshire',
  'Herefordshire', 'Hertfordshire', 'Isle of Wight', 'Kent', 'Lancashire',
  'Leicestershire', 'Lincolnshire', 'Merseyside', 'Norfolk', 'North Yorkshire',
  'Northamptonshire', 'Northumberland', 'Nottinghamshire', 'Oxfordshire',
  'Rutland', 'Shropshire', 'Somerset', 'South Yorkshire', 'Staffordshire',
  'Suffolk', 'Surrey', 'Tyne and Wear', 'Warwickshire', 'West Midlands',
  'West Sussex', 'West Yorkshire', 'Wiltshire', 'Worcestershire'
]

export default function AddAddressPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isValidatingPostcode, setIsValidatingPostcode] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [postcodeValidation, setPostcodeValidation] = useState<{
    isValid: boolean
    suggestions?: { city: string, county: string }
  } | null>(null)
  
  const [formData, setFormData] = useState<AddressFormData>({
    label: 'Home',
    address_line_1: '',
    address_line_2: '',
    city: '',
    county: '',
    postal_code: '',
    country: 'United Kingdom',
    notes: '',
    is_primary: false
  })

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Clear postcode validation when postcode changes
    if (field === 'postal_code') {
      setPostcodeValidation(null)
    }
  }

  const validatePostcode = async (postcode: string) => {
    if (!postcode.trim()) return

    const ukPostcodeRegex = /^([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})$/i
    if (!ukPostcodeRegex.test(postcode.trim())) {
      setPostcodeValidation({ isValid: false })
      return
    }

    try {
      setIsValidatingPostcode(true)
      
      // This would typically call a postcode validation API like postcodes.io
      // For now, we'll do basic validation and auto-fill some common areas
      const cleanPostcode = postcode.toUpperCase().replace(/\s/g, '')
      const area = cleanPostcode.substring(0, 2)
      
      // Mock validation with some common UK postcode areas
      const mockPostcodeData: Record<string, { city: string, county: string }> = {
        'SW': { city: 'London', county: 'Greater London' },
        'SE': { city: 'London', county: 'Greater London' },
        'N1': { city: 'London', county: 'Greater London' },
        'M1': { city: 'Manchester', county: 'Greater Manchester' },
        'B1': { city: 'Birmingham', county: 'West Midlands' },
        'LS': { city: 'Leeds', county: 'West Yorkshire' },
        'L1': { city: 'Liverpool', county: 'Merseyside' },
        'BS': { city: 'Bristol', county: 'Bristol' },
      }

      const suggestion = mockPostcodeData[area]
      
      setPostcodeValidation({
        isValid: true,
        suggestions: suggestion
      })

      // Auto-fill city and county if we have suggestions and fields are empty
      if (suggestion && !formData.city && !formData.county) {
        setFormData(prev => ({
          ...prev,
          city: suggestion.city,
          county: suggestion.county
        }))
      }
    } catch (error) {
      console.error('Postcode validation error:', error)
      setPostcodeValidation({ isValid: false })
    } finally {
      setIsValidatingPostcode(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.label.trim()) {
      newErrors.label = 'Address label is required'
    }

    if (!formData.address_line_1.trim()) {
      newErrors.address_line_1 = 'Street address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postcode is required'
    } else {
      // UK postcode validation
      const ukPostcodeRegex = /^([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})$/i
      if (!ukPostcodeRegex.test(formData.postal_code.trim())) {
        newErrors.postal_code = 'Please enter a valid UK postcode'
      }
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)
      setErrors({})

      const response = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          label: formData.label.trim(),
          address_line_1: formData.address_line_1.trim(),
          address_line_2: formData.address_line_2.trim() || null,
          city: formData.city.trim(),
          county: formData.county.trim() || null,
          postal_code: formData.postal_code.trim().toUpperCase(),
          country: formData.country.trim(),
          notes: formData.notes.trim() || null,
          is_primary: formData.is_primary
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage('Address added successfully!')
        
        // Redirect after short delay
        setTimeout(() => {
          router.push('/dashboard/addresses')
        }, 1500)
      } else {
        setErrors({ submit: data.error?.message || 'Failed to add address' })
      }
    } catch (error) {
      console.error('Failed to add address:', error)
      setErrors({ submit: 'Failed to add address. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/addresses')}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Addresses
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Add New Address</h1>
              <p className="text-text-secondary">
                Add your address details to make future bookings faster
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Address Type */}
              <div className="bg-surface-secondary rounded-lg p-6 border border-border-primary">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5" />
                  Address Type
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ADDRESS_TYPES.map((type) => {
                    const IconComponent = type.icon
                    return (
                      <label
                        key={type.value}
                        className={`relative flex flex-col items-center cursor-pointer rounded-lg border p-4 transition-colors ${
                          formData.label === type.value
                            ? 'border-brand-purple bg-brand-purple/10'
                            : 'border-border-secondary hover:border-border-primary'
                        }`}
                      >
                        <input
                          type="radio"
                          name="label"
                          value={type.value}
                          checked={formData.label === type.value}
                          onChange={(e) => handleInputChange('label', e.target.value)}
                          className="sr-only"
                        />
                        <IconComponent className={`w-6 h-6 mb-2 ${
                          formData.label === type.value ? 'text-brand-purple' : 'text-text-secondary'
                        }`} />
                        <span className={`text-sm font-medium ${
                          formData.label === type.value ? 'text-brand-purple' : 'text-text-primary'
                        }`}>
                          {type.label}
                        </span>
                        {formData.label === type.value && (
                          <CheckCircleIcon className="absolute top-2 right-2 w-4 h-4 text-brand-purple" />
                        )}
                      </label>
                    )
                  })}
                </div>
                {errors.label && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircleIcon className="w-4 h-4" />
                    {errors.label}
                  </p>
                )}
              </div>

              {/* Address Details */}
              <div className="bg-surface-secondary rounded-lg p-6 border border-border-primary">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Address Details
                </h3>

                <div className="space-y-4">
                  {/* Street Address */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address_line_1}
                      onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                      placeholder="e.g., 123 Main Street"
                      className={`w-full px-3 py-2 bg-surface-primary border rounded-md text-text-primary placeholder-text-muted focus:outline-none transition-colors ${
                        errors.address_line_1 ? 'border-red-400' : 'border-border-secondary focus:border-brand-400'
                      }`}
                    />
                    {errors.address_line_1 && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.address_line_1}
                      </p>
                    )}
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.address_line_2}
                      onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                      placeholder="Apartment, suite, building, etc."
                      className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Postcode with validation */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Postcode *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => handleInputChange('postal_code', e.target.value.toUpperCase())}
                        onBlur={(e) => validatePostcode(e.target.value)}
                        placeholder="e.g., SW1A 1AA"
                        className={`w-full px-3 py-2 bg-surface-primary border rounded-md text-text-primary placeholder-text-muted focus:outline-none transition-colors font-mono ${
                          errors.postal_code ? 'border-red-400' : 
                          postcodeValidation?.isValid ? 'border-green-400' :
                          'border-border-secondary focus:border-brand-400'
                        }`}
                      />
                      {isValidatingPostcode && (
                        <LoaderIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-text-secondary" />
                      )}
                      {postcodeValidation?.isValid && (
                        <CheckCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
                      )}
                    </div>
                    {errors.postal_code && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.postal_code}
                      </p>
                    )}
                    {postcodeValidation?.suggestions && (
                      <p className="text-green-600 text-sm mt-1">
                        ✓ Valid postcode - Auto-filled city and county
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="e.g., London"
                        className={`w-full px-3 py-2 bg-surface-primary border rounded-md text-text-primary placeholder-text-muted focus:outline-none transition-colors ${
                          errors.city ? 'border-red-400' : 'border-border-secondary focus:border-brand-400'
                        }`}
                      />
                      {errors.city && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <AlertCircleIcon className="w-4 h-4" />
                          {errors.city}
                        </p>
                      )}
                    </div>

                    {/* County */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        County
                      </label>
                      <input
                        list="counties"
                        value={formData.county}
                        onChange={(e) => handleInputChange('county', e.target.value)}
                        placeholder="e.g., Greater London"
                        className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none transition-colors"
                      />
                      <datalist id="counties">
                        {UK_COUNTIES.map(county => (
                          <option key={county} value={county} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Country *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`w-full px-3 py-2 bg-surface-primary border rounded-md text-text-primary focus:outline-none transition-colors ${
                        errors.country ? 'border-red-400' : 'border-border-secondary focus:border-brand-400'
                      }`}
                    >
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Ireland">Ireland</option>
                    </select>
                    {errors.country && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.country}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Delivery Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Special instructions for finding your address (gate codes, parking, etc.)"
                      rows={3}
                      className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Primary Address */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_primary"
                      checked={formData.is_primary}
                      onChange={(e) => handleInputChange('is_primary', e.target.checked)}
                      className="w-4 h-4 text-brand-purple border-border-secondary rounded focus:ring-brand-purple"
                    />
                    <label htmlFor="is_primary" className="text-sm text-text-primary flex items-center gap-2">
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                      Set as default address
                    </label>
                  </div>
                  <p className="text-text-muted text-xs">
                    Your default address will be automatically selected during booking
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="space-y-6">
              <div className="bg-surface-secondary rounded-lg p-6 border border-border-primary sticky top-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Address Preview
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full h-24 bg-brand-purple/10 rounded-lg">
                    {(() => {
                      const selectedType = ADDRESS_TYPES.find(t => t.value === formData.label)
                      const IconComponent = selectedType?.icon || MapPinIcon
                      return <IconComponent className="w-12 h-12 text-brand-purple" />
                    })()}
                  </div>

                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-text-primary">
                      {formData.label || 'Address Type'}
                    </h4>
                    {formData.is_primary && (
                      <div className="flex items-center justify-center gap-1 text-yellow-600 bg-yellow-50 py-1 px-2 rounded mt-2">
                        <StarIcon className="w-3 h-3" />
                        <span className="text-xs">Default Address</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-surface-primary rounded border-l-4 border-brand-purple">
                      {formData.address_line_1 && (
                        <p className="text-text-primary font-medium">{formData.address_line_1}</p>
                      )}
                      {formData.address_line_2 && (
                        <p className="text-text-secondary">{formData.address_line_2}</p>
                      )}
                      {formData.city && (
                        <p className="text-text-primary">
                          {formData.city}
                          {formData.county && `, ${formData.county}`}
                        </p>
                      )}
                      {formData.postal_code && (
                        <p className="text-text-primary font-mono">{formData.postal_code}</p>
                      )}
                      {formData.country && formData.country !== 'United Kingdom' && (
                        <p className="text-text-secondary">{formData.country}</p>
                      )}
                    </div>

                    {formData.notes && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-blue-800 text-xs">
                          <strong>Notes:</strong> {formData.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-blue-800 text-xs">
                        <strong>Tip:</strong> Make sure your address is accurate so our team can find you easily on service day.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-border-secondary">
            {errors.submit && (
              <p className="text-red-600 text-sm flex items-center gap-1 mr-auto">
                <AlertCircleIcon className="w-4 h-4" />
                {errors.submit}
              </p>
            )}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/addresses')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                  Adding Address...
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4" />
                  Add Address
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  )
}