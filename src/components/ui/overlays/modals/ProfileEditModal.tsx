'use client'

import React from 'react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'

export const ProfileEditModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      size="md"
    >
      <div className="py-8 text-center text-text-secondary">
        <p>Profile edit modal - coming soon</p>
      </div>
    </BaseModal>
  )
}