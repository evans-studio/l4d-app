'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/primitives/Button'
import { cn } from '@/lib/utils'

interface BaseSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  side?: 'right' | 'left' | 'bottom'
  size?: 'sm' | 'md' | 'lg'
  closable?: boolean
  className?: string
}

const sideClasses = {
  right: 'right-0 top-0 h-full w-full max-w-md border-l',
  left: 'left-0 top-0 h-full w-full max-w-md border-r',
  bottom: 'bottom-0 left-0 right-0 h-auto max-h-[90vh] border-t'
}

const sizeClasses = {
  sm: {
    right: 'max-w-sm',
    left: 'max-w-sm',
    bottom: 'max-h-[60vh]'
  },
  md: {
    right: 'max-w-md',
    left: 'max-w-md',
    bottom: 'max-h-[75vh]'
  },
  lg: {
    right: 'max-w-lg',
    left: 'max-w-lg',
    bottom: 'max-h-[90vh]'
  }
}

const animationClasses = {
  right: 'animate-in slide-in-from-right duration-300',
  left: 'animate-in slide-in-from-left duration-300',
  bottom: 'animate-in slide-in-from-bottom duration-300'
}

export const BaseSheet: React.FC<BaseSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
  size = 'md',
  closable = true,
  className
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closable) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, closable])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={closable ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div className={cn(
        "absolute bg-surface-primary border-border-secondary shadow-xl flex flex-col",
        sideClasses[side],
        sizeClasses[size][side],
        animationClasses[side],
        className
      )}>
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-4 border-b border-border-secondary flex-shrink-0">
            {title && (
              <h2 className="text-lg font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {closable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="min-h-[40px] min-w-[40px] hover:bg-surface-hover"
                aria-label="Close sheet"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}