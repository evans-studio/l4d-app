'use client';

import React from 'react';
import { useBookingFlowStore } from '@/lib/store/bookingFlowStore';
import { 
  Sparkles, 
  Car, 
  Calendar, 
  MapPin, 
  User, 
  Receipt, 
  Check, 
  Circle 
} from 'lucide-react';

const steps = [
  { 
    number: 1, 
    name: 'Service', 
    shortName: 'Service',
    icon: Sparkles, 
    description: 'Choose your detailing service' 
  },
  { 
    number: 2, 
    name: 'Vehicle', 
    shortName: 'Vehicle',
    icon: Car, 
    description: 'Enter vehicle details' 
  },
  { 
    number: 3, 
    name: 'Schedule', 
    shortName: 'Time',
    icon: Calendar, 
    description: 'Select date and time' 
  },
  { 
    number: 4, 
    name: 'Location', 
    shortName: 'Address',
    icon: MapPin, 
    description: 'Service address' 
  },
  { 
    number: 5, 
    name: 'Contact', 
    shortName: 'Details',
    icon: User, 
    description: 'Your contact information' 
  },
  { 
    number: 6, 
    name: 'Confirm', 
    shortName: 'Review',
    icon: Receipt, 
    description: 'Review and confirm' 
  },
];

interface BookingFlowIndicatorProps {
  variant?: 'default' | 'compact' | 'mobile';
}

export function BookingFlowIndicator({ variant = 'default' }: BookingFlowIndicatorProps) {
  const { currentStep, setStep } = useBookingFlowStore();

  // Handle step navigation - only allow navigation to completed steps
  const handleStepClick = (stepNumber: number) => {
    // Only allow navigation to previous/completed steps
    if (stepNumber < currentStep) {
      setStep(stepNumber as 1 | 2 | 3 | 4 | 5 | 6);
    }
  };

  if (variant === 'mobile') {
    return (
      <div className="sm:hidden px-4 py-3 bg-surface-secondary border-b border-border-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep >= (steps[currentStep - 1]?.number || 1)
                ? 'bg-brand-600 text-white' 
                : 'bg-surface-tertiary text-text-muted'
            }`}>
              {currentStep}
            </div>
            <span className="text-sm font-medium text-text-primary">
              {steps[currentStep - 1]?.shortName || 'Step'}
            </span>
          </div>
          <div className="text-xs text-text-secondary">
            {currentStep} of {steps.length}
          </div>
        </div>
        
        {/* Clickable mini steps */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isClickable = step.number < currentStep;
            
            return (
              <button
                key={step.number}
                onClick={() => handleStepClick(step.number)}
                disabled={!isClickable}
                className={`
                  min-w-[44px] min-h-[44px] rounded-full transition-all duration-200 touch-manipulation
                  flex items-center justify-center relative
                  ${isCompleted 
                    ? 'cursor-pointer hover:bg-brand-100' 
                    : isActive 
                      ? 'bg-brand-50' 
                      : 'hover:bg-surface-hover'
                  }
                  ${isClickable ? 'cursor-pointer' : ''}
                `}
                aria-label={`Go to ${step.name}`}
              >
                <div className={`
                  w-8 h-2 rounded-full transition-all duration-200
                  ${isCompleted 
                    ? 'bg-brand-600' 
                    : isActive 
                      ? 'bg-brand-600' 
                      : 'bg-surface-tertiary'
                  }
                `} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="hidden sm:block lg:hidden px-6 py-4 bg-surface-secondary border-b border-border-secondary">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const isClickable = step.number < currentStep;
              const IconComponent = step.icon;
              
              return (
                <div key={step.number} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(step.number)}
                    disabled={!isClickable}
                    className={`flex items-center gap-3 min-h-[44px] px-2 py-2 rounded-lg transition-all touch-manipulation ${
                      isClickable ? 'cursor-pointer hover:bg-surface-hover' : ''
                    }`}
                    aria-label={isClickable ? `Go to ${step.name}` : undefined}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-all
                      ${isCompleted 
                        ? 'bg-brand-600 text-white shadow-[var(--elevation-1)]' 
                        : isActive 
                          ? 'bg-brand-600 text-white shadow-[var(--elevation-2)]' 
                          : 'bg-surface-tertiary text-text-muted'
                      }
                      ${isClickable ? 'hover:bg-brand-700' : ''}
                    `}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <IconComponent className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-brand-400' : isCompleted ? 'text-text-primary' : 'text-text-muted'
                    }`}>
                      {step.shortName}
                    </span>
                  </button>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-brand-600' : 'bg-surface-tertiary'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Default variant - full step indicator
  return (
    <div className="hidden lg:block px-6 py-6 bg-surface-secondary border-b border-border-secondary">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isClickable = step.number < currentStep;
            const IconComponent = step.icon;
            
            return (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.number)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center text-center max-w-[120px] min-h-[44px] px-2 py-2 rounded-lg transition-all touch-manipulation ${
                    isClickable ? 'cursor-pointer hover:bg-surface-hover' : ''
                  }`}
                  aria-label={isClickable ? `Go to ${step.name}` : undefined}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all
                    ${isCompleted 
                      ? 'bg-brand-600 text-white shadow-[var(--elevation-1)]' 
                      : isActive 
                        ? 'bg-brand-600 text-white shadow-[var(--elevation-2)]' 
                        : 'bg-surface-tertiary text-text-muted'
                    }
                    ${isClickable ? 'hover:bg-brand-700' : ''}
                  `}>
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <IconComponent className="w-6 h-6" />
                    )}
                  </div>
                  <h4 className={`text-sm font-semibold mb-1 ${
                    isActive ? 'text-brand-400' : isCompleted ? 'text-text-primary' : 'text-text-muted'
                  }`}>
                    {step.name}
                  </h4>
                  <p className={`text-xs leading-tight ${
                    isActive ? 'text-text-secondary' : 'text-text-muted'
                  }`}>
                    {step.description}
                  </p>
                </button>
                
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 min-w-[40px] ${
                    currentStep > step.number ? 'bg-brand-600' : 'bg-surface-tertiary'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Overall progress */}
        <div className="mt-6 w-full h-2 bg-surface-tertiary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Utility hook for step-specific styling
export function useStepStatus(stepNumber: number) {
  const { currentStep } = useBookingFlowStore();
  
  return {
    isActive: currentStep === stepNumber,
    isCompleted: currentStep > stepNumber,
    isPending: currentStep < stepNumber,
    canAccess: currentStep >= stepNumber,
  };
}