'use client'

import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

const switchVariants = cva(
  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation',
  {
    variants: {
      checked: {
        true: 'bg-brand-600 shadow-purple-glow',
        false: 'bg-gray-200 hover:bg-gray-300'
      },
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-12'
      }
    },
    defaultVariants: {
      checked: false,
      size: 'md'
    }
  }
)

const switchThumbVariants = cva(
  'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
  {
    variants: {
      checked: {
        true: '',
        false: ''
      },
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
      }
    },
    compoundVariants: [
      {
        checked: false,
        size: 'sm',
        class: 'translate-x-0'
      },
      {
        checked: true,
        size: 'sm',
        class: 'translate-x-4'
      },
      {
        checked: false,
        size: 'md',
        class: 'translate-x-0'
      },
      {
        checked: true,
        size: 'md',
        class: 'translate-x-5'
      },
      {
        checked: false,
        size: 'lg',
        class: 'translate-x-0'
      },
      {
        checked: true,
        size: 'lg',
        class: 'translate-x-6'
      }
    ],
    defaultVariants: {
      checked: false,
      size: 'md'
    }
  }
)

export interface SwitchProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'checked'>,
    Omit<VariantProps<typeof switchVariants>, 'checked'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  description?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, onChange, size, label, description, disabled, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked
      onCheckedChange?.(isChecked)
      onChange?.(e)
    }

    return (
      <div className="flex items-start space-x-3" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
        <div className="flex-shrink-0">
          <label className={switchVariants({ checked: !!checked, size, className })} data-size={size} data-state={checked ? 'checked' : 'unchecked'}>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={handleChange}
              disabled={disabled}
              ref={ref}
              {...props}
            />
            <span
              className={switchThumbVariants({ checked: !!checked, size })}
              aria-hidden="true"
            />
          </label>
        </div>
        {(label || description) && (
          <div className="flex-1 min-w-0">
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

Switch.displayName = 'Switch'

// SwitchGroup for multiple switches
export interface SwitchGroupProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
}

export const SwitchGroup = ({ children, className, title, description }: SwitchGroupProps) => (
  <div className={`space-y-4 ${className || ''}`}>
    {title && (
      <div>
        <h3 className="text-lg font-medium text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        )}
      </div>
    )}
    <div className="space-y-3">
      {children}
    </div>
  </div>
)

// Demo component for documentation
export const SwitchDemo = () => {
  const [basicSwitch, setBasicSwitch] = React.useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true)
  const [emailAlerts, setEmailAlerts] = React.useState(false)
  const [smsAlerts, setSmsAlerts] = React.useState(true)

  return (
    <div className="space-y-8 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Switch Variants</h3>
        <div className="space-y-4">
          <Switch
            checked={basicSwitch}
            onCheckedChange={setBasicSwitch}
            label="Basic Switch"
            description="Simple on/off toggle"
          />
          
          <div className="flex items-center space-x-4">
            <Switch checked={false} size="sm" />
            <Switch checked={true} size="md" />
            <Switch checked={false} size="lg" />
          </div>
          
          <Switch 
            checked={true} 
            disabled 
            label="Disabled Switch"
            description="Cannot be toggled"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Switch Group Example</h3>
        <SwitchGroup 
          title="Notification Settings"
          description="Choose how you want to be notified about updates"
        >
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
            label="Enable Notifications"
            description="Receive all types of notifications"
          />
          
          <Switch
            checked={emailAlerts}
            onCheckedChange={setEmailAlerts}
            label="Email Alerts"
            description="Get notified via email for important updates"
            disabled={!notificationsEnabled}
          />
          
          <Switch
            checked={smsAlerts}
            onCheckedChange={setSmsAlerts}
            label="SMS Alerts"
            description="Receive text message notifications"
            disabled={!notificationsEnabled}
          />
        </SwitchGroup>
      </div>
    </div>
  )
}