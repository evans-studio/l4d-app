export interface OverlayConfig {
  type: OverlayType
  data?: any
  onClose?: () => void
  onConfirm?: (result?: any) => void | Promise<void>
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
}

export type OverlayType = 
  // Booking overlays
  | 'booking-view'
  | 'booking-reschedule'
  | 'booking-cancel'
  | 'booking-confirm'
  | 'booking-decline'
  
  // Vehicle overlays
  | 'vehicle-edit'
  | 'vehicle-delete'
  | 'vehicle-create'
  
  // Address overlays
  | 'address-edit'
  | 'address-delete'
  | 'address-create'
  
  // Profile overlays
  | 'profile-edit'
  
  // Admin overlays
  | 'customer-view'
  | 'service-edit'
  | 'service-create'
  | 'time-slot-edit'
  | 'time-slot-block'
  | 'reschedule-approve'
  | 'reschedule-decline'
  
  // Generic overlays
  | 'confirm-delete'
  | 'image-viewer'

export interface OverlayContextValue {
  activeOverlays: OverlayConfig[]
  openOverlay: (config: OverlayConfig) => void
  closeOverlay: (type?: OverlayType) => void
  closeAllOverlays: () => void
}

export interface BaseOverlayProps {
  isOpen: boolean
  onClose: () => void
  data?: any
  onConfirm?: (result?: any) => void | Promise<void>
}