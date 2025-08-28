import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'

const cardVariants = cva(
  'rounded-lg border bg-surface-card text-text-primary shadow-[var(--elevation-1)] transition-all duration-200',
  {
    variants: {
      variant: {
        // Default with subtle purple hints
        default: 'border-border-secondary hover:border-border-hover',
        
        // Elevated with purple glow on hover
        elevated: 'border-border-secondary shadow-[var(--elevation-2)] hover:shadow-[var(--elevation-3)] hover:border-brand-500/30',
        
        // Outline with purple accent
        outline: 'border-border-accent bg-transparent backdrop-blur-sm',
        
        // Ghost with purple interaction
        ghost: 'border-transparent shadow-none hover:bg-brand-600/5 hover:border-brand-500/20',
        
        // Interactive with strong purple feedback
        interactive: 'border-border-secondary hover:border-brand-500 hover:shadow-purple cursor-pointer hover:bg-brand-600/5',
        
        // Service card with purple emphasis for CTAs
        service: 'border-border-secondary bg-gradient-to-br from-surface-card to-surface-tertiary hover:border-brand-500 hover:shadow-purple-lg',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      clickable: {
        true: 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: false,
      clickable: false,
    },
    compoundVariants: [
      {
        variant: 'interactive',
        clickable: true,
        class: 'active:scale-[0.98] active:shadow-sm',
      },
    ],
  }
)

const cardHeaderVariants = cva(
  'flex flex-col space-y-1.5',
  {
    variants: {
      layout: {
        default: 'pb-6',
        compact: 'pb-3',
        none: 'pb-0',
      },
      align: {
        left: 'text-left',
        center: 'text-center items-center',
        right: 'text-right items-end',
      },
    },
    defaultVariants: {
      layout: 'default',
      align: 'left',
    },
  }
)

const cardContentVariants = cva(
  'text-text-primary',
  {
    variants: {
      spacing: {
        none: '',
        sm: 'space-y-2',
        md: 'space-y-4',
        lg: 'space-y-6',
      },
    },
    defaultVariants: {
      spacing: 'md',
    },
  }
)

const cardFooterVariants = cva(
  'flex items-center',
  {
    variants: {
      layout: {
        default: 'pt-6',
        compact: 'pt-3',
        none: 'pt-0',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
      },
      direction: {
        row: 'flex-row gap-2',
        column: 'flex-col gap-2',
        'row-reverse': 'flex-row-reverse gap-2',
        'column-reverse': 'flex-col-reverse gap-2',
      },
    },
    defaultVariants: {
      layout: 'default',
      justify: 'start',
      direction: 'row',
    },
  }
)

// Card Root Component
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  as?: 'div' | 'article' | 'section'
  loading?: boolean
  disabled?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth, 
    clickable, 
    as = 'div',
    loading = false,
    disabled = false,
    children, 
    ...props 
  }, ref) => {
    const Component = as
    
    return (
      <Component
        ref={ref}
        className={cn(
          cardVariants({ variant, size, fullWidth, clickable, className }),
          loading && 'animate-pulse',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Card.displayName = 'Card'

// Card Header Component
export interface CardHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof cardHeaderVariants> {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  avatar?: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ 
    className, 
    layout, 
    align, 
    title, 
    subtitle, 
    actions, 
    avatar,
    children, 
    ...props 
  }, ref) => {
    const hasContent = title || subtitle || children || avatar || actions
    
    if (!hasContent) return null
    
    return (
      <div
        ref={ref}
        className={cn(cardHeaderVariants({ layout, align, className }))}
        {...props}
      >
        {(avatar || title || subtitle || actions) && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {avatar && (
                <div className="flex-shrink-0">
                  {avatar}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                {title && (
                  <h3 className="text-lg font-semibold leading-none tracking-tight text-white truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-300 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            {actions && (
              <div className="flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        )}
        
        {children && (
          <div className={cn(
            (title || subtitle || avatar || actions) && 'mt-4'
          )}>
            {children}
          </div>
        )}
      </div>
    )
  }
)
CardHeader.displayName = 'CardHeader'

// Card Content Component
export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, spacing, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(cardContentVariants({ spacing, className }))} 
      {...props}
    >
      {children}
    </div>
  )
)
CardContent.displayName = 'CardContent'

// Card Footer Component
export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, layout, justify, direction, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(cardFooterVariants({ layout, justify, direction, className }))} 
      {...props}
    >
      {children}
    </div>
  )
)
CardFooter.displayName = 'CardFooter'

// Card Image Component
export interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto'
  position?: 'top' | 'bottom' | 'standalone'
  overlay?: React.ReactNode
}

const CardImage = React.forwardRef<HTMLImageElement, CardImageProps>(
  ({ 
    className, 
    aspectRatio = 'auto', 
    position = 'top',
    overlay,
    alt,
    ...props 
  }, ref) => {
    const aspectRatioClasses = {
      square: 'aspect-square',
      video: 'aspect-video',
      wide: 'aspect-[21/9]',
      auto: 'h-auto',
    }[aspectRatio]
    
    const positionClasses = {
      top: '-mx-6 -mt-6 mb-6 rounded-t-lg',
      bottom: '-mx-6 -mb-6 mt-6 rounded-b-lg',
      standalone: 'rounded-lg',
    }[position]
    
    return (
      <div className={cn(
        'relative overflow-hidden',
        aspectRatio !== 'auto' && aspectRatioClasses,
        positionClasses
      )}>
        <img
          ref={ref}
          className={cn(
            'w-full object-cover transition-transform duration-300 hover:scale-105',
            aspectRatio === 'auto' && 'h-auto',
            aspectRatio !== 'auto' && 'h-full',
            className
          )}
          alt={alt}
          {...props}
        />
        {overlay && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            {overlay}
          </div>
        )}
      </div>
    )
  }
)
CardImage.displayName = 'CardImage'

// Card Skeleton Component
export interface CardSkeletonProps {
  lines?: number
  showHeader?: boolean
  showFooter?: boolean
  showImage?: boolean
  className?: string
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({
  lines = 3,
  showHeader = true,
  showFooter = false,
  showImage = false,
  className,
}) => {
  return (
    <Card className={cn('animate-pulse', className)}>
      {showImage && (
        <div className="h-48 bg-gray-700 rounded-t-lg -mx-6 -mt-6 mb-6" />
      )}
      
      {showHeader && (
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-3 bg-gray-700 rounded"
              style={{
                width: i === lines - 1 ? '60%' : '100%'
              }}
            />
          ))}
        </div>
      </CardContent>
      
      {showFooter && (
        <CardFooter>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-gray-700 rounded" />
            <div className="h-8 w-16 bg-gray-700 rounded" />
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

// Responsive Card Grid Component
export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg'
}

const CardGrid = React.forwardRef<HTMLDivElement, CardGridProps>(
  ({ 
    className, 
    columns = { mobile: 1, tablet: 2, desktop: 3 },
    gap = 'md',
    children, 
    ...props 
  }, ref) => {
    const gapClasses = {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    }[gap]
    
    // Use predefined classes to avoid Tailwind purging issues
    const getGridClasses = () => {
      const mobileClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-2', 
        3: 'grid-cols-3',
        4: 'grid-cols-4'
      }[columns.mobile || 1] || 'grid-cols-1'
      
      const tabletClass = {
        1: 'sm:grid-cols-1',
        2: 'sm:grid-cols-2',
        3: 'sm:grid-cols-3', 
        4: 'sm:grid-cols-4'
      }[columns.tablet || 2] || 'sm:grid-cols-2'
      
      const desktopClass = {
        1: 'md:grid-cols-1',
        2: 'md:grid-cols-2', 
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4'
      }[columns.desktop || 3] || 'md:grid-cols-3'
      
      return cn('grid', gapClasses, mobileClass, tabletClass, desktopClass)
    }
    
    const gridClasses = getGridClasses()
    
    return (
      <div
        ref={ref}
        className={cn(gridClasses, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardGrid.displayName = 'CardGrid'

// Purple-enhanced card demo
export const CardDemo: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl">
      <h3 className="text-lg font-semibold text-text-primary">Purple-Enhanced Card System</h3>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Card Variants with Purple Accents</h4>
          <CardGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
            <Card variant="default">
              <CardHeader>
                <h3 className="text-lg font-semibold">Default Card</h3>
                <p className="text-text-secondary">Subtle purple hints on hover</p>
              </CardHeader>
              <CardContent>
                <p>Hover over this card to see the subtle purple border accent.</p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3 className="text-lg font-semibold">Elevated Card</h3>
                <p className="text-text-secondary">Purple glow effects</p>
              </CardHeader>
              <CardContent>
                <p>Features purple shadow and glow effects on hover.</p>
              </CardContent>
            </Card>

            <Card variant="interactive" clickable onClick={() => logger.debug('Card clicked')}>
              <CardHeader>
                <h3 className="text-lg font-semibold">Interactive Card</h3>
                <p className="text-text-secondary">Strong purple feedback</p>
              </CardHeader>
              <CardContent>
                <p>Click me! Strong purple hover and focus states.</p>
              </CardContent>
            </Card>
          </CardGrid>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Service Cards - Purple CTA Emphasis</h4>
          <CardGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
            <Card variant="service">
              <CardImage 
                src="/api/placeholder/300/200" 
                alt="Exterior Detailing"
                position="top"
              />
              <CardHeader>
                <h3 className="text-xl font-bold text-brand-300">Exterior Detailing</h3>
                <p className="text-text-secondary">Complete wash, wax & protection</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Hand wash & dry</li>
                    <li>• Paint correction</li>
                    <li>• Ceramic coating</li>
                    <li>• Wheel & tire detail</li>
                  </ul>
                  <div className="text-2xl font-bold text-brand-400">£89</div>
                </div>
              </CardContent>
              <CardFooter>
                <button className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 px-6 rounded-lg font-medium transition-all hover:shadow-purple-lg">
                  Book Exterior Detail
                </button>
              </CardFooter>
            </Card>

            <Card variant="service">
              <CardImage 
                src="/api/placeholder/300/200" 
                alt="Interior Detailing"
                position="top"
              />
              <CardHeader>
                <h3 className="text-xl font-bold text-brand-300">Interior Detailing</h3>
                <p className="text-text-secondary">Deep clean & protection</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Vacuum & steam clean</li>
                    <li>• Leather conditioning</li>
                    <li>• Fabric protection</li>
                    <li>• Dashboard detailing</li>
                  </ul>
                  <div className="text-2xl font-bold text-brand-400">£79</div>
                </div>
              </CardContent>
              <CardFooter>
                <button className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 px-6 rounded-lg font-medium transition-all hover:shadow-purple-lg">
                  Book Interior Detail
                </button>
              </CardFooter>
            </Card>

            <Card variant="service" className="border-brand-500/50 bg-gradient-to-br from-brand-600/5 to-brand-800/10">
              <div className="absolute top-4 right-4 bg-brand-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                POPULAR
              </div>
              <CardImage 
                src="/api/placeholder/300/200" 
                alt="Full Service"
                position="top"
              />
              <CardHeader>
                <h3 className="text-xl font-bold text-brand-300">Full Service</h3>
                <p className="text-text-secondary">Complete interior & exterior</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Everything included</li>
                    <li>• Paint correction</li>
                    <li>• Ceramic coating</li>
                    <li>• Interior protection</li>
                  </ul>
                  <div className="flex items-center gap-2">
                    <div className="text-lg text-text-muted line-through">£168</div>
                    <div className="text-2xl font-bold text-brand-400">£149</div>
                    <div className="text-sm bg-success-600 text-white px-2 py-1 rounded">SAVE £19</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <button className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 px-6 rounded-lg font-medium transition-all hover:shadow-purple-lg animate-purple-pulse">
                  Book Full Service
                </button>
              </CardFooter>
            </Card>
          </CardGrid>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Booking Status Cards</h4>
          <CardGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md">
            <Card variant="default" className="border-success-500/50 bg-success-600/5">
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-2">✓</div>
                <h3 className="font-semibold text-success-400 mb-1">Confirmed</h3>
                <p className="text-sm text-text-secondary">Booking #1234</p>
              </CardContent>
            </Card>

            <Card variant="default" className="border-warning-500/50 bg-warning-600/5">
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-2">⏳</div>
                <h3 className="font-semibold text-warning-400 mb-1">Pending</h3>
                <p className="text-sm text-text-secondary">Booking #1235</p>
              </CardContent>
            </Card>

            <Card variant="default" className="border-brand-500/50 bg-brand-600/5">
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-2">🚗</div>
                <h3 className="font-semibold text-brand-400 mb-1">In Progress</h3>
                <p className="text-sm text-text-secondary">Booking #1236</p>
              </CardContent>
            </Card>

            <Card variant="default" className="border-error-500/50 bg-error-600/5">
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-2">❌</div>
                <h3 className="font-semibold text-error-400 mb-1">Cancelled</h3>
                <p className="text-sm text-text-secondary">Booking #1237</p>
              </CardContent>
            </Card>
          </CardGrid>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-text-secondary">Customer Reviews with Purple Accents</h4>
          <CardGrid columns={{ mobile: 1, tablet: 1, desktop: 2 }} gap="lg">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold">
                    JD
                  </div>
                  <div>
                    <h4 className="font-semibold">John Davies</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-brand-400">★</span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary leading-relaxed">
                  &quot;Absolutely fantastic service! My BMW looks brand new. The team&apos;s attention to detail is incredible and the purple branding really stands out. Will definitely be back!&quot;
                </p>
              </CardContent>
              <CardFooter className="text-sm text-text-muted">
                Exterior Detail • 2 days ago
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold">
                    SM
                  </div>
                  <div>
                    <h4 className="font-semibold">Sarah Mitchell</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-brand-400">★</span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary leading-relaxed">
                  "Professional, reliable, and the results speak for themselves. Love4Detailing has earned a customer for life. The booking process was smooth and the quality exceptional."
                </p>
              </CardContent>
              <CardFooter className="text-sm text-text-muted">
                Full Service • 1 week ago
              </CardFooter>
            </Card>
          </CardGrid>
        </div>
      </div>
    </div>
  );
};

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardImage,
  CardSkeleton,
  CardGrid,
  cardVariants,
  cardHeaderVariants,
  cardContentVariants,
  cardFooterVariants,
}