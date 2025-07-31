'use client'

import React from 'react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'

export const AddressCreateModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Address"
      size="md"
    >
      <div className="py-8 text-center text-text-secondary">
        <p>Address create modal - coming soon</p>
      </div>
    </BaseModal>
  )
}