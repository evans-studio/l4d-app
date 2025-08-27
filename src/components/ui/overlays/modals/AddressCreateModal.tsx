'use client'

import React from 'react'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { AddressEditModal } from './AddressEditModal'

export const AddressCreateModal: React.FC<BaseOverlayProps> = (props) => {
  // Reuse the AddressEditModal without an addressId to create a new address
  const base = props.data && typeof props.data === 'object' ? (props.data as Record<string, unknown>) : {}
  return <AddressEditModal {...props} data={{ ...base, addressId: undefined }} />
}