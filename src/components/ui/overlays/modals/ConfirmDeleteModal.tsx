'use client'

import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'

interface ConfirmDeleteModalProps extends BaseOverlayProps {
  data: {
    title?: string
    message?: string
    confirmText?: string
    itemName?: string
  }
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  data,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const title = data?.title || 'Confirm Deletion'
  const message = data?.message || `Are you sure you want to delete this ${data?.itemName || 'item'}? This action cannot be undone.`
  const confirmText = data?.confirmText || 'Delete'

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsDeleting(true)
      try {
        await onConfirm()
        onClose()
      } catch (error) {
        console.error('Delete error:', error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-text-primary">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            className="flex-1"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : confirmText}
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}