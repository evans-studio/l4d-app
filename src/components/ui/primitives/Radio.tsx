'use client'

import React, { forwardRef, createContext, useContext } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const radioVariants = cva(
  'h-4 w-4 rounded-full border border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer touch-manipulation',
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
      },
      checked: {
        true: 'border-brand-600 bg-brand-600 shadow-purple-glow',
        false: 'border-gray-300 bg-white hover:border-gray-400'
      }
    },
    defaultVariants: {
      size: 'md',
      checked: false
    }
  }
)

const radioIndicatorVariants = cva(
  'rounded-full bg-white transition-opacity duration-200',
  {
    variants: {
      size: {
        sm: 'h-1 w-1',
        md: 'h-1.5 w-1.5',
        lg: 'h-2 w-2'
      },
      checked: {
        true: 'opacity-100',
        false: 'opacity-0'
      }
    },
    defaultVariants: {
      size: 'md',
      checked: false
    }
  }
)

// Context for RadioGroup
interface RadioGroupContextValue {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(undefined)

export interface RadioProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'checked'>,
    Omit<VariantProps<typeof radioVariants>, 'checked'> {
  label?: string
  description?: string
  value: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, value, label, description, size, disabled, ...props }, ref) => {
    const context = useContext(RadioGroupContext)
    const checked = context?.value === value
    const contextSize = context?.size || size
    const contextDisabled = context?.disabled || disabled
    const contextName = context?.name || props.name

    const handleChange = () => {
      if (!contextDisabled) {
        context?.onValueChange?.(value)
      }
    }

    return (
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 flex items-center justify-center pt-0.5">
          <div className="relative">
            <input
              type="radio"
              className="sr-only"
              checked={checked}
              onChange={handleChange}
              disabled={contextDisabled}
              name={contextName}
              value={value}
              ref={ref}
              {...props}
            />
            <div 
              className={radioVariants({ 
                size: contextSize, 
                checked: !!checked, 
                className 
              })}
              onClick={handleChange}
            >
              <div className="flex items-center justify-center h-full w-full">
                <div 
                  className={radioIndicatorVariants({ 
                    size: contextSize, 
                    checked: !!checked 
                  })}
                />
              </div>
            </div>
          </div>
        </div>
        {(label || description) && (
          <div className="flex-1 min-w-0 cursor-pointer" onClick={handleChange}>
            {label && (
              <label className="text-sm font-medium text-text-primary cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-text-secondary">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Radio.displayName = 'Radio'

// RadioGroup component
export interface RadioGroupProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  title?: string
  description?: string
  orientation?: 'vertical' | 'horizontal'
}

export const RadioGroup = ({
  children,
  value,
  onValueChange,
  name,
  disabled,
  size,
  className,
  title,
  description,
  orientation = 'vertical',
  ...props
}: RadioGroupProps) => {
  const contextValue: RadioGroupContextValue = {
    value,
    onValueChange,
    name,
    disabled,
    size
  }

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div className={className} {...props}>
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-medium text-text-primary">{title}</h3>
            {description && (
              <p className="text-sm text-text-secondary mt-1">{description}</p>
            )}
          </div>
        )}
        <div className={`${orientation === 'horizontal' ? 'flex flex-wrap gap-6' : 'space-y-3'}`}>
          {children}
        </div>
      </div>
    </RadioGroupContext.Provider>
  )
}

// Demo component for documentation
export const RadioDemo = () => {
  const [vehicleSize, setVehicleSize] = React.useState('medium')
  const [serviceType, setServiceType] = React.useState('basic')
  const [priority, setPriority] = React.useState('normal')

  return (
    <div className="space-y-8 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Radio Group Examples</h3>
        
        <div className="space-y-6">
          <RadioGroup
            title="Vehicle Size"
            description="Select your vehicle size for accurate pricing"
            value={vehicleSize}
            onValueChange={setVehicleSize}
            name="vehicle-size"
          >
            <Radio 
              value="small" 
              label="Small" 
              description="Hatchback, Mini, Small SUV" 
            />
            <Radio 
              value="medium" 
              label="Medium" 
              description="Saloon, Estate, Medium SUV" 
            />
            <Radio 
              value="large" 
              label="Large" 
              description="Large SUV, MPV, Van" 
            />
            <Radio 
              value="xlarge" 
              label="Extra Large" 
              description="Large Van, Truck, Commercial Vehicle" 
            />
          </RadioGroup>

          <RadioGroup
            title="Service Type"
            value={serviceType}
            onValueChange={setServiceType}
            name="service-type"
            orientation="horizontal"
          >
            <Radio value="basic" label="Basic Wash" />
            <Radio value="premium" label="Premium Detail" />
            <Radio value="luxury" label="Luxury Package" />
          </RadioGroup>

          <RadioGroup
            title="Priority Level"
            value={priority}
            onValueChange={setPriority}
            name="priority"
            size="sm"
          >
            <Radio value="low" label="Low Priority" />
            <Radio value="normal" label="Normal Priority" />
            <Radio value="high" label="High Priority" />
            <Radio value="urgent" label="Urgent" disabled />
          </RadioGroup>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Size Variants</h3>
        <div className="flex items-center space-x-6">
          <RadioGroup value="medium" name="size-demo-sm" size="sm">
            <Radio value="small" label="Small" />
            <Radio value="medium" label="Medium" />
            <Radio value="large" label="Large" />
          </RadioGroup>
          
          <RadioGroup value="medium" name="size-demo-md" size="md">
            <Radio value="small" label="Small" />
            <Radio value="medium" label="Medium" />
            <Radio value="large" label="Large" />
          </RadioGroup>
          
          <RadioGroup value="medium" name="size-demo-lg" size="lg">
            <Radio value="small" label="Small" />
            <Radio value="medium" label="Medium" />
            <Radio value="large" label="Large" />
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}