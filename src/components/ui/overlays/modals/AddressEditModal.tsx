'use client'

import React from 'react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'

export const AddressEditModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Address"
      size="md"
    >
      <div className="py-8 text-center text-text-secondary">
        <p>Address edit modal - coming soon</p>
        <p className="text-sm mt-2">Address ID: {data?.addressId}</p>
      </div>
    </BaseModal>
  )
}