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
    description: 'Your information' 
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
  const { currentStep } = useBookingFlowStore();

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
        
        {/* Progress bar */}
        <div className="mt-2 w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-600 transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
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
              const IconComponent = step.icon;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-all
                      ${isCompleted 
                        ? 'bg-brand-600 text-white' 
                        : isActive 
                          ? 'bg-brand-600 text-white shadow-purple-lg' 
                          : 'bg-surface-tertiary text-text-muted'
                      }
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
                  </div>
                  
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
            const IconComponent = step.icon;
            
            return (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center text-center max-w-[120px]">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all
                    ${isCompleted 
                      ? 'bg-brand-600 text-white shadow-purple' 
                      : isActive 
                        ? 'bg-brand-600 text-white shadow-purple-lg animate-purple-pulse' 
                        : 'bg-surface-tertiary text-text-muted'
                    }
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
                </div>
                
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
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500 ease-out shadow-purple"
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