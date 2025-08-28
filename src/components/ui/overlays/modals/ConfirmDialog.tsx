'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  isLoading?: boolean
  children?: React.ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{cancelLabel}</Button>
          <Button onClick={onConfirm} disabled={isLoading}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export interface DestructiveDialogProps extends Omit<ConfirmDialogProps, 'confirmLabel'> {
  confirmLabel?: string
}

export function DestructiveDialog({ confirmLabel = 'Delete', ...rest }: DestructiveDialogProps) {
  return (
    <Dialog open={rest.open} onOpenChange={rest.onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{rest.title}</DialogTitle>
          {rest.description && <DialogDescription>{rest.description}</DialogDescription>}
        </DialogHeader>
        {rest.children}
        <DialogFooter>
          <Button variant="outline" onClick={() => rest.onOpenChange(false)} disabled={rest.isLoading}>{rest.cancelLabel || 'Cancel'}</Button>
          <Button variant="destructive" onClick={rest.onConfirm} disabled={rest.isLoading}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


