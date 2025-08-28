import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ChevronDown, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

const selectVariants = cva(
  'flex w-full rounded-md border bg-surface-card transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer appearance-none',
  {
    variants: {
      variant: {
        // Default with purple focus - Love4Detailing brand
        default: 'border-border-secondary bg-surface-card text-text-primary focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20 hover:border-border-hover',
        
        // Error with subtle purple undertone
        error: 'border-error-500 bg-surface-card text-text-primary focus-visible:border-error-purple focus-visible:ring-2 focus-visible:ring-error-purple/20',
        
        // Success with purple-tinted success
        success: 'border-success-500 bg-surface-card text-text-primary focus-visible:border-success-purple focus-visible:ring-2 focus-visible:ring-success-purple/20',
        
        // Warning with purple undertone
        warning: 'border-warning-500 bg-surface-card text-text-primary focus-visible:border-warning-purple focus-visible:ring-2 focus-visible:ring-warning-purple/20',
      },
      size: {
        sm: 'h-10 px-3 py-1 text-sm sm:h-9',
        md: 'h-12 px-3 py-2 text-sm sm:h-10',
        lg: 'h-12 px-4 py-2 text-base sm:h-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  label?: string
  error?: string
  success?: string
  warning?: string
  info?: string
  leftIcon?: React.ReactNode
  helperText?: string
  required?: boolean
  optional?: boolean
  showOptional?: boolean
  options?: SelectOption[]
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    variant,
    size,
    label,
    error,
    success,
    warning,
    info,
    leftIcon,
    helperText,
    required,
    optional,
    showOptional = true,
    options = [],
    placeholder,
    id,
    children,
    ...props
  }, ref) => {
    const generatedId = React.useId()
    const selectId = id || generatedId
    const helperId = `${selectId}-helper`
    const errorId = `${selectId}-error`
    
    // Determine the current state
    const currentVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant
    
    // Get the status icon and message
    const getStatusContent = () => {
      if (error) return { icon: AlertCircle, message: error, color: 'text-red-400' }
      if (success) return { icon: CheckCircle, message: success, color: 'text-green-400' }
      if (warning) return { icon: AlertCircle, message: warning, color: 'text-yellow-400' }
      if (info) return { icon: Info, message: info, color: 'text-gray-300' }
      return null
    }
    
    const statusContent = getStatusContent()
    const hasLeftIcon = leftIcon || statusContent?.icon
    
    return (
      <div className="space-y-2" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-white flex items-center gap-1"
          >
            {label}
            {required && <span className="text-red-400" aria-label="required">*</span>}
            {optional && showOptional && !required && (
              <span className="text-gray-400 text-xs font-normal">(optional)</span>
            )}
          </label>
        )}
        
        {/* Select Container */}
        <div className="relative">
          {/* Left Icon */}
          {hasLeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
              {leftIcon ? (
                <span className="text-gray-400 h-4 w-4 flex items-center justify-center">
                  {leftIcon}
                </span>
              ) : statusContent ? (
                <statusContent.icon className={cn('h-4 w-4', statusContent.color)} />
              ) : null}
            </div>
          )}
          
          {/* Select */}
          <select
            className={cn(
              selectVariants({ variant: currentVariant, size, className }),
              hasLeftIcon && 'pl-10',
              'pr-10' // Always add right padding for chevron
            )}
            ref={ref}
            id={selectId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              helperText && helperId,
              error && errorId
            )}
            data-variant={currentVariant}
            data-size={size}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            
            {/* Render options from props */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
            
            {/* Render children if provided (for custom option structure) */}
            {children}
          </select>
          
          {/* Chevron Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Helper Text & Messages */}
        <div className="space-y-1">
          {helperText && !error && !success && !warning && !info && (
            <p
              id={helperId}
              className="text-xs text-gray-400"
            >
              {helperText}
            </p>
          )}
          
          {statusContent && (
            <p
              id={error ? errorId : helperId}
              className={cn('text-xs flex items-center gap-1.5', statusContent.color)}
              role={error ? 'alert' : 'status'}
            >
              <statusContent.icon className="h-3.5 w-3.5 flex-shrink-0" />
              {statusContent.message}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Select.displayName = 'Select'

// Select demo component
export const SelectDemo: React.FC = () => {
  const [formData, setFormData] = React.useState({
    service: '',
    vehicleType: '',
    timeSlot: '',
    location: ''
  });

  const serviceOptions = [
    { value: 'exterior', label: 'Exterior Detailing' },
    { value: 'interior', label: 'Interior Detailing' },
    { value: 'full', label: 'Full Service Package' },
    { value: 'premium', label: 'Premium Detail Package' },
  ];

  const vehicleOptions = [
    { value: 'small', label: 'Small Car (Hatchback)' },
    { value: 'medium', label: 'Medium Car (Sedan)' },
    { value: 'large', label: 'Large Car (SUV/Estate)' },
    { value: 'luxury', label: 'Luxury Vehicle' },
  ];

  const timeOptions = [
    { value: '09:00', label: '9:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '17:00', label: '5:00 PM', disabled: true },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <h3 className="text-lg font-semibold text-text-primary">Purple-Enhanced Select Components</h3>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Basic Select Components</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Select
              label="Service Type"
              placeholder="Choose a service"
              required
              options={serviceOptions}
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            />
            <Select
              label="Vehicle Type"
              placeholder="Select vehicle size"
              optional
              options={vehicleOptions}
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Select with Icons & States</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Select
              label="Preferred Time"
              placeholder="Select time slot"
              leftIcon={<span className="text-brand-400">🕒</span>}
              options={timeOptions}
              value={formData.timeSlot}
              onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              helperText="Some slots may be unavailable"
            />
            <Select
              label="Success State"
              variant="success"
              value="confirmed"
              success="Time slot confirmed ✓"
              disabled
            >
              <option value="confirmed">2:00 PM - Confirmed</option>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Validation States</h4>
          <div className="space-y-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Select
              label="Default State"
              placeholder="Focus me to see purple border"
              options={serviceOptions}
              helperText="Purple focus ring with brand colors"
            />
            <Select
              label="Error State"
              variant="error"
              placeholder="Please select an option"
              options={serviceOptions}
              error="This field is required"
            />
            <Select
              label="Warning State"
              variant="warning"
              placeholder="Limited availability"
              options={timeOptions}
              warning="Only morning slots available"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Select Sizes</h4>
          <div className="space-y-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Select
              size="sm"
              placeholder="Small select"
              label="Small"
              options={serviceOptions}
            />
            <Select
              size="md"
              placeholder="Medium select (default)"
              label="Medium"
              options={serviceOptions}
            />
            <Select
              size="lg"
              placeholder="Large select"
              label="Large"
              options={serviceOptions}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Booking Form Example</h4>
          <div className="p-6 bg-surface-card rounded-lg border border-border-secondary space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Service Package"
                placeholder="Select service"
                required
                leftIcon={<span className="text-brand-400">⚡</span>}
                options={serviceOptions}
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              />
              <Select
                label="Vehicle Category"
                placeholder="Choose size"
                required
                leftIcon={<span className="text-brand-400">🚗</span>}
                options={vehicleOptions}
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Appointment Time"
                placeholder="Select time"
                required
                leftIcon={<span className="text-brand-400">📅</span>}
                options={timeOptions}
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              />
              <Select
                label="Service Location"
                placeholder="Choose location"
                leftIcon={<span className="text-brand-400">📍</span>}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
                <option value="home">At Your Location</option>
                <option value="shop">At Our Workshop</option>
                <option value="office">Office/Business Location</option>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Select, selectVariants }