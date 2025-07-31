'use client'

import React from 'react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'

export const CustomerDetailsModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Details"
      size="lg"
    >
      <div className="py-8 text-center text-text-secondary">
        <p>Customer details modal - coming soon</p>
        <p className="text-sm mt-2">Customer ID: {data?.customerId}</p>
      </div>
    </BaseModal>
  )
}