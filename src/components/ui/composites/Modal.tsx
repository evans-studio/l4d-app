import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from '../primitives/Button'
import { IconButton } from '../primitives/Icon'

const modalVariants = cva(
  'fixed inset-0 z-[var(--z-modal)] overflow-y-auto',
  {
    variants: {
      open: {
        true: 'block',
        false: 'hidden',
      },
    },
    defaultVariants: {
      open: false,
    },
  }
)

const overlayVariants = cva(
  'fixed inset-0 bg-black/50 transition-opacity duration-300',
  {
    variants: {
      open: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
    },
    defaultVariants: {
      open: false,
    },
  }
)

const contentVariants = cva(
  'relative bg-[var(--surface-primary)] shadow-xl transition-all duration-300 focus:outline-none max-w-full',
  {
    variants: {
      size: {
        xs: 'sm:max-w-xs',
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
        full: 'sm:max-w-full',
      },
      variant: {
        default: 'rounded-lg',
        drawer: 'rounded-t-lg sm:rounded-lg',
        fullscreen: 'rounded-none',
      },
      position: {
        center: 'mx-auto my-8',
        top: 'mx-auto mt-8 mb-auto',
        bottom: 'mx-auto mt-auto mb-8',
      },
      mobile: {
        fullscreen: 'sm:mx-auto sm:my-8 sm:rounded-lg',
        drawer: 'mx-0 mt-auto mb-0 rounded-t-lg sm:mx-auto sm:my-8 sm:rounded-lg',
        standard: 'mx-4 my-8',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      position: 'center',
      mobile: 'standard',
    },
    compoundVariants: [
      // Mobile fullscreen overrides
      {
        mobile: 'fullscreen',
        class: 'h-full w-full sm:h-auto',
      },
      // Mobile drawer overrides
      {
        mobile: 'drawer',
        class: 'w-full max-h-[90vh] sm:max-h-none',
      },
    ],
  }
)

// Modal Root Component
export interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  preventScroll?: boolean
  className?: string
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventScroll = true,
  className,
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false)
  
  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose, closeOnEscape])
  
  // Handle body scroll lock
  React.useEffect(() => {
    if (!preventScroll) return
    
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, preventScroll])
  
  // Animation handling
  React.useEffect(() => {
    if (open) {
      setIsAnimating(true)
      return
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }
  
  if (!open && !isAnimating) return null
  
  return (
    <div className={cn(modalVariants({ open }), className)} role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className={overlayVariants({ open })}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      {/* Content Container */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {children}
      </div>
    </div>
  )
}

// Modal Content Component
export interface ModalContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof contentVariants> {
  onClose?: () => void
  showCloseButton?: boolean
}

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ 
    className, 
    size, 
    variant, 
    position, 
    mobile,
    onClose,
    showCloseButton = true,
    children, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(contentVariants({ size, variant, position, mobile, className }))}
        role="document"
        {...props}
      >
        {/* Close Button */}
        {showCloseButton && onClose && (
          <div className="absolute top-4 right-4 z-10">
            <IconButton
              icon={X}
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close modal"
              className="bg-[var(--surface-secondary)]/80 backdrop-blur-sm hover:bg-[var(--surface-secondary)]"
            />
          </div>
        )}
        
        {children}
      </div>
    )
  }
)
ModalContent.displayName = 'ModalContent'

// Modal Header Component
export interface ModalHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  border?: boolean
}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, title, subtitle, border = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4',
        border && 'border-b border-[var(--border-secondary)]',
        className
      )}
      {...props}
    >
      {(title || subtitle) && (
        <div className="text-left">
          {title && (
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
)
ModalHeader.displayName = 'ModalHeader'

// Modal Body Component
export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  scrollable?: boolean
  maxHeight?: string
}

const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, scrollable = false, maxHeight, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4',
        scrollable && 'overflow-y-auto',
        className
      )}
      style={maxHeight ? { maxHeight } : undefined}
      {...props}
    >
      {children}
    </div>
  )
)
ModalBody.displayName = 'ModalBody'

// Modal Footer Component
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  border?: boolean
  justify?: 'start' | 'center' | 'end' | 'between'
  direction?: 'row' | 'column'
}

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, border = true, justify = 'end', direction = 'row', children, ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    }[justify]
    
    const directionClasses = {
      row: 'flex-row gap-2',
      column: 'flex-col gap-2',
    }[direction]
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex px-6 py-4',
          border && 'border-t border-[var(--border-secondary)]',
          justifyClasses,
          directionClasses,
          // Responsive: stack on mobile, inline on desktop
          direction === 'row' && 'flex-col sm:flex-row gap-2 sm:gap-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ModalFooter.displayName = 'ModalFooter'

// Modal Hook
export interface UseModalReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useModal = (initialOpen = false): UseModalReturn => {
  const [isOpen, setIsOpen] = React.useState(initialOpen)
  
  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), [])
  
  return { isOpen, open, close, toggle }
}

// Confirmation Modal Component
export interface ConfirmationModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent size="sm" onClose={onClose}>
        <ModalHeader title={title} />
        <ModalBody>
          <p className="text-[var(--text-secondary)]">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  modalVariants,
  overlayVariants,
  contentVariants,
}