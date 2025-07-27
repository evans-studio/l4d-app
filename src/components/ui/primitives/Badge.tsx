'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X, Check, AlertCircle, Clock, Star } from 'lucide-react';

const badgeVariants = cva(
  'inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-gray-700 text-gray-100 hover:bg-gray-600',
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-600 text-gray-100 hover:bg-gray-500',
        success: 'bg-green-600 text-white hover:bg-green-700',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
        error: 'bg-red-600 text-white hover:bg-red-700',
        info: 'bg-blue-500 text-white hover:bg-blue-600',
        outline: 'border border-gray-600 text-gray-300 hover:bg-gray-800',
        ghost: 'text-gray-300 hover:bg-gray-800'
      },
      size: {
        sm: 'px-2 py-0.5 text-xs rounded-md gap-1',
        md: 'px-2.5 py-1 text-sm rounded-md gap-1.5',
        lg: 'px-3 py-1.5 text-sm rounded-lg gap-2'
      },
      shape: {
        rounded: '',
        pill: 'rounded-full',
        square: 'rounded-none'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'rounded'
    }
  }
);

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
         VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onRemove?: () => void;
  removable?: boolean;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, shape, children, icon, onRemove, removable, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, shape }), className)}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
        {(removable || onRemove) && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 ml-1 rounded-full hover:bg-black/20 focus:outline-none focus:bg-black/20 transition-colors"
            aria-label="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge with predefined states
interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'icon'> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'error';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  children,
  ...props
}) => {
  const statusConfig = {
    active: {
      variant: 'success' as const,
      icon: <Check className="w-3 h-3" />
    },
    inactive: {
      variant: 'secondary' as const,
      icon: <Clock className="w-3 h-3" />
    },
    pending: {
      variant: 'warning' as const,
      icon: <Clock className="w-3 h-3" />
    },
    completed: {
      variant: 'success' as const,
      icon: <Check className="w-3 h-3" />
    },
    cancelled: {
      variant: 'error' as const,
      icon: <X className="w-3 h-3" />
    },
    error: {
      variant: 'error' as const,
      icon: <AlertCircle className="w-3 h-3" />
    }
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      icon={showIcon ? config.icon : undefined}
      {...props}
    >
      {children || status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

// Priority Badge
interface PriorityBadgeProps extends Omit<BadgeProps, 'variant' | 'icon'> {
  priority: 'low' | 'medium' | 'high' | 'critical';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  showIcon = true,
  children,
  ...props
}) => {
  const priorityConfig = {
    low: {
      variant: 'secondary' as const,
      icon: <div className="w-2 h-2 bg-gray-400 rounded-full" />
    },
    medium: {
      variant: 'warning' as const,
      icon: <div className="w-2 h-2 bg-yellow-400 rounded-full" />
    },
    high: {
      variant: 'primary' as const,
      icon: <div className="w-2 h-2 bg-blue-400 rounded-full" />
    },
    critical: {
      variant: 'error' as const,
      icon: <div className="w-2 h-2 bg-red-400 rounded-full" />
    }
  };

  const config = priorityConfig[priority];

  return (
    <Badge
      variant={config.variant}
      icon={showIcon ? config.icon : undefined}
      {...props}
    >
      {children || priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

// Rating Badge
interface RatingBadgeProps extends Omit<BadgeProps, 'variant' | 'icon'> {
  rating: number;
  maxRating?: number;
  showStars?: boolean;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  maxRating = 5,
  showStars = true,
  children,
  ...props
}) => {
  const getVariant = () => {
    const percentage = (rating / maxRating) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'primary';
    if (percentage >= 40) return 'warning';
    return 'error';
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            'w-3 h-3',
            i <= rating ? 'fill-current' : 'stroke-current fill-none'
          )}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <Badge
      variant={getVariant()}
      icon={showStars ? renderStars() : undefined}
      {...props}
    >
      {children || `${rating}/${maxRating}`}
    </Badge>
  );
};

// Count Badge (for notifications, etc.)
interface CountBadgeProps extends Omit<BadgeProps, 'variant' | 'size'> {
  count: number;
  maxCount?: number;
  showZero?: boolean;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  maxCount = 99,
  showZero = false,
  className,
  ...props
}) => {
  if (count === 0 && !showZero) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <Badge
      variant="error"
      size="sm"
      shape="pill"
      className={cn(
        'min-w-[1.25rem] h-5 text-xs font-bold justify-center px-1',
        className
      )}
      {...props}
    >
      {displayCount}
    </Badge>
  );
};

// Badge Group for multiple badges
interface BadgeGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
  wrap?: boolean;
}

export const BadgeGroup: React.FC<BadgeGroupProps> = ({
  children,
  className,
  spacing = 'normal',
  wrap = true
}) => {
  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-3'
  };

  return (
    <div
      className={cn(
        'flex items-center',
        spacingClasses[spacing],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
};

// Interactive Badge (clickable)
interface InteractiveBadgeProps extends BadgeProps {
  selected?: boolean;
  onToggle?: () => void;
  href?: string;
}

export const InteractiveBadge: React.FC<InteractiveBadgeProps> = ({
  selected,
  onToggle,
  href,
  className,
  variant = 'outline',
  ...props
}) => {
  const Component = href ? 'a' : 'button';
  
  return (
    <Component
      href={href}
      onClick={onToggle}
      className={cn(
        badgeVariants({ 
          variant: selected ? 'primary' : variant, 
          size: props.size, 
          shape: props.shape 
        }),
        'cursor-pointer select-none',
        selected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900',
        className
      )}
      {...(href ? {} : { type: 'button' })}
    >
      {props.icon && <span className="flex-shrink-0">{props.icon}</span>}
      <span className="truncate">{props.children}</span>
      {(props.removable || props.onRemove) && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            props.onRemove?.();
          }}
          className="flex-shrink-0 ml-1 rounded-full hover:bg-black/20 focus:outline-none focus:bg-black/20 transition-colors cursor-pointer"
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </Component>
  );
};

export const BadgeDemo: React.FC = () => {
  const [selectedTags, setSelectedTags] = React.useState<string[]>(['react']);
  const [counts, setCounts] = React.useState({ messages: 3, notifications: 12 });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <h3 className="text-lg font-semibold text-gray-100">Badge Components</h3>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Basic Badges</h4>
          <BadgeGroup>
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </BadgeGroup>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Sizes</h4>
          <BadgeGroup>
            <Badge size="sm" variant="primary">Small</Badge>
            <Badge size="md" variant="primary">Medium</Badge>
            <Badge size="lg" variant="primary">Large</Badge>
          </BadgeGroup>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Status Badges</h4>
          <BadgeGroup>
            <StatusBadge status="active">Active</StatusBadge>
            <StatusBadge status="pending">Pending</StatusBadge>
            <StatusBadge status="completed">Completed</StatusBadge>
            <StatusBadge status="cancelled">Cancelled</StatusBadge>
            <StatusBadge status="error">Error</StatusBadge>
          </BadgeGroup>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Priority Badges</h4>
          <BadgeGroup>
            <PriorityBadge priority="low">Low</PriorityBadge>
            <PriorityBadge priority="medium">Medium</PriorityBadge>
            <PriorityBadge priority="high">High</PriorityBadge>
            <PriorityBadge priority="critical">Critical</PriorityBadge>
          </BadgeGroup>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Rating Badges</h4>
          <BadgeGroup>
            <RatingBadge rating={4.5}>4.5/5</RatingBadge>
            <RatingBadge rating={3.2}>3.2/5</RatingBadge>
            <RatingBadge rating={2.1}>2.1/5</RatingBadge>
            <RatingBadge rating={4.8} showStars={false}>Excellent</RatingBadge>
          </BadgeGroup>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Count Badges</h4>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="text-gray-200">Messages</span>
              <CountBadge count={counts.messages} className="absolute -top-2 -right-2">{counts.messages}</CountBadge>
            </div>
            <div className="relative">
              <span className="text-gray-200">Notifications</span>
              <CountBadge count={counts.notifications} className="absolute -top-2 -right-2">{counts.notifications}</CountBadge>
            </div>
            <div className="relative">
              <span className="text-gray-200">No notifications</span>
              <CountBadge count={0} showZero className="absolute -top-2 -right-2">0</CountBadge>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Interactive Tags</h4>
          <BadgeGroup>
            {['react', 'typescript', 'tailwind', 'nextjs', 'nodejs'].map(tag => (
              <InteractiveBadge
                key={tag}
                selected={selectedTags.includes(tag)}
                onToggle={() => toggleTag(tag)}
              >
                {tag}
              </InteractiveBadge>
            ))}
          </BadgeGroup>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-200">Removable Badges</h4>
          <BadgeGroup>
            <Badge variant="primary" removable onRemove={() => console.log('Remove tag')}>
              Frontend
            </Badge>
            <Badge variant="success" removable onRemove={() => console.log('Remove tag')}>
              Approved
            </Badge>
            <Badge variant="warning" removable onRemove={() => console.log('Remove tag')}>
              In Review
            </Badge>
          </BadgeGroup>
        </div>
      </div>
    </div>
  );
};