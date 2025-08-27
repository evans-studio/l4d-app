'use client'

import React, { useEffect, useState } from 'react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'

export const CustomerDetailsModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const dataObj: Record<string, unknown> = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const customerId: string | undefined = typeof dataObj.customerId === 'string' ? dataObj.customerId : undefined
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  type CustomerLite = { first_name?: string; last_name?: string; email?: string; phone?: string }
  type BookingLite = { id: string; booking_reference: string; status: string }
  type VehicleLite = { id: string; make?: string; model?: string; year?: number; license_plate?: string; color?: string }
  type AddressLite = { id: string; address_line_1: string; city: string; postal_code?: string }

  const [customer, setCustomer] = useState<CustomerLite | null>(null)
  const [bookings, setBookings] = useState<BookingLite[]>([])
  const [vehicles, setVehicles] = useState<VehicleLite[]>([])
  const [addresses, setAddresses] = useState<AddressLite[]>([])

  useEffect(() => {
    const load = async () => {
      if (!customerId) return
      try {
        setLoading(true)
        setError('')
        const [profileRes, bookingsRes] = await Promise.all([
          fetch(`/api/admin/customers/${customerId}`),
          fetch(`/api/customer/bookings?userId=${customerId}`)
        ])
        if (profileRes.ok) {
          const p = await profileRes.json()
          if (p.success) {
            setCustomer(p.data?.customer)
            setVehicles(p.data?.vehicles || [])
            setAddresses(p.data?.addresses || [])
          }
        }
        if (bookingsRes.ok) {
          const b = await bookingsRes.json()
          if (b.success) setBookings(b.data || [])
        }
      } catch (e) {
        setError('Failed to load customer')
      } finally {
        setLoading(false)
      }
    }
    if (isOpen) load()
  }, [isOpen, customerId])

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Details"
      size="lg"
    >
      {loading ? (
        <div className="py-12 text-center text-text-secondary">Loading...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-600">{error}</div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{customer?.first_name} {customer?.last_name}</h3>
            <p className="text-text-secondary text-sm">{customer?.email}{customer?.phone ? ` • ${customer.phone}` : ''}</p>
          </div>
          <div className="border-t border-border-secondary pt-4">
            <h4 className="text-sm font-medium text-text-secondary mb-2">Recent bookings</h4>
            {bookings.length === 0 ? (
              <p className="text-text-muted text-sm">No bookings</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {bookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm p-2 rounded border border-border-secondary">
                    <span className="font-medium text-text-primary">{b.booking_reference}</span>
                    <span className="text-text-secondary">{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border-secondary pt-4">
            <h4 className="text-sm font-medium text-text-secondary mb-2">Saved vehicles</h4>
            {vehicles.length === 0 ? (
              <p className="text-text-muted text-sm">No vehicles on file</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {vehicles.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm p-2 rounded border border-border-secondary">
                    <span className="font-medium text-text-primary">{v.make} {v.model}{v.year ? ` (${v.year})` : ''}</span>
                    <span className="text-text-secondary">{v.license_plate || v.color || ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border-secondary pt-4">
            <h4 className="text-sm font-medium text-text-secondary mb-2">Saved addresses</h4>
            {addresses.length === 0 ? (
              <p className="text-text-muted text-sm">No addresses on file</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {addresses.map((a) => (
                  <div key={a.id} className="text-sm p-2 rounded border border-border-secondary">
                    <div className="text-text-primary font-medium">{a.address_line_1}</div>
                    <div className="text-text-secondary">{a.city}{a.postal_code ? `, ${a.postal_code}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </BaseModal>
  )
}