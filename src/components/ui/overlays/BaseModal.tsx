'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/primitives/Button'
import { cn } from '@/lib/utils'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}

// Mobile-responsive size classes that respect PWA bottom nav
const mobileSizeClasses = {
  sm: 'sm:max-w-md max-w-[calc(100vw-2rem)]',
  md: 'sm:max-w-lg max-w-[calc(100vw-2rem)]',
  lg: 'sm:max-w-2xl max-w-[calc(100vw-2rem)]',
  xl: 'sm:max-w-4xl max-w-[calc(100vw-2rem)]'
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
  className
}) => {
  // Handle ESC key press and viewport height
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closable) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      // Set viewport height for mobile Safari
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      document.documentElement.style.removeProperty('--vh')
    }
  }, [isOpen, onClose, closable])

  if (!isOpen) return null

  // Simple focus trap
  const containerRef = React.useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isOpen) return
    const container = containerRef.current
    if (!container) return

    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (focusable.length === 0) return
      if (document.activeElement === last && !e.shiftKey) {
        e.preventDefault()
        first?.focus()
      } else if (document.activeElement === first && e.shiftKey) {
        e.preventDefault()
        last?.focus()
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-20 sm:pb-4" data-ui={isNewUIEnabled() ? 'new' : 'old'} role="dialog" aria-modal="true" aria-label={title || 'Modal dialog'}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={closable ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div ref={containerRef} className={cn(
        "relative w-full bg-surface-primary border border-border-secondary rounded-lg shadow-xl transform transition-all duration-300 ease-out",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
        "max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-8rem)] overflow-y-auto",
        mobileSizeClasses[size],
        className
      )}>
        {/* Header - Mobile optimized with larger touch targets */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-secondary sticky top-0 bg-surface-primary z-10">
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary pr-4">
                {title}
              </h2>
            )}
            {closable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] hover:bg-surface-hover flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
        
        {/* Content - Mobile optimized spacing */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}