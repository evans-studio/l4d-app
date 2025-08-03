'use client'

import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/composites/Modal'
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
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent size="sm" mobile="drawer" onClose={onClose}>
        <ModalHeader title={title} />
        
        <ModalBody>
          <div className="space-y-6 text-center">
            {/* Warning Icon */}
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Message */}
            <p className="text-text-primary">{message}</p>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            fullWidth
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            loading={isDeleting}
            loadingText="Deleting..."
            fullWidth
            className="sm:w-auto"
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}