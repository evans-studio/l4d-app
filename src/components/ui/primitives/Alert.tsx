'use client'

import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  X
} from 'lucide-react'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        success: 'border-green-200 bg-green-50 text-green-900 [&>svg]:text-green-600 shadow-green-glow/20',
        error: 'border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600 shadow-red-glow/20',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-900 [&>svg]:text-yellow-600 shadow-yellow-glow/20',
        info: 'border-blue-200 bg-blue-50 text-blue-900 [&>svg]:text-blue-600 shadow-blue-glow/20',
        brand: 'border-brand-200 bg-brand-50 text-brand-900 [&>svg]:text-brand-600 shadow-purple-glow/20'
      },
      size: {
        sm: 'p-3 text-sm [&>svg]:h-4 [&>svg]:w-4',
        md: 'p-4 text-sm [&>svg]:h-5 [&>svg]:w-5',
        lg: 'p-5 text-base [&>svg]:h-6 [&>svg]:w-6'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

const alertTitleVariants = cva(
  'mb-1 font-medium leading-none tracking-tight',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
)

const alertDescriptionVariants = cva(
  'text-sm [&_p]:leading-relaxed',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean
  onDismiss?: () => void
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, size, dismissible, onDismiss, children, ...props }, ref) => {
    const getIcon = () => {
      switch (variant) {
        case 'success':
          return <CheckCircle className="h-5 w-5" />
        case 'error':
          return <XCircle className="h-5 w-5" />
        case 'warning':
          return <AlertTriangle className="h-5 w-5" />
        case 'info':
        case 'brand':
          return <Info className="h-5 w-5" />
        default:
          return <Info className="h-5 w-5" />
      }
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={alertVariants({ variant, size, className })}
        data-ui={isNewUIEnabled() ? 'new' : 'old'}
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {getIcon()}
        <div className="flex-1">
          {children}
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    )
  }
)

Alert.displayName = 'Alert'

export interface AlertTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof alertTitleVariants> {}

export const AlertTitle = forwardRef<HTMLParagraphElement, AlertTitleProps>(
  ({ className, size, ...props }, ref) => (
    <h5
      ref={ref}
      className={alertTitleVariants({ size, className })}
      {...props}
    />
  )
)

AlertTitle.displayName = 'AlertTitle'

export interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof alertDescriptionVariants> {}

export const AlertDescription = forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={alertDescriptionVariants({ size, className })}
      {...props}
    />
  )
)

AlertDescription.displayName = 'AlertDescription'

// Compound Alert with built-in title and description
export interface CompoundAlertProps extends AlertProps {
  title?: string
  description?: string
}

export const CompoundAlert = ({ title, description, children, ...props }: CompoundAlertProps) => (
  <Alert {...props}>
    {title && <AlertTitle size={props.size}>{title}</AlertTitle>}
    {description && <AlertDescription size={props.size}>{description}</AlertDescription>}
    {children}
  </Alert>
)

// Demo component for documentation
export const AlertDemo = () => {
  const [dismissibleAlert, setDismissibleAlert] = React.useState(true)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Alert Variants</h3>
        <div className="space-y-4">
          <Alert variant="default">
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              This is a default alert with standard styling.
            </AlertDescription>
          </Alert>

          <Alert variant="success">
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your booking has been confirmed successfully.
            </AlertDescription>
          </Alert>

          <Alert variant="error">
            <AlertTitle>Error occurred</AlertTitle>
            <AlertDescription>
              There was a problem processing your request. Please try again.
            </AlertDescription>
          </Alert>

          <Alert variant="warning">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action cannot be undone. Please confirm before proceeding.
            </AlertDescription>
          </Alert>

          <Alert variant="info">
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Your booking is scheduled for tomorrow at 2:00 PM.
            </AlertDescription>
          </Alert>

          <Alert variant="brand">
            <AlertTitle>Love4Detailing Update</AlertTitle>
            <AlertDescription>
              New premium services are now available for booking.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Size Variants</h3>
        <div className="space-y-4">
          <Alert variant="info" size="sm">
            <AlertTitle>Small Alert</AlertTitle>
            <AlertDescription>Compact size for subtle notifications.</AlertDescription>
          </Alert>

          <Alert variant="info" size="md">
            <AlertTitle>Medium Alert</AlertTitle>
            <AlertDescription>Standard size for most use cases.</AlertDescription>
          </Alert>

          <Alert variant="info" size="lg">
            <AlertTitle>Large Alert</AlertTitle>
            <AlertDescription>Larger size for important announcements.</AlertDescription>
          </Alert>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Dismissible Alert</h3>
        {dismissibleAlert && (
          <Alert 
            variant="brand" 
            dismissible 
            onDismiss={() => setDismissibleAlert(false)}
          >
            <AlertTitle>Dismissible Alert</AlertTitle>
            <AlertDescription>
              This alert can be dismissed by clicking the X button.
            </AlertDescription>
          </Alert>
        )}
        {!dismissibleAlert && (
          <button
            onClick={() => setDismissibleAlert(true)}
            className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
          >
            Show Dismissible Alert
          </button>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Compound Alert (Simplified API)</h3>
        <div className="space-y-4">
          <CompoundAlert
            variant="success"
            title="Payment Successful"
            description="Your payment has been processed and booking confirmed."
          />
          
          <CompoundAlert
            variant="error"
            title="Booking Failed"
            description="Unable to process your booking. Please check your details and try again."
            dismissible
            onDismiss={() => console.log('Alert dismissed')}
          />
        </div>
      </div>
    </div>
  )
}