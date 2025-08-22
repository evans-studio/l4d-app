import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  // Base styles - Mobile-first with touch targets and purple focus ring
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed relative overflow-hidden',
  {
    variants: {
      variant: {
        // Strong purple primary buttons - Love4Detailing brand identity
        primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-purple hover:shadow-purple-lg hover:animate-purple-glow border border-brand-500/20',
        
        // Secondary with purple accents
        secondary: 'bg-surface-tertiary text-text-primary border border-border-secondary hover:bg-surface-hover hover:border-border-purple active:bg-surface-active shadow-sm hover:shadow-purple',
        
        // Outline with purple hover
        outline: 'border border-border-secondary text-text-primary hover:bg-brand-600/10 hover:border-brand-500 hover:text-brand-300 active:bg-brand-600/20 backdrop-blur-sm',
        
        // Ghost with purple hover background
        ghost: 'text-text-primary hover:bg-brand-600/10 hover:text-brand-300 active:bg-brand-600/20',
        
        // Destructive with subtle purple undertone
        destructive: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 shadow-md hover:shadow-lg border border-error-500/20',
        
        // Link with brand purple color
        link: 'text-brand-400 hover:text-brand-300 underline-offset-4 hover:underline p-0 h-auto font-normal',
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
      loading: {
        true: 'cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
    compoundVariants: [
      // Touch-friendly sizing for mobile - ensure 44px minimum for accessibility
      {
        size: ['xs', 'sm'],
        class: 'min-h-[44px]', // Always maintain minimum touch target
      },
      // Link variant overrides - links don't need touch targets
      {
        variant: 'link',
        size: ['xs', 'sm', 'md', 'lg', 'xl'],
        class: 'h-auto min-h-0 p-0 gap-1',
      },
      // Icon variant ensures proper touch targets
      {
        size: 'icon',
        class: 'min-h-[44px] min-w-[44px]',
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
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
    
    const hideInnerIcons = size !== 'icon'

    return (
      <button
        className={cn(
          buttonVariants({ 
            variant, 
            size, 
            fullWidth, 
            loading,
            className 
          }),
          hideInnerIcons && 'hide-inner-icons'
        )}
        ref={ref}
        disabled={isDisabled || undefined}
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
        
        {/* Left Icon (suppressed when size is not icon) */}
        {!loading && leftIcon && size === 'icon' && (
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
            'inline-block whitespace-nowrap',
            loading && 'opacity-0'
          , 'btn-text')}>
            {loading && loadingText ? loadingText : children}
          </span>
        )}
        
        {/* Right Icon (suppressed when size is not icon) */}
        {!loading && rightIcon && size === 'icon' && (
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
Button.displayName = 'Button'

// Purple-enhanced button demo
export const ButtonDemo: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      <h3 className="text-lg font-semibold text-text-primary">Purple-Enhanced Button System</h3>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Primary Buttons - Strong Purple Identity</h4>
          <div className="flex flex-wrap gap-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Button variant="primary" size="sm">Book Now</Button>
            <Button variant="primary" size="md">Schedule Service</Button>
            <Button variant="primary" size="lg">Get Quote</Button>
            <Button variant="primary" size="xl">Love4Detailing</Button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Button Variants with Purple Accents</h4>
          <div className="flex flex-wrap gap-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Interactive States</h4>
          <div className="flex flex-wrap gap-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="outline" leftIcon={<span>🚗</span>}>With Icon</Button>
            <Button variant="primary" rightIcon={<span>→</span>}>Book Service</Button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Responsive Sizing</h4>
          <div className="flex flex-col sm:flex-row gap-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Button variant="primary" fullWidth className="sm:w-auto">Mobile Full Width</Button>
            <Button variant="outline" size="lg">Desktop Optimized</Button>
            <Button variant="primary" size="icon">🔧</Button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Booking Flow CTAs</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Button variant="primary" fullWidth>Book Exterior Detail</Button>
            <Button variant="primary" fullWidth>Book Interior Detail</Button>
            <Button variant="primary" fullWidth>Book Full Service</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Button, buttonVariants }