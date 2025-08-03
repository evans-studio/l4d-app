'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'full-width' | 'centered' | 'sidebar-left' | 'sidebar-right';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className,
  sidebar,
  header,
  footer,
  variant = 'default',
  maxWidth = 'xl',
  padding = 'md'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-8xl',
    full: 'max-w-none'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2 sm:p-4',
    md: 'p-4 sm:p-6 lg:p-8',
    lg: 'p-6 sm:p-8 lg:p-12'
  };

  const renderContent = () => {
    switch (variant) {
      case 'full-width':
        return (
          <div className={cn('min-h-screen flex flex-col', className)}>
            {header && (
              <header className="flex-shrink-0 sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
                {header}
              </header>
            )}
            <main className={cn('flex-1', paddingClasses[padding])}>
              {children}
            </main>
            {footer && (
              <footer className="flex-shrink-0 bg-gray-800 border-t border-gray-700">
                {footer}
              </footer>
            )}
          </div>
        );

      case 'centered':
        return (
          <div className={cn('min-h-screen flex flex-col', className)}>
            {header && (
              <header className="flex-shrink-0 sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
                <div className={cn('mx-auto', maxWidthClasses[maxWidth], paddingClasses[padding])}>
                  {header}
                </div>
              </header>
            )}
            <main className={cn('flex-1 mx-auto w-full', maxWidthClasses[maxWidth], paddingClasses[padding])}>
              {children}
            </main>
            {footer && (
              <footer className="flex-shrink-0 bg-gray-800 border-t border-gray-700">
                <div className={cn('mx-auto', maxWidthClasses[maxWidth], paddingClasses[padding])}>
                  {footer}
                </div>
              </footer>
            )}
          </div>
        );

      case 'sidebar-left':
        return (
          <div className={cn('min-h-screen flex flex-col', className)}>
            {header && (
              <header className="flex-shrink-0 sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
                {header}
              </header>
            )}
            <div className="flex-1 flex">
              {sidebar && (
                <aside className="flex-shrink-0 w-64 bg-gray-800 border-r border-gray-700 hidden lg:block overflow-y-auto">
                  <div className={paddingClasses[padding]}>
                    {sidebar}
                  </div>
                </aside>
              )}
              <main className={cn('flex-1 min-w-0', paddingClasses[padding])}>
                {children}
              </main>
            </div>
            {footer && (
              <footer className="flex-shrink-0 bg-gray-800 border-t border-gray-700">
                {footer}
              </footer>
            )}
          </div>
        );

      case 'sidebar-right':
        return (
          <div className={cn('min-h-screen flex flex-col', className)}>
            {header && (
              <header className="flex-shrink-0 sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
                {header}
              </header>
            )}
            <div className="flex-1 flex">
              <main className={cn('flex-1 min-w-0', paddingClasses[padding])}>
                {children}
              </main>
              {sidebar && (
                <aside className="flex-shrink-0 w-64 bg-gray-800 border-l border-gray-700 hidden lg:block overflow-y-auto">
                  <div className={paddingClasses[padding]}>
                    {sidebar}
                  </div>
                </aside>
              )}
            </div>
            {footer && (
              <footer className="flex-shrink-0 bg-gray-800 border-t border-gray-700">
                {footer}
              </footer>
            )}
          </div>
        );

      default:
        return (
          <div className={cn('min-h-screen flex flex-col', className)}>
            {header && (
              <header className="flex-shrink-0 sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
                {header}
              </header>
            )}
            <main className={cn('flex-1', paddingClasses[padding])}>
              <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
                {children}
              </div>
            </main>
            {footer && (
              <footer className="flex-shrink-0 bg-gray-800 border-t border-gray-700">
                <div className={cn('mx-auto', maxWidthClasses[maxWidth], paddingClasses[padding])}>
                  {footer}
                </div>
              </footer>
            )}
          </div>
        );
    }
  };

  return renderContent();
};

// Mobile-first responsive grid layout
interface GridLayoutProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  className,
  columns = { default: 1, sm: 2, lg: 3 },
  gap = 'md'
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const getGridClasses = () => {
    let classes = 'grid';
    
    if (columns.default) classes += ` grid-cols-${columns.default}`;
    if (columns.sm) classes += ` sm:grid-cols-${columns.sm}`;
    if (columns.md) classes += ` md:grid-cols-${columns.md}`;
    if (columns.lg) classes += ` lg:grid-cols-${columns.lg}`;
    if (columns.xl) classes += ` xl:grid-cols-${columns.xl}`;
    
    return classes;
  };

  return (
    <div className={cn(getGridClasses(), gapClasses[gap], className)}>
      {children}
    </div>
  );
};

// Responsive container component
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  center?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  size = 'xl',
  padding = 'md',
  center = true
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-none'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-4 py-4 sm:px-6',
    lg: 'px-4 py-6 sm:px-6 lg:px-8'
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        paddingClasses[padding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

// Flex layout utilities
interface FlexLayoutProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  responsive?: {
    sm?: Partial<Pick<FlexLayoutProps, 'direction' | 'align' | 'justify'>>;
    md?: Partial<Pick<FlexLayoutProps, 'direction' | 'align' | 'justify'>>;
    lg?: Partial<Pick<FlexLayoutProps, 'direction' | 'align' | 'justify'>>;
  };
}

export const FlexLayout: React.FC<FlexLayoutProps> = ({
  children,
  className,
  direction = 'row',
  align = 'start',
  justify = 'start',
  gap = 'md',
  wrap = false,
  responsive
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const getResponsiveClasses = () => {
    let classes = '';
    
    if (responsive?.sm) {
      if (responsive.sm.direction) classes += ` sm:${directionClasses[responsive.sm.direction]}`;
      if (responsive.sm.align) classes += ` sm:${alignClasses[responsive.sm.align]}`;
      if (responsive.sm.justify) classes += ` sm:${justifyClasses[responsive.sm.justify]}`;
    }
    
    if (responsive?.md) {
      if (responsive.md.direction) classes += ` md:${directionClasses[responsive.md.direction]}`;
      if (responsive.md.align) classes += ` md:${alignClasses[responsive.md.align]}`;
      if (responsive.md.justify) classes += ` md:${justifyClasses[responsive.md.justify]}`;
    }
    
    if (responsive?.lg) {
      if (responsive.lg.direction) classes += ` lg:${directionClasses[responsive.lg.direction]}`;
      if (responsive.lg.align) classes += ` lg:${alignClasses[responsive.lg.align]}`;
      if (responsive.lg.justify) classes += ` lg:${justifyClasses[responsive.lg.justify]}`;
    }
    
    return classes;
  };

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        wrap && 'flex-wrap',
        getResponsiveClasses(),
        className
      )}
    >
      {children}
    </div>
  );
};

// Layout section component
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: 'default' | 'muted' | 'accent' | 'transparent';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  children,
  className,
  background = 'default',
  padding = 'lg',
  fullWidth = false
}) => {
  const backgroundClasses = {
    default: 'bg-gray-900',
    muted: 'bg-gray-800',
    accent: 'bg-gray-700',
    transparent: 'bg-transparent'
  };

  const paddingClasses = {
    none: '',
    sm: 'py-6',
    md: 'py-8 sm:py-12',
    lg: 'py-12 sm:py-16',
    xl: 'py-16 sm:py-24'
  };

  return (
    <section
      className={cn(
        backgroundClasses[background],
        paddingClasses[padding],
        className
      )}
    >
      {fullWidth ? (
        children
      ) : (
        <Container>
          {children}
        </Container>
      )}
    </section>
  );
};