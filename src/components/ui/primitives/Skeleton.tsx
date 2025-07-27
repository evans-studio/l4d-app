'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva(
  'animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] rounded',
  {
    variants: {
      variant: {
        default: 'bg-gray-700',
        shimmer: 'animate-shimmer bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700',
        pulse: 'animate-pulse bg-gray-700'
      },
      shape: {
        rectangle: 'rounded',
        circle: 'rounded-full',
        rounded: 'rounded-lg'
      }
    },
    defaultVariants: {
      variant: 'shimmer',
      shape: 'rectangle'
    }
  }
);

interface SkeletonProps extends VariantProps<typeof skeletonVariants> {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant,
  shape,
  width,
  height,
  ...props
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div
      className={cn(skeletonVariants({ variant, shape }), className)}
      style={style}
      {...props}
    />
  );
};

// Pre-built skeleton components for common use cases
export const TextSkeleton: React.FC<{
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}> = ({ 
  lines = 1, 
  className,
  lastLineWidth = '75%'
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height={16}
        width={index === lines - 1 ? lastLineWidth : '100%'}
        className="h-4"
      />
    ))}
  </div>
);

export const AvatarSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <Skeleton
      shape="circle"
      className={cn(sizeClasses[size], className)}
    />
  );
};

export const CardSkeleton: React.FC<{
  showImage?: boolean;
  showAvatar?: boolean;
  className?: string;
}> = ({ 
  showImage = true, 
  showAvatar = false,
  className 
}) => (
  <div className={cn('p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-4', className)}>
    {showImage && (
      <Skeleton height={200} className="w-full rounded-lg" />
    )}
    
    <div className="space-y-3">
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <AvatarSkeleton size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="40%" />
            <Skeleton height={14} width="60%" />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Skeleton height={20} width="80%" />
        <TextSkeleton lines={2} />
      </div>
      
      <div className="flex justify-between items-center pt-2">
        <Skeleton height={14} width="30%" />
        <Skeleton height={32} width={80} shape="rounded" />
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}> = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  className 
}) => (
  <div className={cn('border border-gray-700 rounded-lg overflow-hidden', className)}>
    {showHeader && (
      <div className="bg-gray-700 p-3 border-b border-gray-600">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} height={16} width="70%" />
          ))}
        </div>
      </div>
    )}
    
    <div className="divide-y divide-gray-700">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-3">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} height={16} width="85%" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton: React.FC<{
  fields?: number;
  showButtons?: boolean;
  className?: string;
}> = ({ 
  fields = 4, 
  showButtons = true,
  className 
}) => (
  <div className={cn('space-y-6', className)}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton height={16} width="25%" />
        <Skeleton height={40} width="100%" shape="rounded" />
      </div>
    ))}
    
    {showButtons && (
      <div className="flex justify-end space-x-3 pt-4">
        <Skeleton height={40} width={80} shape="rounded" />
        <Skeleton height={40} width={120} shape="rounded" />
      </div>
    )}
  </div>
);

export const ListSkeleton: React.FC<{
  items?: number;
  showImage?: boolean;
  className?: string;
}> = ({ 
  items = 5, 
  showImage = true,
  className 
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-start space-x-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
        {showImage && (
          <Skeleton width={60} height={60} shape="rounded" />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton height={18} width="70%" />
          <TextSkeleton lines={2} />
          <div className="flex justify-between items-center pt-1">
            <Skeleton height={14} width="30%" />
            <Skeleton height={14} width="20%" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const NavigationSkeleton: React.FC<{
  items?: number;
  className?: string;
}> = ({ 
  items = 6,
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3 p-2">
        <Skeleton width={20} height={20} />
        <Skeleton height={16} width="60%" />
      </div>
    ))}
  </div>
);

export const StatsSkeleton: React.FC<{
  stats?: number;
  className?: string;
}> = ({ 
  stats = 4,
  className 
}) => (
  <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
    {Array.from({ length: stats }).map((_, index) => (
      <div key={index} className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton width={24} height={24} />
          <Skeleton height={14} width="30%" />
        </div>
        <div className="space-y-1">
          <Skeleton height={24} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonDemo: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      <h3 className="text-lg font-semibold text-gray-100">Loading Skeletons</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-200">Basic Skeletons</h4>
          <div className="space-y-3">
            <Skeleton height={20} width="100%" />
            <Skeleton height={20} width="75%" />
            <Skeleton height={20} width="50%" />
            <AvatarSkeleton size="lg" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-200">Text Skeleton</h4>
          <TextSkeleton lines={4} />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-200">Card Skeleton</h4>
          <CardSkeleton showImage showAvatar />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-200">Form Skeleton</h4>
          <FormSkeleton fields={3} />
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-200">Table Skeleton</h4>
        <TableSkeleton rows={3} columns={4} />
      </div>
      
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-200">Stats Skeleton</h4>
        <StatsSkeleton stats={4} />
      </div>
    </div>
  );
};