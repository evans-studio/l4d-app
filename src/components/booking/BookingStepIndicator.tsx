import React from 'react';
import { CheckIcon } from 'lucide-react';

interface Step {
  label: string;
  description: string;
}

interface BookingStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Step[];
}

export function BookingStepIndicator({ currentStep, totalSteps, steps }: BookingStepIndicatorProps): React.JSX.Element {
  return (
    <div className="w-full">
      {/* Mobile Compact View */}
      <div className="sm:hidden">
        {/* Progress Bar - Prominent on Mobile */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-text-muted mb-2">
            <span className="font-medium text-text-primary">
              Step {currentStep}: {steps[currentStep - 1]?.label}
            </span>
            <span className="text-brand-400 font-medium">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-surface-tertiary rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-brand-500 to-brand-600 h-3 rounded-full transition-all duration-500 shadow-purple"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Mobile Step Dots */}
        <div className="flex items-center justify-center space-x-2">
          {steps.map((_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div
                key={stepNumber}
                className={`
                  w-3 h-3 rounded-full transition-all duration-200
                  ${isCompleted 
                    ? 'bg-brand-600' 
                    : isCurrent 
                      ? 'bg-brand-600 ring-2 ring-brand-400'
                      : 'bg-border-secondary'
                  }
                `}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop Full View */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div key={stepNumber} className="flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 transition-all duration-200
                      ${isCompleted 
                        ? 'bg-brand-600 border-brand-600 text-white' 
                        : isCurrent 
                          ? 'bg-brand-600 border-brand-600 text-white ring-2 ring-brand-400'
                          : 'bg-surface-tertiary border-border-secondary text-text-muted'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                    ) : (
                      <span className="text-xs lg:text-sm font-medium">{stepNumber}</span>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className="mt-2 text-center max-w-[80px] lg:max-w-none">
                    <div 
                      className={`text-xs lg:text-sm font-medium ${
                        isCurrent 
                          ? 'text-brand-400' 
                          : isCompleted 
                            ? 'text-brand-300'
                            : 'text-text-muted'
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-xs text-text-muted mt-1 hidden lg:block">
                      {step.description}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div 
                    className={`
                      flex-1 h-0.5 mx-2 lg:mx-4 transition-all duration-200
                      ${stepNumber < currentStep 
                        ? 'bg-brand-600' 
                        : 'bg-border-secondary'
                      }
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Progress Bar */}
        <div className="mt-4 lg:mt-6">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Step {currentStep} of {totalSteps}</span>
            <span className="text-brand-400 font-medium">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-surface-tertiary rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-500 shadow-purple"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}