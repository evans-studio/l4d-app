'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const toastVariants = cva(
  'relative flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 max-w-sm sm:max-w-md',
  {
    variants: {
      variant: {
        default: 'bg-gray-800/90 border-gray-700 text-gray-100',
        success: 'bg-green-900/90 border-green-600 text-green-100',
        error: 'bg-red-900/90 border-red-600 text-red-100',
        warning: 'bg-yellow-900/90 border-yellow-600 text-yellow-100',
        info: 'bg-blue-900/90 border-blue-600 text-blue-100'
      },
      position: {
        'top-right': 'fixed top-4 right-4 z-50',
        'top-left': 'fixed top-4 left-4 z-50',
        'bottom-right': 'fixed bottom-4 right-4 z-50',
        'bottom-left': 'fixed bottom-4 left-4 z-50',
        'top-center': 'fixed top-4 left-1/2 -translate-x-1/2 z-50',
        'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50'
      }
    },
    defaultVariants: {
      variant: 'default',
      position: 'top-right'
    }
  }
);

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction =
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'CLEAR_TOASTS' };

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast]
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.id)
      };
    case 'CLEAR_TOASTS':
      return {
        ...state,
        toasts: []
      };
    default:
      return state;
  }
};

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    };

    dispatch({ type: 'ADD_TOAST', toast: newToast });

    if (newToast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', id });
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  const clearToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_TOASTS' });
  }, []);

  return (
    <ToastContext.Provider value={{
      toasts: state.toasts,
      toast,
      removeToast,
      clearToasts
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  const groupedToasts = toasts.reduce((acc, toast) => {
    const position = toast.position || 'top-right';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(toast);
    return acc;
  }, {} as Record<string, Toast[]>);

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div
          key={position}
          className={cn(
            'fixed z-50 flex flex-col gap-2',
            {
              'top-4 right-4': position === 'top-right',
              'top-4 left-4': position === 'top-left',
              'bottom-4 right-4': position === 'bottom-right',
              'bottom-4 left-4': position === 'bottom-left',
              'top-4 left-1/2 -translate-x-1/2': position === 'top-center',
              'bottom-4 left-1/2 -translate-x-1/2': position === 'bottom-center'
            }
          )}
        >
          {positionToasts.map((toast) => (
            <ToastComponent key={toast.id} toast={toast} />
          ))}
        </div>
      ))}
    </>
  );
};

interface ToastComponentProps {
  toast: Toast;
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast }) => {
  const { removeToast } = useToast();

  const getIcon = () => {
    switch (toast.variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 flex-shrink-0 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 flex-shrink-0 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 flex-shrink-0 text-gray-400" />;
    }
  };

  return (
    <div
      className={cn(toastVariants({ variant: toast.variant }))}
      role="alert"
      aria-live="polite"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm leading-tight">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-xs opacity-90 mt-1 leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1 rounded-md transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export interface ToastProps extends VariantProps<typeof toastVariants> {
  title: string;
  description?: string;
  duration?: number;
}

export const ToastDemo: React.FC = () => {
  const { toast } = useToast();

  const showToasts = () => {
    toast({
      title: 'Success!',
      description: 'Your booking has been confirmed.',
      variant: 'success'
    });

    setTimeout(() => {
      toast({
        title: 'Warning',
        description: 'Please check your payment method.',
        variant: 'warning',
        position: 'top-left'
      });
    }, 1000);

    setTimeout(() => {
      toast({
        title: 'Error occurred',
        description: 'Unable to process your request. Please try again.',
        variant: 'error',
        position: 'bottom-right'
      });
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-100">Toast Notifications</h3>
      <button
        onClick={showToasts}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Show Toast Examples
      </button>
    </div>
  );
};