import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Heading Component
const headingVariants = cva(
  'font-bold text-[var(--text-primary)] leading-tight tracking-tight',
  {
    variants: {
      size: {
        h1: 'text-4xl sm:text-5xl md:text-6xl',
        h2: 'text-3xl sm:text-4xl md:text-5xl',
        h3: 'text-2xl sm:text-3xl md:text-4xl',
        h4: 'text-xl sm:text-2xl md:text-3xl',
        h5: 'text-lg sm:text-xl md:text-2xl',
        h6: 'text-base sm:text-lg md:text-xl',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
        extrabold: 'font-extrabold',
      },
      color: {
        primary: 'text-[var(--text-primary)]',
        secondary: 'text-[var(--text-secondary)]',
        muted: 'text-[var(--text-muted)]',
        accent: 'text-[var(--primary)]',
        success: 'text-[var(--success)]',
        warning: 'text-[var(--warning)]',
        error: 'text-[var(--error)]',
        white: 'text-white',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      size: 'h2',
      weight: 'bold',
      color: 'primary',
      align: 'left',
    },
  }
)

export interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'color'>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, weight, color, align, as, children, ...props }, ref) => {
    const Component = as || (size === 'h1' ? 'h1' : size === 'h2' ? 'h2' : size === 'h3' ? 'h3' : size === 'h4' ? 'h4' : size === 'h5' ? 'h5' : 'h6')
    
    return (
      <Component
        className={cn(headingVariants({ size, weight, color, align, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Heading.displayName = 'Heading'

// Text Component
const textVariants = cva(
  'text-[var(--text-primary)] leading-normal',
  {
    variants: {
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg sm:text-xl',
        xl: 'text-xl sm:text-2xl',
        '2xl': 'text-2xl sm:text-3xl',
      },
      weight: {
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
      color: {
        primary: 'text-[var(--text-primary)]',
        secondary: 'text-[var(--text-secondary)]',
        muted: 'text-[var(--text-muted)]',
        accent: 'text-[var(--primary)]',
        success: 'text-[var(--success)]',
        warning: 'text-[var(--warning)]',
        error: 'text-[var(--error)]',
        white: 'text-white',
        inherit: 'text-inherit',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
        justify: 'text-justify',
      },
      leading: {
        tight: 'leading-tight',
        snug: 'leading-snug',
        normal: 'leading-normal',
        relaxed: 'leading-relaxed',
        loose: 'leading-loose',
      },
    },
    defaultVariants: {
      size: 'base',
      weight: 'normal',
      color: 'primary',
      align: 'left',
      leading: 'normal',
    },
  }
)

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div' | 'label' | 'small' | 'strong' | 'em'
  truncate?: boolean
  lineClamp?: number
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ 
    className, 
    size, 
    weight, 
    color, 
    align, 
    leading, 
    as = 'p', 
    truncate = false,
    lineClamp,
    children, 
    ...props 
  }, ref) => {
    const truncateClasses = truncate ? 'truncate' : lineClamp ? `line-clamp-${lineClamp}` : ''
    
    const elementProps = {
      className: cn(
        textVariants({ size, weight, color, align, leading }),
        truncateClasses,
        className
      ),
      ref: ref as any,
      ...props
    }
    
    switch (as) {
      case 'span':
        return <span {...elementProps}>{children}</span>
      case 'div':
        return <div {...elementProps}>{children}</div>
      case 'label':
        return <label {...elementProps}>{children}</label>
      case 'small':
        return <small {...elementProps}>{children}</small>
      case 'strong':
        return <strong {...elementProps}>{children}</strong>
      case 'em':
        return <em {...elementProps}>{children}</em>
      default:
        return <p {...elementProps}>{children}</p>
    }
  }
)
Text.displayName = 'Text'

// Label Component
const labelVariants = cva(
  'text-sm font-medium text-[var(--text-primary)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      required: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      required: false,
    },
  }
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  required?: boolean
  optional?: boolean
  showOptional?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ 
    className, 
    size, 
    required = false,
    optional = false,
    showOptional = true,
    children, 
    ...props 
  }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ size, required, className }))}
        {...props}
      >
        <span className="flex items-center gap-1">
          {children}
          {required && (
            <span className="text-[var(--error)]" aria-label="required">
              *
            </span>
          )}
          {optional && showOptional && !required && (
            <span className="text-[var(--text-muted)] text-xs font-normal">
              (optional)
            </span>
          )}
        </span>
      </label>
    )
  }
)
Label.displayName = 'Label'

// Link Component
const linkVariants = cva(
  'inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] rounded-sm',
  {
    variants: {
      variant: {
        default: 'text-[var(--primary)] hover:text-[var(--primary-dark)] underline-offset-4 hover:underline',
        subtle: 'text-[var(--text-primary)] hover:text-[var(--primary)] underline-offset-4 hover:underline',
        muted: 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
        button: 'text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      underline: {
        always: 'underline',
        hover: 'hover:underline',
        none: 'no-underline',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      underline: 'hover',
    },
  }
)

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {
  external?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ 
    className, 
    variant, 
    size, 
    underline,
    external = false,
    leftIcon,
    rightIcon,
    children, 
    ...props 
  }, ref) => {
    return (
      <a
        className={cn(linkVariants({ variant, size, underline, className }))}
        ref={ref}
        {...(external && {
          target: '_blank',
          rel: 'noopener noreferrer',
        })}
        {...props}
      >
        {leftIcon && (
          <span className="h-4 w-4 flex items-center justify-center">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="h-4 w-4 flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </a>
    )
  }
)
Link.displayName = 'Link'

// Code Component
const codeVariants = cva(
  'font-mono rounded-md font-medium',
  {
    variants: {
      variant: {
        inline: 'bg-[var(--surface-secondary)] text-[var(--text-primary)] px-1.5 py-0.5 text-sm',
        block: 'bg-[var(--surface-secondary)] text-[var(--text-primary)] p-4 text-sm block overflow-x-auto',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'inline',
      size: 'md',
    },
  }
)

export interface CodeProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof codeVariants> {
  as?: 'code' | 'pre'
}

const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ className, variant, size, as = 'code', children, ...props }, ref) => {
    const elementProps = {
      className: cn(codeVariants({ variant, size, className })),
      ref: ref as any,
      ...props
    }
    
    if (as === 'pre') {
      return <pre {...elementProps}>{children}</pre>
    }
    
    return <code {...elementProps}>{children}</code>
  }
)
Code.displayName = 'Code'

// Blockquote Component
const Blockquote = React.forwardRef<
  HTMLQuoteElement,
  React.BlockquoteHTMLAttributes<HTMLQuoteElement>
>(({ className, ...props }, ref) => (
  <blockquote
    ref={ref}
    className={cn(
      'mt-6 border-l-4 border-[var(--border-primary)] pl-6 italic text-[var(--text-secondary)]',
      className
    )}
    {...props}
  />
))
Blockquote.displayName = 'Blockquote'

// Export all components and variants
export {
  Heading,
  Text,
  Label,
  Link,
  Code,
  Blockquote,
  headingVariants,
  textVariants,
  labelVariants,
  linkVariants,
  codeVariants,
}

