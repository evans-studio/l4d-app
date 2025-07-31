'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '../composites/Modal'
import { Button } from '../primitives/Button'

// Overlay types
export type OverlayType = 
  | 'booking-details'
  | 'vehicle-edit'
  | 'address-edit'
  | 'service-edit'
  | 'customer-profile'
  | 'reschedule'
  | 'cancel-booking'

// Overlay data interface
export interface OverlayData {
  type: OverlayType
  data?: any
  onClose?: () => void
  onSave?: (data: any) => void
}

// Context interface
interface OverlayContextType {
  activeOverlay: OverlayData | null
  openOverlay: (type: OverlayType, data?: any, options?: { onClose?: () => void; onSave?: (data: any) => void }) => void
  closeOverlay: () => void
}

// Create context
const OverlayContext = createContext<OverlayContextType | null>(null)

// Hook to use overlay manager
export const useOverlay = () => {
  const context = useContext(OverlayContext)
  if (!context) {
    throw new Error('useOverlay must be used within an OverlayProvider')
  }
  return context
}

// Placeholder overlay content components
const BookingDetailsOverlay: React.FC<{ data: any; onClose: () => void }> = ({ data, onClose }) => (
  <ModalContent size="lg" onClose={onClose}>
    <ModalHeader title="Booking Details" />
    <ModalBody>
      <div className="space-y-4">
        <p className="text-text-secondary">Booking ID: {data?.bookingId || 'N/A'}</p>
        <div className="bg-surface-secondary p-4 rounded-lg">
          <p className="text-sm text-text-muted">Booking details will be loaded here...</p>
        </div>
      </div>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline" onClick={onClose}>Close</Button>
    </ModalFooter>
  </ModalContent>
)

const VehicleEditOverlay: React.FC<{ data: any; onClose: () => void; onSave?: (data: any) => void }> = ({ data, onClose, onSave }) => (
  <ModalContent size="md" onClose={onClose}>
    <ModalHeader title="Edit Vehicle" />
    <ModalBody>
      <div className="space-y-4">
        <div className="bg-surface-secondary p-4 rounded-lg">
          <p className="text-sm text-text-muted">Vehicle edit form will be loaded here...</p>
          <p className="text-xs text-text-muted mt-2">Vehicle ID: {data?.vehicleId || 'N/A'}</p>
        </div>
      </div>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={() => onSave?.(data)}>Save Changes</Button>
    </ModalFooter>
  </ModalContent>
)

const AddressEditOverlay: React.FC<{ data: any; onClose: () => void; onSave?: (data: any) => void }> = ({ data, onClose, onSave }) => (
  <ModalContent size="md" onClose={onClose}>
    <ModalHeader title="Edit Address" />
    <ModalBody>
      <div className="space-y-4">
        <div className="bg-surface-secondary p-4 rounded-lg">
          <p className="text-sm text-text-muted">Address edit form will be loaded here...</p>
          <p className="text-xs text-text-muted mt-2">Address ID: {data?.addressId || 'N/A'}</p>
        </div>
      </div>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={() => onSave?.(data)}>Save Changes</Button>
    </ModalFooter>
  </ModalContent>
)

const ServiceEditOverlay: React.FC<{ data: any; onClose: () => void; onSave?: (data: any) => void }> = ({ data, onClose, onSave }) => (
  <ModalContent size="lg" onClose={onClose}>
    <ModalHeader title="Edit Service" />
    <ModalBody>
      <div className="space-y-4">
        <div className="bg-surface-secondary p-4 rounded-lg">
          <p className="text-sm text-text-muted">Service edit form will be loaded here...</p>
          <p className="text-xs text-text-muted mt-2">Service ID: {data?.serviceId || 'N/A'}</p>
        </div>
      </div>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={() => onSave?.(data)}>Save Changes</Button>
    </ModalFooter>
  </ModalContent>
)

const CustomerProfileOverlay: React.FC<{ data: any; onClose: () => void }> = ({ data, onClose }) => (
  <ModalContent size="lg" onClose={onClose} mobile="drawer">
    <ModalHeader title="Customer Profile" />
    <ModalBody scrollable maxHeight="70vh">
      <div className="space-y-4">
        <div className="bg-surface-secondary p-4 rounded-lg">
          <p className="text-sm text-text-muted">Customer profile details will be loaded here...</p>
          <p className="text-xs text-text-muted mt-2">Customer ID: {data?.customerId || 'N/A'}</p>
        </div>
      </div>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline" onClick={onClose}>Close</Button>
    </ModalFooter>
  </ModalContent>
)

const RescheduleOverlay: React.FC<{ data: any; onClose: () => void; onSave?: (data: any) => void }> = ({ data, onClose, onSave }) => (
  <ModalContent size="lg" onClose={onClose}>
    <ModalHeader title="Reschedule Booking" />
    <ModalBody>
      <div className="space-y-4">
        <div className="bg-surface-secondary p-4 rounded-lg">
          <p className="text-sm text-text-muted">Reschedule form will be loaded here...</p>
          <p className="text-xs text-text-muted mt-2">Booking ID: {data?.bookingId || 'N/A'}</p>
        </div>
      </div>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={() => onSave?.(data)}>Reschedule</Button>
    </ModalFooter>
  </ModalContent>
)

const CancelBookingOverlay: React.FC<{ data: any; onClose: () => void; onSave?: (data: any) => void }> = ({ data, onClose, onSave }) => (
  <ModalContent size="md" onClose={onClose}>
    <ModalHeader title="Cancel Booking" />
    <ModalBody>
      <div className="space-y-4">
        <p className="text-text-secondary">Are you sure you want to cancel this booking?</p>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-sm text-red-800">This action cannot be undone.</p>
          <p className="text-xs text-red-600 mt-2">Booking ID: {data?.bookingId || 'N/A'}</p>
        </div>
      </div>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline" onClick={onClose}>Keep Booking</Button>
      <Button variant="destructive" onClick={() => onSave?.(data)}>Cancel Booking</Button>
    </ModalFooter>
  </ModalContent>
)

// Overlay content renderer
const OverlayContent: React.FC<{ overlay: OverlayData }> = ({ overlay }) => {
  const { closeOverlay } = useOverlay()
  
  const handleClose = () => {
    overlay.onClose?.()
    closeOverlay()
  }
  
  const handleSave = (data: any) => {
    overlay.onSave?.(data)
    closeOverlay()
  }
  
  switch (overlay.type) {
    case 'booking-details':
      return <BookingDetailsOverlay data={overlay.data} onClose={handleClose} />
    case 'vehicle-edit':
      return <VehicleEditOverlay data={overlay.data} onClose={handleClose} onSave={handleSave} />
    case 'address-edit':
      return <AddressEditOverlay data={overlay.data} onClose={handleClose} onSave={handleSave} />
    case 'service-edit':
      return <ServiceEditOverlay data={overlay.data} onClose={handleClose} onSave={handleSave} />
    case 'customer-profile':
      return <CustomerProfileOverlay data={overlay.data} onClose={handleClose} />
    case 'reschedule':
      return <RescheduleOverlay data={overlay.data} onClose={handleClose} onSave={handleSave} />
    case 'cancel-booking':
      return <CancelBookingOverlay data={overlay.data} onClose={handleClose} onSave={handleSave} />
    default:
      return null
  }
}

// Provider component
export const OverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeOverlay, setActiveOverlay] = useState<OverlayData | null>(null)
  
  const openOverlay = useCallback((
    type: OverlayType, 
    data?: any, 
    options?: { onClose?: () => void; onSave?: (data: any) => void }
  ) => {
    setActiveOverlay({
      type,
      data,
      onClose: options?.onClose,
      onSave: options?.onSave,
    })
  }, [])
  
  const closeOverlay = useCallback(() => {
    setActiveOverlay(null)
  }, [])
  
  const contextValue = {
    activeOverlay,
    openOverlay,
    closeOverlay,
  }
  
  return (
    <OverlayContext.Provider value={contextValue}>
      {children}
      
      {/* Render active overlay */}
      {activeOverlay && (
        <Modal open={true} onClose={closeOverlay}>
          <OverlayContent overlay={activeOverlay} />
        </Modal>
      )}
    </OverlayContext.Provider>
  )
}

// Utility function for easy overlay usage
export const openOverlayFromComponent = (
  openOverlay: (type: OverlayType, data?: any, options?: any) => void,
  type: OverlayType,
  data?: any
) => {
  openOverlay(type, data, {
    onClose: () => console.log(`${type} overlay closed`),
    onSave: (data: any) => console.log(`${type} overlay saved:`, data),
  })
}