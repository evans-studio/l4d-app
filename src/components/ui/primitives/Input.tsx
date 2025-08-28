import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

const inputVariants = cva(
  'flex w-full rounded-md border bg-surface-card transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        // Default with purple focus - Love4Detailing brand
        default: 'border-border-secondary bg-surface-card text-text-primary hover:border-border-hover focus-visible:border-brand-500',
        
        // Error with subtle purple undertone
        error: 'border-error-500 bg-surface-card text-text-primary focus-visible:border-error-500',
        
        // Success with purple-tinted success
        success: 'border-success-500 bg-surface-card text-text-primary focus-visible:border-success-500',
        
        // Warning with purple undertone
        warning: 'border-warning-500 bg-surface-card text-text-primary focus-visible:border-warning-500',
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

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  floating?: boolean
  error?: string
  success?: string
  warning?: string
  info?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  helperText?: string
  required?: boolean
  optional?: boolean
  showOptional?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    variant,
    size,
    label,
    floating = false,
    error,
    success,
    warning,
    info,
    leftIcon,
    rightIcon,
    helperText,
    required,
    optional,
    showOptional = true,
    id,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const generatedId = React.useId()
    const inputId = id || generatedId
    const helperId = `${inputId}-helper`
    const errorId = `${inputId}-error`
    
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
    const hasRightIcon = rightIcon || type === 'password'
    
    return (
      <div className="space-y-2" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
        {/* Label (standard) */}
        {!floating && label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-white flex items-center gap-1"
          >
            {label}
            {required && <span className="text-red-400" aria-label="required">*</span>}
            {optional && showOptional && !required && (
              <span className="text-gray-400 text-xs font-normal">(optional)</span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {hasLeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              {leftIcon ? (
                <span className="text-gray-400 h-4 w-4 flex items-center justify-center">
                  {leftIcon}
                </span>
              ) : statusContent ? (
                <statusContent.icon className={cn('h-4 w-4', statusContent.color)} />
              ) : null}
            </div>
          )}
          
          {/* Input */}
          <input
            type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              inputVariants({ variant: currentVariant, size, className }),
              hasLeftIcon && 'pl-10',
              hasRightIcon && 'pr-10',
              floating && 'peer placeholder-transparent'
            )}
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              helperText && helperId,
              error && errorId
            )}
            placeholder={floating ? (props.placeholder || ' ') : props.placeholder}
            data-variant={currentVariant}
            data-size={size}
            {...props}
          />

          {/* Floating Label */}
          {floating && label && (
            <label
              htmlFor={inputId}
              className={cn(
                'pointer-events-none absolute text-text-secondary',
                hasLeftIcon ? 'left-10' : 'left-3',
                // Base position when empty
                'top-1/2 -translate-y-1/2',
                // When focused or has value
                'peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs',
                'peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:-translate-y-0 peer-not-placeholder-shown:text-xs',
                'transition-all duration-200'
              )}
            >
              {label}
              {required && <span className="text-red-400 ml-0.5" aria-label="required">*</span>}
              {optional && showOptional && !required && (
                <span className="text-gray-400 text-[10px] font-normal ml-1">(optional)</span>
              )}
            </label>
          )}
          
          {/* Right Icon/Actions */}
          {hasRightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {type === 'password' ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              ) : rightIcon ? (
                <span className="text-gray-400 h-4 w-4 flex items-center justify-center">
                  {rightIcon}
                </span>
              ) : null}
            </div>
          )}
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
Input.displayName = 'Input'

// Textarea Component
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  success?: string
  warning?: string
  info?: string
  helperText?: string
  required?: boolean
  optional?: boolean
  showOptional?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    variant,
    size,
    label,
    error,
    success,
    warning,
    info,
    helperText,
    required,
    optional,
    showOptional = true,
    resize = 'vertical',
    id,
    ...props
  }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const helperId = `${inputId}-helper`
    const errorId = `${inputId}-error`
    
    // Determine the current state
    const currentVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant
    
    // Get the status content
    const getStatusContent = () => {
      if (error) return { icon: AlertCircle, message: error, color: 'text-red-400' }
      if (success) return { icon: CheckCircle, message: success, color: 'text-green-400' }
      if (warning) return { icon: AlertCircle, message: warning, color: 'text-yellow-400' }
      if (info) return { icon: Info, message: info, color: 'text-gray-300' }
      return null
    }
    
    const statusContent = getStatusContent()
    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize]
    
    return (
      <div className="space-y-2" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-white flex items-center gap-1"
          >
            {label}
            {required && <span className="text-red-400" aria-label="required">*</span>}
            {optional && showOptional && !required && (
              <span className="text-gray-400 text-xs font-normal">(optional)</span>
            )}
          </label>
        )}
        
        {/* Textarea */}
        <textarea
          className={cn(
            inputVariants({ variant: currentVariant, size }),
            resizeClass,
            'min-h-[80px]',
            className
          )}
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            helperText && helperId,
            error && errorId
          )}
          data-variant={currentVariant}
          data-size={size}
          {...props}
        />
        
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
Textarea.displayName = 'Textarea'

// Purple-enhanced input demo
export const InputDemo: React.FC = () => {
  const [formData, setFormData] = React.useState({
    email: '',
    phone: '',
    password: '',
    search: '',
    message: ''
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <h3 className="text-lg font-semibold text-text-primary">Purple-Enhanced Form Components</h3>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Input Focus States - Purple Brand Identity</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+44 7123 456789"
              optional
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Password & Search Inputs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              helperText="Must be at least 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Input
              label="Search Bookings"
              placeholder="Search by customer name..."
              leftIcon={<span className="text-brand-400">🔍</span>}
              value={formData.search}
              onChange={(e) => setFormData({ ...formData, search: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Validation States with Purple Accents</h4>
          <div className="space-y-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Input
              label="Default State"
              placeholder="Focus me to see purple border"
              helperText="Purple focus ring with brand colors"
            />
            <Input
              label="Success State"
              variant="success"
              placeholder="valid@email.com"
              value="valid@email.com"
              success="Email address verified ✓"
              readOnly
            />
            <Input
              label="Error State"
              variant="error"
              placeholder="Enter value"
              error="This field is required"
            />
            <Input
              label="Warning State"
              variant="warning"
              placeholder="Check your input"
              warning="Please double-check this information"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Textarea with Purple Focus</h4>
          <div className="p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Textarea
              label="Service Details"
              placeholder="Tell us more about your car detailing needs..."
              helperText="Describe your vehicle, preferred services, and any special requirements"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Input Sizes</h4>
          <div className="space-y-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Input
              size="sm"
              placeholder="Small input"
              label="Small"
            />
            <Input
              size="md"
              placeholder="Medium input (default)"
              label="Medium"
            />
            <Input
              size="lg"
              placeholder="Large input"
              label="Large"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Booking Form Example</h4>
          <div className="p-6 bg-surface-card rounded-lg border border-border-secondary space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Customer Name"
                placeholder="John Doe"
                required
                leftIcon={<span className="text-brand-400">👤</span>}
              />
              <Input
                label="Vehicle Make & Model"
                placeholder="BMW X5"
                required
                leftIcon={<span className="text-brand-400">🚗</span>}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Number"
                type="tel"
                placeholder="+44 7123 456789"
                required
                leftIcon={<span className="text-brand-400">📞</span>}
              />
              <Input
                label="Preferred Date"
                type="date"
                required
                leftIcon={<span className="text-brand-400">📅</span>}
              />
            </div>
            <Textarea
              label="Special Requirements"
              placeholder="Any specific cleaning needs, accessibility requirements, or additional services..."
              optional
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { Input, Textarea, inputVariants }