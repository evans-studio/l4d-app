'use client'

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from './Modal'
import { Button } from '../primitives/Button'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  confirmVariant?: 'primary' | 'danger'
  cancelText?: string
  isLoading?: boolean
  icon?: React.ReactNode
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  cancelText = 'Cancel',
  isLoading = false,
  icon
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  const defaultIcon = confirmVariant === 'danger' ? (
    <div className="w-12 h-12 rounded-full bg-error-600/10 flex items-center justify-center mx-auto mb-4">
      <AlertTriangle className="w-6 h-6 text-error-400" />
    </div>
  ) : (
    <div className="w-12 h-12 rounded-full bg-brand-600/10 flex items-center justify-center mx-auto mb-4">
      <AlertTriangle className="w-6 h-6 text-brand-400" />
    </div>
  )

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent size="sm" showCloseButton={false}>
        <ModalHeader className="text-center border-b-0 pb-2">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </ModalHeader>
        
        <ModalBody className="text-center pt-0">
          {icon || defaultIcon}
          
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {title}
          </h3>
          
          <p className="text-text-secondary text-sm leading-relaxed">
            {message}
          </p>
        </ModalBody>
        
        <ModalFooter className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:w-auto"
          >
            {cancelText}
          </Button>
          
          <Button
            variant={confirmVariant === 'danger' ? 'primary' : 'primary'}
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 sm:w-auto ${
              confirmVariant === 'danger' 
                ? 'bg-error-600 hover:bg-error-700 border-error-600 hover:border-error-700' 
                : ''
            }`}
            leftIcon={isLoading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : confirmVariant === 'danger' ? (
              <Trash2 className="w-4 h-4" />
            ) : undefined}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}