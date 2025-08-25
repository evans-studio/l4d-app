import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Check, Minus } from 'lucide-react'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

const checkboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded-sm border-2 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        // Default with purple branding
        default: 'border-border-secondary data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600 data-[state=checked]:text-white focus-visible:ring-brand-500',
        
        // Success variant
        success: 'border-success-500 data-[state=checked]:bg-success-600 data-[state=checked]:border-success-600 data-[state=checked]:text-white focus-visible:ring-success-500',
        
        // Warning variant
        warning: 'border-warning-500 data-[state=checked]:bg-warning-600 data-[state=checked]:border-warning-600 data-[state=checked]:text-white focus-visible:ring-warning-500',
      },
      size: {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof checkboxVariants> {
  label?: string
  description?: string
  error?: string
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    className,
    variant,
    size,
    label,
    description,
    error,
    indeterminate = false,
    onCheckedChange,
    onChange,
    id,
    ...props
  }, ref) => {
    const generatedId = React.useId()
    const checkboxId = id || generatedId
    const [checked, setChecked] = React.useState(props.checked || false)
    
    React.useEffect(() => {
      if (props.checked !== undefined) {
        setChecked(props.checked)
      }
    }, [props.checked])
    
    React.useEffect(() => {
      if (ref && typeof ref === 'object' && ref.current) {
        ref.current.indeterminate = indeterminate
      }
    }, [indeterminate, ref])
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      setChecked(newChecked)
      onCheckedChange?.(newChecked)
      onChange?.(e)
    }
    
    return (
      <div className="space-y-2" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
        <div className="flex items-start space-x-3">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              className={cn(
                'absolute inset-0 opacity-0 cursor-pointer peer',
                'min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto' // Touch-friendly sizing
              )}
              ref={ref}
              id={checkboxId}
              checked={checked}
              onChange={handleChange}
              {...props}
            />
            <div
              className={cn(
                checkboxVariants({ variant, size, className }),
                checked && 'bg-brand-600 border-brand-600 text-white',
                indeterminate && 'bg-brand-600 border-brand-600 text-white',
                error && 'border-error-500'
              )}
              data-state={indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
              data-variant={variant}
              data-size={size}
            >
              {checked && !indeterminate && (
                <Check 
                  className={cn(
                    'text-current',
                    size === 'sm' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-3 w-3' : 'h-3.5 w-3.5'
                  )} 
                />
              )}
              {indeterminate && (
                <Minus 
                  className={cn(
                    'text-current',
                    size === 'sm' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-3 w-3' : 'h-3.5 w-3.5'
                  )} 
                />
              )}
            </div>
          </div>
          
          {(label || description) && (
            <div className="flex-1 min-w-0">
              {label && (
                <label
                  htmlFor={checkboxId}
                  className="text-sm font-medium text-white cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {label}
                </label>
              )}
              {description && (
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 ml-7">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

// Checkbox Group Component
export interface CheckboxGroupProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ label, description, error, required, children, className, ...props }, ref) => {
    return (
      <div className={cn('space-y-3', className)} ref={ref} {...props}>
        {(label || description) && (
          <div className="space-y-1">
            {label && (
              <div className="text-sm font-medium text-white flex items-center gap-1">
                {label}
                {required && <span className="text-red-400" aria-label="required">*</span>}
              </div>
            )}
            {description && (
              <p className="text-xs text-gray-400 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          {children}
        </div>
        
        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
CheckboxGroup.displayName = 'CheckboxGroup'

// Checkbox demo component
export const CheckboxDemo: React.FC = () => {
  const [preferences, setPreferences] = React.useState({
    exterior: false,
    interior: false,
    premium: false,
    wax: false,
    vacuum: false,
    newsletters: true,
    sms: false,
    allServices: false
  });

  const handleServiceChange = (service: string, checked: boolean) => {
    setPreferences(prev => ({ ...prev, [service]: checked }));
  };

  const handleAllServicesChange = (checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      allServices: checked,
      exterior: checked,
      interior: checked,
      premium: checked,
      wax: checked,
      vacuum: checked
    }));
  };

  const allServicesChecked = preferences.exterior && preferences.interior && preferences.premium && preferences.wax && preferences.vacuum;
  const someServicesChecked = preferences.exterior || preferences.interior || preferences.premium || preferences.wax || preferences.vacuum;

  return (
    <div className="space-y-8 max-w-4xl">
      <h3 className="text-lg font-semibold text-text-primary">Purple-Enhanced Checkbox Components</h3>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Basic Checkboxes</h4>
          <div className="p-6 bg-surface-card rounded-lg border border-border-secondary space-y-4">
            <Checkbox
              label="Default Checkbox"
              description="This is a standard checkbox with purple branding"
            />
            <Checkbox
              label="Checked Checkbox"
              description="This checkbox starts checked"
              defaultChecked
            />
            <Checkbox
              label="Disabled Checkbox"
              description="This checkbox is disabled"
              disabled
            />
            <Checkbox
              label="Disabled Checked"
              description="This checkbox is disabled and checked"
              disabled
              defaultChecked
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Checkbox Sizes</h4>
          <div className="p-6 bg-surface-card rounded-lg border border-border-secondary space-y-4">
            <Checkbox
              size="sm"
              label="Small Checkbox"
              description="Compact size for dense layouts"
            />
            <Checkbox
              size="md"
              label="Medium Checkbox (Default)"
              description="Standard size for most use cases"
            />
            <Checkbox
              size="lg"
              label="Large Checkbox"
              description="Larger size for better touch accessibility"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Checkbox Variants</h4>
          <div className="p-6 bg-surface-card rounded-lg border border-border-secondary space-y-4">
            <Checkbox
              variant="default"
              label="Default Purple"
              description="Brand purple color scheme"
              defaultChecked
            />
            <Checkbox
              variant="success"
              label="Success Variant"
              description="Green color scheme for success states"
              defaultChecked
            />
            <Checkbox
              variant="warning"
              label="Warning Variant"
              description="Orange color scheme for warnings"
              defaultChecked
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Indeterminate State</h4>
          <div className="p-6 bg-surface-card rounded-lg border border-border-secondary space-y-4">
            <Checkbox
              label="Select All Services"
              description="Master checkbox controlling all services below"
              checked={allServicesChecked}
              indeterminate={someServicesChecked && !allServicesChecked}
              onCheckedChange={handleAllServicesChange}
            />
            <div className="ml-6 space-y-2 border-l-2 border-border-secondary pl-4">
              <Checkbox
                label="Exterior Detailing"
                checked={preferences.exterior}
                onCheckedChange={(checked) => handleServiceChange('exterior', checked)}
              />
              <Checkbox
                label="Interior Cleaning"
                checked={preferences.interior}
                onCheckedChange={(checked) => handleServiceChange('interior', checked)}
              />
              <Checkbox
                label="Premium Wax"
                checked={preferences.premium}
                onCheckedChange={(checked) => handleServiceChange('premium', checked)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Checkbox Groups</h4>
          <div className="p-6 bg-surface-card rounded-lg border border-border-secondary">
            <CheckboxGroup
              label="Service Preferences"
              description="Select the services you're interested in"
              required
            >
              <Checkbox
                label="Exterior Wash & Wax"
                description="Complete exterior cleaning with protective wax coating"
                checked={preferences.wax}
                onCheckedChange={(checked) => handleServiceChange('wax', checked)}
              />
              <Checkbox
                label="Interior Vacuum & Detail"
                description="Thorough interior cleaning including vacuum and surface care"
                checked={preferences.vacuum}
                onCheckedChange={(checked) => handleServiceChange('vacuum', checked)}
              />
            </CheckboxGroup>

            <CheckboxGroup
              label="Communication Preferences"
              description="How would you like to receive updates?"
              className="mt-6"
            >
              <Checkbox
                label="Email newsletters"
                description="Receive our monthly newsletter with tips and offers"
                checked={preferences.newsletters}
                onCheckedChange={(checked) => handleServiceChange('newsletters', checked)}
              />
              <Checkbox
                label="SMS notifications"
                description="Get text message updates about your bookings"
                checked={preferences.sms}
                onCheckedChange={(checked) => handleServiceChange('sms', checked)}
              />
            </CheckboxGroup>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Error States</h4>
          <div className="p-6 bg-surface-card rounded-lg border border-border-secondary">
            <CheckboxGroup
              label="Terms & Conditions"
              error="You must accept the terms to continue"
              required
            >
              <Checkbox
                label="I agree to the Terms of Service"
                description="Please read our terms and conditions"
                error="This field is required"
              />
              <Checkbox
                label="I agree to the Privacy Policy"
                description="Understand how we handle your data"
              />
            </CheckboxGroup>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Booking Form Example</h4>
          <div className="p-6 bg-surface-card rounded-lg border border-border-secondary space-y-6">
            <CheckboxGroup
              label="Add-on Services"
              description="Enhance your detailing package with these optional services"
            >
              <Checkbox
                label="Interior Air Freshening (+£5)"
                description="Long-lasting fresh scent treatment"
              />
              <Checkbox
                label="Tire Shine & Protection (+£8)"
                description="Premium tire conditioning and UV protection"
              />
              <Checkbox
                label="Engine Bay Cleaning (+£15)"
                description="Professional engine compartment detailing"
              />
              <Checkbox
                label="Headlight Restoration (+£20)"
                description="Remove oxidation and restore clarity"
              />
            </CheckboxGroup>

            <CheckboxGroup
              label="Booking Preferences"
              description="Let us know your preferences for this service"
            >
              <Checkbox
                label="Flexible timing (save 10%)"
                description="Allow us to schedule within a 2-hour window for a discount"
              />
              <Checkbox
                label="Eco-friendly products only"
                description="Use only environmentally safe cleaning products"
              />
              <Checkbox
                label="Photo documentation"
                description="Receive before/after photos of your vehicle"
              />
            </CheckboxGroup>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Checkbox, CheckboxGroup, checkboxVariants }