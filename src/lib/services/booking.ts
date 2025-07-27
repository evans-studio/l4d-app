import { BaseService, ServiceResponse } from './base'
import { PricingService } from './pricing'
import { 
  Booking, 
  BookingStatus, 
  CustomerAddress, 
  CustomerVehicle, 
  TimeSlot,
  BookingService as BookingServiceType,
  CreateBookingRequest,
  AvailableTimeSlot,
  BookingCalendarDay,
  PricingBreakdown
} from '@/lib/utils/booking-types'

export interface BookingFilters {
  status?: BookingStatus[]
  dateFrom?: string
  dateTo?: string
  userId?: string
  search?: string
}

export class BookingService extends BaseService {

  // Customer Address Management
  async getCustomerAddresses(userId: string): Promise<ServiceResponse<CustomerAddress[]>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      return supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
    }, 'Failed to fetch customer addresses')
  }

  async createCustomerAddress(userId: string, addressData: Omit<CustomerAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<CustomerAddress>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      // If this is set as default, unset others
      if (addressData.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
      }

      return supabase
        .from('customer_addresses')
        .insert({
          ...addressData,
          user_id: userId,
        })
        .select()
        .single()
    }, 'Failed to create customer address')
  }

  async updateCustomerAddress(userId: string, addressId: string, addressData: Partial<CustomerAddress>): Promise<ServiceResponse<CustomerAddress>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      // If this is set as default, unset others
      if (addressData.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
      }

      return supabase
        .from('customer_addresses')
        .update(addressData)
        .eq('id', addressId)
        .eq('user_id', userId)
        .select()
        .single()
    }, 'Failed to update customer address')
  }

  async deleteCustomerAddress(userId: string, addressId: string): Promise<ServiceResponse<void>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      const result = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId)
      return { data: undefined, error: result.error }
    }, 'Failed to delete customer address')
  }

  // Customer Vehicle Management
  async getCustomerVehicles(userId: string): Promise<ServiceResponse<CustomerVehicle[]>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      return supabase
        .from('customer_vehicles')
        .select(`
          *,
          vehicle_size:vehicle_sizes(*)
        `)
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
    }, 'Failed to fetch customer vehicles')
  }

  async createCustomerVehicle(userId: string, vehicleData: Omit<CustomerVehicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<CustomerVehicle>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      // If this is set as default, unset others
      if (vehicleData.is_default) {
        await supabase
          .from('customer_vehicles')
          .update({ is_default: false })
          .eq('user_id', userId)
      }

      return supabase
        .from('customer_vehicles')
        .insert({
          ...vehicleData,
          user_id: userId,
        })
        .select(`
          *,
          vehicle_size:vehicle_sizes(*)
        `)
        .single()
    }, 'Failed to create customer vehicle')
  }

  async updateCustomerVehicle(userId: string, vehicleId: string, vehicleData: Partial<CustomerVehicle>): Promise<ServiceResponse<CustomerVehicle>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      // If this is set as default, unset others
      if (vehicleData.is_default) {
        await supabase
          .from('customer_vehicles')
          .update({ is_default: false })
          .eq('user_id', userId)
      }

      return supabase
        .from('customer_vehicles')
        .update(vehicleData)
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .select(`
          *,
          vehicle_size:vehicle_sizes(*)
        `)
        .single()
    }, 'Failed to update customer vehicle')
  }

  async deleteCustomerVehicle(userId: string, vehicleId: string): Promise<ServiceResponse<void>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      const result = await supabase
        .from('customer_vehicles')
        .delete()
        .eq('id', vehicleId)
        .eq('user_id', userId)
      return { data: undefined, error: result.error }
    }, 'Failed to delete customer vehicle')
  }

  // Time Slot Management
  async getAvailableTimeSlots(): Promise<ServiceResponse<TimeSlot[]>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      return supabase
        .from('time_slots')
        .select('*')
        .eq('is_available', true)
        .order('slot_date')
        .order('start_time')
    }, 'Failed to fetch time slots')
  }

  async getAvailabilityForDateRange(startDate: string, endDate: string): Promise<ServiceResponse<BookingCalendarDay[]>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      // Get time slots
      const { data: timeSlots, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('is_active', true)
        .order('start_time')

      if (slotsError) return { data: null, error: slotsError }

      // Get existing bookings in date range
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('scheduled_date, scheduled_start_time, scheduled_end_time, status')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .in('status', ['confirmed', 'in_progress'])

      if (bookingsError) return { data: null, error: bookingsError }

      // Build calendar days
      const calendarDays: BookingCalendarDay[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]
        if (!dateStr) continue
        const dayOfWeek = date.getDay()
        
        // Get slots for this specific date
        const daySlots = timeSlots.filter(slot => slot.slot_date === dateStr)
        
        // Count bookings for this date
        const dayBookings = bookings.filter(booking => booking.scheduled_date === dateStr)
        
        const availableSlots = daySlots.map(slot => {
          // For simplified slots: if there's any booking for this exact slot, it's unavailable
          const slotBookings = dayBookings.filter(booking => 
            booking.scheduled_start_time === slot.start_time
          )

          return {
            id: slot.id as string,
            start_time: slot.start_time as string,
            end_time: slot.end_time as string,
            available: (slotBookings.length === 0 && slot.is_available) as boolean,
            booking_count: slotBookings.length,
          }
        })

        calendarDays.push({
          date: dateStr,
          day_of_week: dayOfWeek,
          available_slots: availableSlots,
          is_available: availableSlots.some(slot => slot.available),
        })
      }

      return { data: calendarDays, error: null }
    }, 'Failed to fetch availability')
  }

  // Booking Management
  async getBookings(filters: BookingFilters = {}): Promise<ServiceResponse<Booking[]>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      let query = supabase
        .from('bookings')
        .select(`
          *,
          booking_services(
            *,
            service:services(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (filters.status?.length) {
        query = query.in('status', filters.status)
      }

      if (filters.dateFrom) {
        query = query.gte('scheduled_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('scheduled_date', filters.dateTo)
      }

      if (filters.userId) {
        query = query.eq('customer_id', filters.userId)
      }

      if (filters.search) {
        query = query.or(`booking_reference.ilike.%${filters.search}%,special_instructions.ilike.%${filters.search}%`)
      }

      return query
    }, 'Failed to fetch bookings')
  }

  async getBookingById(bookingId: string): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      return supabase
        .from('bookings')
        .select(`
          *,
          booking_services(
            *,
            service:services(*)
          )
        `)
        .eq('id', bookingId)
        .single()
    }, 'Failed to fetch booking')
  }

  async createBooking(userId: string, bookingData: CreateBookingRequest): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      // Calculate pricing
      const pricingService = new PricingService()
      const pricingResult = await pricingService.calculateMultipleServices(
        bookingData.services,
        bookingData.vehicle.size_id,
        undefined, // Will calculate distance from postcode
        bookingData.address.postcode
      )

      if (!pricingResult.success || !pricingResult.data) {
        return { data: null, error: new Error('Failed to calculate pricing') }
      }

      const calculations = pricingResult.data
      const totalPrice = calculations.reduce((sum, calc) => sum + calc.totalPrice, 0)
      const totalDuration = calculations.reduce((sum, calc) => sum + (calc as any).estimatedDuration || 60, 0)
      const distanceSurcharge = calculations[0]?.distanceSurcharge || 0
      const distanceKm = calculations[0]?.distanceKm || 0

      // Get vehicle size info
      const { data: vehicleSize, error: sizeError } = await supabase
        .from('vehicle_sizes')
        .select('name, price_multiplier')
        .eq('id', bookingData.vehicle.size_id)
        .single()

      if (sizeError) return { data: null, error: sizeError }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          vehicle_size_id: bookingData.vehicle.size_id,
          vehicle_details: {
            ...bookingData.vehicle,
            size_name: vehicleSize.name,
            size_multiplier: vehicleSize.price_multiplier,
          },
          service_address: bookingData.address,
          distance_km: distanceKm,
          // Note: Using core booking properties that match the interface
          estimated_duration: totalDuration,
          subtotal: totalPrice - distanceSurcharge,
          distance_surcharge: distanceSurcharge,
          total_price: totalPrice,
          pricing_breakdown: {
            services: calculations.map(calc => ({
              service_id: calc.serviceId,
              service_name: calc.serviceName,
              base_price: calc.basePrice,
              vehicle_adjustment: calc.subtotal - calc.basePrice,
              final_price: calc.totalPrice - calc.distanceSurcharge,
            })),
            subtotal: totalPrice - distanceSurcharge,
            vehicle_multiplier: vehicleSize.price_multiplier,
            distance_surcharge: distanceSurcharge,
            total: totalPrice,
          },
          customer_notes: bookingData.customer_notes,
          status: 'pending',
        })
        .select()
        .single()

      if (bookingError) return { data: null, error: bookingError }

      // Create booking services
      const bookingServices = calculations.map(calc => ({
        booking_id: booking.id,
        service_id: calc.serviceId,
        service_details: {
          name: calc.serviceName,
          short_description: '', // Will be filled from service data
          base_price: calc.basePrice,
          estimated_duration: 60, // Default, will be updated
          category_name: '', // Will be filled from service data
        },
        price: calc.totalPrice - calc.distanceSurcharge,
        estimated_duration: 60, // Default duration
      }))

      const { error: servicesError } = await supabase
        .from('booking_services')
        .insert(bookingServices)

      if (servicesError) {
        // Cleanup: delete the booking if service insertion fails
        await supabase.from('bookings').delete().eq('id', booking.id)
        return { data: null, error: servicesError }
      }

      // Add status history
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: booking.id,
          to_status: 'pending',
          changed_by: userId,
          reason: 'Booking created',
        })

      return { data: booking, error: null }
    }, 'Failed to create booking')
  }

  async updateBookingStatus(
    bookingId: string, 
    status: BookingStatus, 
    changedBy: string,
    reason?: string,
    notes?: string
  ): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      // Get current booking
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single()

      if (fetchError) return { data: null, error: fetchError }

      const updateData: Record<string, unknown> = { status }
      
      // Set timestamps for status changes
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString()
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
        if (reason) {
          updateData.cancellation_reason = reason
        }
      }

      // Update booking
      const { data: booking, error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single()

      if (updateError) return { data: null, error: updateError }

      // Add status history
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: bookingId,
          from_status: currentBooking.status,
          to_status: status,
          changed_by: changedBy,
          reason,
          notes,
        })

      return { data: booking, error: null }
    }, 'Failed to update booking status')
  }

  async confirmBooking(
    bookingId: string,
    confirmedDate: string,
    confirmedTimeStart: string,
    confirmedTimeEnd: string,
    adminId: string,
    adminNotes?: string
  ): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmed_date: confirmedDate,
          confirmed_time_start: confirmedTimeStart,
          confirmed_time_end: confirmedTimeEnd,
          confirmed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) return { data: null, error }

      // Add status history
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: bookingId,
          to_status: 'confirmed',
          changed_by: adminId,
          reason: 'Booking confirmed by admin',
          notes: adminNotes,
        })

      return { data: booking, error: null }
    }, 'Failed to confirm booking')
  }

  async cancelBooking(
    bookingId: string,
    cancelledBy: string,
    reason: string,
    refundAmount?: number
  ): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) return { data: null, error }

      // Add status history
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: bookingId,
          to_status: 'cancelled',
          changed_by: cancelledBy,
          reason,
          notes: refundAmount ? `Refund amount: £${refundAmount}` : undefined,
        })

      return { data: booking, error: null }
    }, 'Failed to cancel booking')
  }

  // Time Slot Management (Admin)
  async createTimeSlot(
    slotDate: string,
    startTime: string,
    createdBy: string,
    notes?: string
  ): Promise<ServiceResponse<TimeSlot>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      return supabase
        .from('time_slots')
        .insert({
          slot_date: slotDate,
          start_time: startTime,
          created_by: createdBy,
          notes,
          is_available: true,
        })
        .select()
        .single()
    }, 'Failed to create time slot')
  }

  async updateTimeSlot(
    slotId: string,
    updates: Partial<TimeSlot>
  ): Promise<ServiceResponse<TimeSlot>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      return supabase
        .from('time_slots')
        .update(updates)
        .eq('id', slotId)
        .select()
        .single()
    }, 'Failed to update time slot')
  }

  async deleteTimeSlot(slotId: string): Promise<ServiceResponse<void>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      const result = await supabase
        .from('time_slots')
        .delete()
        .eq('id', slotId)
      return { data: undefined, error: result.error }
    }, 'Failed to delete time slot')
  }

  // Generic booking update method
  async updateBooking(
    bookingId: string,
    updates: Record<string, unknown>
  ): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase
      
      return supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single()
    }, 'Failed to update booking')
  }
}