'use client'

import React from 'react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'

export const VehicleEditModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Vehicle"
      size="md"
    >
      <div className="py-8 text-center text-text-secondary">
        <p>Vehicle edit modal - coming soon</p>
        <p className="text-sm mt-2">Vehicle ID: {data?.vehicleId}</p>
      </div>
    </BaseModal>
  )
}

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