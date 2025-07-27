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
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                    ${isCompleted 
                      ? 'bg-brand-600 border-brand-600 text-white' 
                      : isCurrent 
                        ? 'bg-brand-600 border-brand-600 text-white ring-2 ring-brand-400'
                        : 'bg-surface-tertiary border-border-secondary text-text-muted'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{stepNumber}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <div className="mt-2 text-center">
                  <div 
                    className={`text-sm font-medium ${
                      isCurrent 
                        ? 'text-brand-400' 
                        : isCompleted 
                          ? 'text-brand-300'
                          : 'text-text-muted'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-text-muted mt-1 hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div 
                  className={`
                    flex-1 h-0.5 mx-4 transition-all duration-200
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

      {/* Progress Bar */}
      <div className="mt-6">
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
  );
}