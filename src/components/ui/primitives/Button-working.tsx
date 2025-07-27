import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed relative overflow-hidden',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg',
        secondary: 'bg-gray-800 text-white border border-gray-600 hover:bg-gray-700 active:bg-gray-900 shadow-sm hover:shadow-md',
        outline: 'border border-gray-600 text-gray-100 hover:bg-gray-800 hover:border-gray-500 active:bg-gray-700',
        ghost: 'text-gray-100 hover:bg-gray-800 active:bg-gray-700',
        destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg',
        link: 'text-blue-400 underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        xs: 'h-8 px-2 text-xs rounded-md gap-1',
        sm: 'h-9 px-3 text-sm rounded-md gap-1.5',
        md: 'h-10 px-4 text-sm rounded-md gap-2',
        lg: 'h-11 px-6 text-base rounded-lg gap-2',
        xl: 'h-12 px-8 text-base rounded-lg gap-2.5',
        icon: 'h-10 w-10 rounded-md p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
    compoundVariants: [
      // Touch-friendly sizing for mobile
      {
        size: ['xs', 'sm'],
        class: 'min-h-[44px] sm:min-h-auto',
      },
      // Link variant overrides
      {
        variant: 'link',
        size: ['xs', 'sm', 'md', 'lg', 'xl'],
        class: 'h-auto p-0 gap-1',
      },
      // Icon variant overrides
      {
        size: 'icon',
        class: 'h-10 w-10 min-h-[44px] min-w-[44px] sm:min-h-10 sm:min-w-10',
      },
    ],
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const WorkingButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    children, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading
    
    return (
      <button
        className={cn(buttonVariants({ 
          variant, 
          size, 
          fullWidth,
          className 
        }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && (
          <Loader2 
            className={cn(
              'animate-spin',
              size === 'xs' ? 'h-3 w-3' :
              size === 'sm' ? 'h-3.5 w-3.5' :
              size === 'md' ? 'h-4 w-4' :
              size === 'lg' ? 'h-4 w-4' :
              size === 'xl' ? 'h-5 w-5' :
              'h-4 w-4'
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Left Icon */}
        {!loading && leftIcon && (
          <span 
            className={cn(
              'flex items-center justify-center',
              size === 'xs' ? 'h-3 w-3' :
              size === 'sm' ? 'h-3.5 w-3.5' :
              size === 'md' ? 'h-4 w-4' :
              size === 'lg' ? 'h-4 w-4' :
              size === 'xl' ? 'h-5 w-5' :
              'h-4 w-4'
            )}
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        
        {/* Button Text */}
        {size !== 'icon' && (
          <span className={cn(
            'inline-block',
            loading && 'opacity-0'
          )}>
            {loading && loadingText ? loadingText : children}
          </span>
        )}
        
        {/* Right Icon */}
        {!loading && rightIcon && size !== 'icon' && (
          <span 
            className={cn(
              'flex items-center justify-center',
              size === 'xs' ? 'h-3 w-3' :
              size === 'sm' ? 'h-3.5 w-3.5' :
              size === 'md' ? 'h-4 w-4' :
              size === 'lg' ? 'h-4 w-4' :
              size === 'xl' ? 'h-5 w-5' :
              'h-4 w-4'
            )}
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
        
        {/* Icon-only button content */}
        {size === 'icon' && !loading && (
          <span 
            className="flex items-center justify-center h-4 w-4"
            aria-hidden="true"
          >
            {children}
          </span>
        )}
      </button>
    )
  }
)
WorkingButton.displayName = 'WorkingButton'

export { WorkingButton, buttonVariants }