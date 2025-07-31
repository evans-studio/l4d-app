'use client'

import React from 'react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'

export const VehicleCreateModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Vehicle"
      size="md"
    >
      <div className="py-8 text-center text-text-secondary">
        <p>Vehicle create modal - coming soon</p>
      </div>
    </BaseModal>
  )
}