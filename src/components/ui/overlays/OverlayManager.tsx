'use client'

import React from 'react'
import { useOverlay } from '@/lib/overlay/context'
import { OverlayType, BaseOverlayProps } from '@/lib/overlay/types'

// Import all overlay components
import { BookingDetailsModal } from './modals/BookingDetailsModal'
import { RescheduleModal } from './modals/RescheduleModal'
import { CancelModal } from './modals/CancelModal'
import { ConfirmBookingModal } from './modals/ConfirmBookingModal'
import { DeclineBookingModal } from './modals/DeclineBookingModal'
import { VehicleEditModal } from './modals/VehicleEditModal'
import { VehicleCreateModal } from './modals/VehicleCreateModal'
import { AddressEditModal } from './modals/AddressEditModal'
import { AddressCreateModal } from './modals/AddressCreateModal'
import { ProfileEditModal } from './modals/ProfileEditModal'
import { CustomerDetailsModal } from './modals/CustomerDetailsModal'
import { ServiceEditModal } from './modals/ServiceEditModal'
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal'

// Registry of all overlay components
const overlayComponents: Record<OverlayType, React.ComponentType<any>> = {
  // Booking overlays
  'booking-view': BookingDetailsModal,
  'booking-reschedule': RescheduleModal,
  'booking-cancel': CancelModal,
  'booking-confirm': ConfirmBookingModal,
  'booking-decline': DeclineBookingModal,
  
  // Vehicle overlays
  'vehicle-edit': VehicleEditModal,
  'vehicle-delete': ConfirmDeleteModal,
  'vehicle-create': VehicleCreateModal,
  
  // Address overlays
  'address-edit': AddressEditModal,
  'address-delete': ConfirmDeleteModal,
  'address-create': AddressCreateModal,
  
  // Profile overlays
  'profile-edit': ProfileEditModal,
  
  // Admin overlays
  'customer-view': CustomerDetailsModal,
  'service-edit': ServiceEditModal,
  'service-create': ServiceEditModal, // Reuse the same component
  'time-slot-edit': ServiceEditModal, // Placeholder for now
  'time-slot-block': ServiceEditModal, // Placeholder for now
  
  // Generic overlays
  'confirm-delete': ConfirmDeleteModal,
  'image-viewer': BookingDetailsModal, // Placeholder for now
}

export const OverlayManager: React.FC = () => {
  const { activeOverlays, closeOverlay } = useOverlay()

  return (
    <>
      {activeOverlays.map((overlay, index) => {
        const OverlayComponent = overlayComponents[overlay.type]
        
        if (!OverlayComponent) {
          console.warn(`No component found for overlay type: ${overlay.type}`)
          return null
        }

        const handleClose = () => {
          if (overlay.onClose) {
            overlay.onClose()
          }
          closeOverlay(overlay.type)
        }

        return (
          <OverlayComponent
            key={`${overlay.type}-${index}`}
            isOpen={true}
            onClose={handleClose}
            data={overlay.data}
            onConfirm={overlay.onConfirm}
          />
        )
      })}
    </>
  )
}