'use client'

import React from 'react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'

export const ServiceEditModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const dataObj: Record<string, unknown> = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Service"
      size="lg"
    >
      <div className="py-8 text-center text-text-secondary">
        <p>Service edit modal - coming soon</p>
        {Boolean(dataObj.serviceId) && (
          <p className="text-sm mt-2">Service ID: {String(dataObj.serviceId)}</p>
        )}
      </div>
    </BaseModal>
  )
}