'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { logger } from '@/lib/utils/logger'

const logoVariants = cva(
  'select-none transition-all duration-200',
  {
    variants: {
      variant: {
        full: 'flex items-center gap-3',
        icon: 'flex items-center justify-center',
        text: 'flex items-center'
      },
      size: {
        xs: 'h-6',
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12',
        xl: 'h-16',
        '2xl': 'h-20'
      },
      theme: {
        light: '',
        dark: '',
        auto: ''
      }
    },
    defaultVariants: {
      variant: 'full',
      size: 'md',
      theme: 'auto'
    }
  }
);

interface LogoProps extends VariantProps<typeof logoVariants> {
  className?: string;
  href?: string;
  onClick?: () => void;
  showText?: boolean;
  priority?: boolean; // For Next.js Image priority loading
}

export const Logo: React.FC<LogoProps> = ({
  className,
  variant,
  size,
  theme,
  href,
  onClick,
  showText = true,
  priority = false,
  ...props
}) => {
  const sizeMap = {
    xs: { width: 24, height: 24, textSize: 'text-sm' },
    sm: { width: 32, height: 32, textSize: 'text-base' },
    md: { width: 40, height: 40, textSize: 'text-lg' },
    lg: { width: 48, height: 48, textSize: 'text-xl' },
    xl: { width: 64, height: 64, textSize: 'text-2xl' },
    '2xl': { width: 80, height: 80, textSize: 'text-3xl' }
  };

  const { width, height, textSize } = sizeMap[size || 'md'];

  const LogoIcon = () => (
    <div className={cn(
      'relative flex items-center justify-center rounded-lg',
      'bg-gradient-to-br from-brand-500 to-brand-700',
      'shadow-purple ring-1 ring-brand-400/20'
    )}>
      <Image
        src="/logo.png"
        alt="Love4Detailing"
        width={width}
        height={height}
        priority={priority}
        className="object-contain p-1 filter drop-shadow-sm"
      />
    </div>
  );

  const LogoText = () => (
    <span className={cn(
      'font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent',
      textSize
    )}>
      Love4Detailing
    </span>
  );

  const LogoContent = () => {
    switch (variant) {
      case 'icon':
        return <LogoIcon />;
      case 'text':
        return <LogoText />;
      case 'full':
      default:
        return (
          <>
            <LogoIcon />
            {showText && (
              <div className="hidden sm:block">
                <LogoText />
              </div>
            )}
          </>
        );
    }
  };

  const logoElement = (
    <div
      className={cn(logoVariants({ variant, size, theme }), className)}
      onClick={onClick}
      {...props}
    >
      <LogoContent />
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          'inline-flex hover:opacity-80 transition-opacity',
          onClick && 'cursor-pointer'
        )}
      >
        {logoElement}
      </a>
    );
  }

  return logoElement;
};

// Specialized logo variants for different use cases
export const HeaderLogo: React.FC<Omit<LogoProps, 'variant' | 'size'> & {
  size?: 'sm' | 'md' | 'lg';
}> = ({ size = 'md', ...props }) => (
  <Logo
    variant="full"
    size={size}
    showText={true}
    priority={true}
    {...props}
  />
);

// Dashboard logo for admin and customer dashboards - clean logo without background or text
export const DashboardLogo: React.FC<{
  size?: number;
  className?: string;
  priority?: boolean;
}> = ({ size = 300, className, priority = true, ...props }) => (
  <Image
    src="/logo1.png"
    alt="Love4Detailing"
    width={size}
    height={size}
    priority={priority}
    className={cn("object-contain", className)}
    {...props}
  />
);

// Auth pages logo - clean logo without background, same sizing as homepage
export const AuthLogo: React.FC<{
  className?: string;
  priority?: boolean;
}> = ({ className, priority = true, ...props }) => (
  <div className={cn('flex items-center justify-center', className)}>
    <Image
      src="/logo1.png"
      alt="Love4Detailing"
      width={400}
      height={400}
      priority={priority}
      className="object-contain"
      {...props}
    />
  </div>
);

export const FooterLogo: React.FC<Omit<LogoProps, 'variant' | 'size'>> = (props) => (
  <Logo
    variant="full"
    size="sm"
    className="opacity-80 hover:opacity-100 transition-opacity"
    {...props}
  />
);

export const MobileLogo: React.FC<Omit<LogoProps, 'variant' | 'size'>> = (props) => (
  <Logo
    variant="icon"
    size="sm"
    priority={true}
    {...props}
  />
);

export const LoadingLogo: React.FC<Omit<LogoProps, 'variant' | 'size'>> = (props) => (
  <div className="flex flex-col items-center gap-4">
    <Logo
      variant="icon"
      size="xl"
      className="animate-purple-pulse"
      priority={true}
      {...props}
    />
    <div className="text-center">
      <Logo
        variant="text"
        size="lg"
        className="animate-fade-in"
        {...props}
      />
      <p className="text-sm text-text-muted mt-2 animate-fade-in">
        Professional Car Detailing
      </p>
    </div>
  </div>
);

// Branded logo with tagline
export const BrandedLogo: React.FC<LogoProps & {
  tagline?: string;
  vertical?: boolean;
}> = ({ 
  tagline = "Professional Car Detailing",
  vertical = false,
  className,
  ...props 
}) => (
  <div className={cn(
    'flex items-center gap-4',
    vertical && 'flex-col text-center gap-2',
    className
  )}>
    <Logo {...props} />
    {tagline && (
      <div className={cn(
        'text-text-muted',
        vertical ? 'text-center' : 'border-l border-border-secondary pl-4',
        props.size === '2xl' ? 'text-base' :
        props.size === 'xl' ? 'text-sm' :
        props.size === 'lg' ? 'text-sm' : 'text-xs'
      )}>
        {tagline}
      </div>
    )}
  </div>
);

// Responsive logo that adapts to screen size
export const ResponsiveLogo: React.FC<LogoProps> = ({ className, ...props }) => (
  <div className={cn('flex items-center', className)}>
    {/* Mobile: Larger icon only, fills width */}
    <div className="block sm:hidden w-full">
      <Logo variant="icon" size="lg" className="justify-center" {...props} />
    </div>
    
    {/* Tablet: Icon + Text, bigger than before */}
    <div className="hidden sm:block lg:hidden">
      <Logo variant="full" size="lg" showText={true} {...props} />
    </div>
    
    {/* Desktop: Full logo with extra large size */}
    <div className="hidden lg:block">
      <Logo variant="full" size="xl" showText={true} {...props} />
    </div>
  </div>
);

// Interactive logo with hover effects
export const InteractiveLogo: React.FC<LogoProps & {
  glowOnHover?: boolean;
}> = ({ 
  glowOnHover = true,
  className,
  ...props 
}) => (
  <Logo
    className={cn(
      'transition-all duration-300 hover:scale-105',
      glowOnHover && 'hover:drop-shadow-purple-glow',
      'cursor-pointer',
      className
    )}
    {...props}
  />
);

export const LogoDemo: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      <h3 className="text-lg font-semibold text-gray-100">Logo Components</h3>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Logo Variants</h4>
          <div className="flex flex-wrap items-center gap-6 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Logo variant="full" size="md" />
            <Logo variant="icon" size="md" />
            <Logo variant="text" size="md" />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Logo Sizes</h4>
          <div className="flex flex-wrap items-end gap-6 p-6 bg-surface-card rounded-lg border border-border-secondary">
            <Logo variant="full" size="xs" />
            <Logo variant="full" size="sm" />
            <Logo variant="full" size="md" />
            <Logo variant="full" size="lg" />
            <Logo variant="full" size="xl" />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Specialized Logos</h4>
          <div className="space-y-4">
            <div className="p-4 bg-surface-card rounded-lg border border-border-secondary">
              <p className="text-sm text-text-muted mb-3">Header Logo</p>
              <HeaderLogo href="/" />
            </div>
            
            <div className="p-4 bg-surface-card rounded-lg border border-border-secondary">
              <p className="text-sm text-text-muted mb-3">Responsive Logo</p>
              <ResponsiveLogo />
            </div>
            
            <div className="p-4 bg-surface-card rounded-lg border border-border-secondary">
              <p className="text-sm text-text-muted mb-3">Branded Logo</p>
              <BrandedLogo size="lg" />
            </div>
            
            <div className="p-4 bg-surface-card rounded-lg border border-border-secondary">
              <p className="text-sm text-text-muted mb-3">Interactive Logo (hover me)</p>
              <InteractiveLogo size="lg" onClick={() => logger.debug('Logo clicked!')} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Loading State</h4>
          <div className="flex justify-center p-8 bg-surface-card rounded-lg border border-border-secondary">
            <LoadingLogo />
          </div>
        </div>
      </div>
    </div>
  );
};