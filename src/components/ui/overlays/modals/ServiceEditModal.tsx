'use client'

import React from 'react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'

export const ServiceEditModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Service"
      size="lg"
    >
      <div className="py-8 text-center text-text-secondary">
        <p>Service edit modal - coming soon</p>
        <p className="text-sm mt-2">Service ID: {data?.serviceId}</p>
      </div>
    </BaseModal>
  )
}