'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

export interface DialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, className }) => {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className={cn('fixed inset-0 z-[60] flex items-center justify-center p-4', className)} data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      <button className="absolute inset-0 bg-black/50" aria-label="Close overlay" onClick={() => onOpenChange?.(false)} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border-secondary bg-surface-primary shadow-xl">
        {children}
      </div>
    </div>
  )
}

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('px-4 py-3 border-b border-border-secondary', className)} {...props} />
)

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn('text-lg font-semibold text-text-primary', className)} {...props} />
)

export const DialogBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-4', className)} {...props} />
)

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('px-4 py-3 border-t border-border-secondary flex items-center justify-end gap-2', className)} {...props} />
)

export default Dialog
