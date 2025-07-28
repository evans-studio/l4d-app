import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { LucideIcon, Loader2 } from 'lucide-react'

// Proper icon component type definition
type IconComponent = LucideIcon | React.ComponentType<React.SVGAttributes<SVGElement>>

const iconVariants = cva(
  'inline-flex items-center justify-center flex-shrink-0',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
        '2xl': 'h-10 w-10',
        '3xl': 'h-12 w-12',
      },
      color: {
        default: 'text-current',
        primary: 'text-[var(--primary)]',
        secondary: 'text-[var(--text-secondary)]',
        muted: 'text-[var(--text-muted)]',
        success: 'text-[var(--success)]',
        warning: 'text-[var(--warning)]',
        error: 'text-[var(--error)]',
        white: 'text-white',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'default',
    },
  }
)

export interface IconProps
  extends Omit<React.SVGAttributes<SVGElement>, 'color'>,
    VariantProps<typeof iconVariants> {
  icon: IconComponent
  'aria-label'?: string
  'aria-hidden'?: boolean
  decorative?: boolean
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ 
    className, 
    size, 
    color, 
    icon: IconComponent, 
    decorative = false,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    ...props 
  }, ref) => {
    return (
      <IconComponent
        ref={ref}
        className={cn(iconVariants({ size, color, className }))}
        aria-hidden={decorative ? true : ariaHidden}
        aria-label={decorative ? undefined : ariaLabel}
        role={decorative ? 'presentation' : undefined}
        {...props}
      />
    )
  }
)
Icon.displayName = 'Icon'

// Icon Button Component
const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-all duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-active)]',
        primary: 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] active:bg-[var(--btn-primary-active)] shadow-md hover:shadow-lg',
        secondary: 'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] border border-[var(--btn-secondary-border)] hover:bg-[var(--btn-secondary-hover)] active:bg-[var(--btn-secondary-active)] shadow-sm hover:shadow-md',
        outline: 'border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] active:bg-[var(--surface-active)]',
        ghost: 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-active)]',
        destructive: 'bg-[var(--error)] text-white hover:bg-[var(--error-light)] active:bg-[var(--error-dark)] shadow-md hover:shadow-lg',
      },
      size: {
        xs: 'h-6 w-6 p-1',
        sm: 'h-8 w-8 p-1.5',
        md: 'h-10 w-10 p-2',
        lg: 'h-12 w-12 p-2.5',
        xl: 'h-14 w-14 p-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
    compoundVariants: [
      // Touch-friendly sizing for mobile
      {
        size: ['xs', 'sm'],
        class: 'min-h-[44px] min-w-[44px] sm:min-h-[auto] sm:min-w-[auto]',
      },
    ],
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  icon: IconComponent
  'aria-label': string
  loading?: boolean
  tooltip?: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    icon: IconComponent, 
    loading = false,
    disabled,
    'aria-label': ariaLabel,
    tooltip,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading
    
    const iconSize = {
      xs: 'xs' as const,
      sm: 'sm' as const,
      md: 'md' as const,
      lg: 'lg' as const,
      xl: 'xl' as const,
    }[size || 'md']
    
    return (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ variant, size, className }))}
        disabled={isDisabled}
        aria-label={ariaLabel}
        title={tooltip || ariaLabel}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <Icon
            icon={Loader2}
            size={iconSize}
            className="animate-spin"
            decorative
          />
        ) : (
          <Icon
            icon={IconComponent}
            size={iconSize}
            decorative
          />
        )}
      </button>
    )
  }
)
IconButton.displayName = 'IconButton'

// Icon with Badge Component
export interface IconWithBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  icon: IconComponent
  badge?: string | number
  badgeColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  iconColor?: 'default' | 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error' | 'white'
  'aria-label'?: string
  decorative?: boolean
}

const IconWithBadge = React.forwardRef<HTMLDivElement, IconWithBadgeProps>(
  ({ 
    className,
    icon: IconComponent,
    badge,
    badgeColor = 'primary',
    size = 'md',
    iconColor = 'default',
    'aria-label': ariaLabel,
    decorative = false,
    ...props 
  }, ref) => {
    const badgeColorClasses = {
      primary: 'bg-[var(--primary)] text-white',
      secondary: 'bg-[var(--text-secondary)] text-white',
      success: 'bg-[var(--success)] text-white',
      warning: 'bg-[var(--warning)] text-white',
      error: 'bg-[var(--error)] text-white',
    }[badgeColor]
    
    return (
      <div
        ref={ref}
        className={cn('relative inline-flex', className)}
        {...props}
      >
        <Icon
          icon={IconComponent}
          size={size}
          color={iconColor}
          aria-label={decorative ? undefined : ariaLabel}
          decorative={decorative}
        />
        {badge && (
          <span
            className={cn(
              'absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium',
              badgeColorClasses
            )}
            aria-hidden={decorative}
          >
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
    )
  }
)
IconWithBadge.displayName = 'IconWithBadge'

// Avatar Icon Component
export interface AvatarIconProps
  extends React.HTMLAttributes<HTMLDivElement> {
  icon: IconComponent
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  variant?: 'circle' | 'square' | 'rounded'
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error'
  background?: 'default' | 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error'
}

const avatarIconVariants = cva(
  'inline-flex items-center justify-center flex-shrink-0',
  {
    variants: {
      size: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-20 w-20',
        '3xl': 'h-24 w-24',
      },
      variant: {
        circle: 'rounded-full',
        square: 'rounded-none',
        rounded: 'rounded-md',
      },
      background: {
        default: 'bg-[var(--surface-secondary)]',
        primary: 'bg-[var(--primary)]',
        secondary: 'bg-[var(--text-secondary)]',
        muted: 'bg-[var(--text-muted)]',
        success: 'bg-[var(--success)]',
        warning: 'bg-[var(--warning)]',
        error: 'bg-[var(--error)]',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'circle',
      background: 'default',
    },
  }
)

const AvatarIcon = React.forwardRef<HTMLDivElement, AvatarIconProps>(
  ({ 
    className,
    icon: IconComponent,
    size = 'md',
    variant = 'circle',
    color = 'default',
    background = 'default',
    ...props 
  }, ref) => {
    const iconSize = {
      xs: 'xs' as const,
      sm: 'sm' as const,
      md: 'sm' as const,
      lg: 'md' as const,
      xl: 'lg' as const,
      '2xl': 'xl' as const,
      '3xl': '2xl' as const,
    }[size]
    
    return (
      <div
        ref={ref}
        className={cn(avatarIconVariants({ size, variant, background, className }))}
        {...props}
      >
        <Icon
          icon={IconComponent}
          size={iconSize}
          color={background === 'default' ? color : 'white'}
          decorative
        />
      </div>
    )
  }
)
AvatarIcon.displayName = 'AvatarIcon'

export {
  Icon,
  IconButton,
  IconWithBadge,
  AvatarIcon,
  iconVariants,
  iconButtonVariants,
  avatarIconVariants,
}