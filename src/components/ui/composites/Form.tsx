'use client';

import React, { createContext, useContext } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, Check } from 'lucide-react';

const formVariants = cva(
  'space-y-6',
  {
    variants: {
      variant: {
        default: '',
        card: 'p-6 bg-gray-800 border border-gray-700 rounded-lg',
        modal: 'p-4 bg-gray-900 rounded-lg'
      },
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'w-full'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

const fieldGroupVariants = cva(
  'space-y-2',
  {
    variants: {
      orientation: {
        vertical: 'flex flex-col',
        horizontal: 'flex flex-col sm:flex-row sm:items-center sm:gap-4'
      }
    },
    defaultVariants: {
      orientation: 'vertical'
    }
  }
);

interface FormContextType {
  errors?: Record<string, string>;
  loading?: boolean;
  disabled?: boolean;
}

const FormContext = createContext<FormContextType>({});

export const useFormContext = () => useContext(FormContext);

interface FormProps extends VariantProps<typeof formVariants> {
  children: React.ReactNode;
  className?: string;
  errors?: Record<string, string>;
  loading?: boolean;
  disabled?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
}

export const Form: React.FC<FormProps> = ({
  children,
  className,
  variant,
  size,
  errors = {},
  loading = false,
  disabled = false,
  onSubmit,
  ...props
}) => {
  return (
    <FormContext.Provider value={{ errors, loading, disabled }}>
      <form
        className={cn(formVariants({ variant, size }), className)}
        onSubmit={onSubmit}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
};

interface FieldGroupProps extends VariantProps<typeof fieldGroupVariants> {
  children: React.ReactNode;
  className?: string;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
  children,
  className,
  orientation,
  ...props
}) => {
  return (
    <div
      className={cn(fieldGroupVariants({ orientation }), className)}
      {...props}
    >
      {children}
    </div>
  );
};

interface FieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  hideError?: boolean;
}

export const Field: React.FC<FieldProps> = ({
  name,
  label,
  description,
  required,
  children,
  className,
  hideError = false
}) => {
  const { errors } = useFormContext();
  const error = errors?.[name];
  const hasError = !!error;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-200"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      {description && (
        <p className="text-xs text-gray-400 leading-relaxed">
          {description}
        </p>
      )}
      
      <div className="relative">
        {children}
      </div>
      
      {!hideError && hasError && (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  alignment?: 'left' | 'center' | 'right' | 'between';
  orientation?: 'horizontal' | 'vertical';
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  className,
  alignment = 'right',
  orientation = 'horizontal'
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  const orientationClasses = {
    horizontal: 'flex flex-col sm:flex-row gap-3',
    vertical: 'flex flex-col gap-3'
  };

  return (
    <div
      className={cn(
        'pt-4 border-t border-gray-700',
        orientationClasses[orientation],
        alignmentClasses[alignment],
        className
      )}
    >
      {children}
    </div>
  );
};

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div
          className={cn(
            'pb-2 border-b border-gray-700',
            collapsible && 'cursor-pointer select-none'
          )}
          onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        >
          {title && (
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              {title}
              {collapsible && (
                <span className="text-gray-400">
                  {collapsed ? '+' : '-'}
                </span>
              )}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      
      {(!collapsible || !collapsed) && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

interface FormStepperProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    completed?: boolean;
    current?: boolean;
  }>;
  currentStep: number;
  className?: string;
}

export const FormStepper: React.FC<FormStepperProps> = ({
  steps,
  currentStep,
  className
}) => {
  return (
    <div className={cn('mb-8', className)}>
      {/* Desktop Stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  {
                    'bg-green-600 text-white': step.completed,
                    'bg-blue-600 text-white': step.current,
                    'bg-gray-600 text-gray-300': !step.completed && !step.current
                  }
                )}
              >
                {step.completed ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="ml-3">
                <p className={cn(
                  'text-sm font-medium',
                  step.current ? 'text-blue-400' : 'text-gray-400'
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div className={cn(
                  'h-px',
                  index < currentStep ? 'bg-green-600' : 'bg-gray-600'
                )} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile Stepper */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </span>
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full',
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-600'
                )}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-100">
            {steps[currentStep]?.title}
          </h3>
          {steps[currentStep]?.description && (
            <p className="text-sm text-gray-400 mt-1">
              {steps[currentStep]?.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const FormDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const steps = [
    { id: 'personal', title: 'Personal Info', description: 'Your basic information' },
    { id: 'service', title: 'Service Details', description: 'What you need' },
    { id: 'confirmation', title: 'Confirmation', description: 'Review and submit' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo handler; integrate with form submission logic as needed
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-100">Form Components</h3>
      
      <Form
        variant="card"
        size="lg"
        errors={errors}
        onSubmit={handleSubmit}
      >
        <FormStepper 
          steps={steps} 
          currentStep={currentStep}
        />

        <FormSection
          title="Contact Information"
          description="We'll use this to get in touch with you"
        >
          <FieldGroup orientation="vertical">
            <Field name="name" label="Full Name" required>
              <input
                type="text"
                id="name"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Field>
            
            <Field name="email" label="Email Address" required>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Field>
          </FieldGroup>
        </FormSection>

        <FormSection
          title="Service Request"
          description="Tell us what you need"
        >
          <Field name="service" label="Service Type" required>
            <select
              id="service"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            >
              <option value="">Select a service</option>
              <option value="exterior">Exterior Detailing</option>
              <option value="interior">Interior Detailing</option>
              <option value="full">Full Service</option>
            </select>
          </Field>

          <Field name="message" label="Additional Details">
            <textarea
              id="message"
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              placeholder="Tell us more about your needs..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </Field>
        </FormSection>

        <FormActions alignment="between">
          <button
            type="button"
            className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          >
            Back
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-600 text-gray-100 rounded-lg hover:bg-gray-500 transition-colors"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Request
            </button>
          </div>
        </FormActions>
      </Form>
    </div>
  );
};