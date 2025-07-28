export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string
          name: string | null
          address_line_1: string
          address_line_2: string | null
          city: string
          postal_code: string
          county: string | null
          country: string
          latitude: number | null
          longitude: number | null
          distance_from_base: number | null
          distance_from_business: number | null
          is_primary: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          address_line_1: string
          address_line_2?: string | null
          city: string
          postal_code: string
          county?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          distance_from_base?: number | null
          distance_from_business?: number | null
          is_primary?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          postal_code?: string
          county?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          distance_from_base?: number | null
          distance_from_business?: number | null
          is_primary?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      available_slots: {
        Row: {
          id: string
          slot_date: string
          start_time: string
          end_time: string
          is_available: boolean
          max_bookings: number
          current_bookings: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slot_date: string
          start_time: string
          end_time: string
          is_available?: boolean
          max_bookings?: number
          current_bookings?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slot_date?: string
          start_time?: string
          end_time?: string
          is_available?: boolean
          max_bookings?: number
          current_bookings?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "available_slots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          booking_reference: string
          customer_id: string
          service_id: string | null
          vehicle_id: string | null
          address_id: string | null
          time_slot_id: string | null
          base_price: number
          vehicle_size_multiplier: number
          distance_surcharge: number
          total_price: number
          vehicle_details: Json | null
          service_address: Json | null
          distance_km: number | null
          estimated_duration: number | null
          pricing_breakdown: Json | null
          status: string
          special_instructions: string | null
          admin_notes: string | null
          internal_notes: string | null
          scheduled_date: string
          scheduled_start_time: string
          scheduled_end_time: string
          actual_start_time: string | null
          actual_end_time: string | null
          confirmed_start_time: string | null
          confirmed_duration: number | null
          payment_method: string | null
          payment_status: string
          payment_reference: string | null
          created_at: string
          updated_at: string
          confirmed_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
        }
        Insert: {
          id?: string
          booking_reference: string
          customer_id: string
          service_id?: string | null
          vehicle_id?: string | null
          address_id?: string | null
          time_slot_id?: string | null
          base_price: number
          vehicle_size_multiplier?: number
          distance_surcharge?: number
          total_price: number
          vehicle_details?: Json | null
          service_address?: Json | null
          distance_km?: number | null
          estimated_duration?: number | null
          pricing_breakdown?: Json | null
          status?: string
          special_instructions?: string | null
          admin_notes?: string | null
          internal_notes?: string | null
          scheduled_date: string
          scheduled_start_time: string
          scheduled_end_time: string
          actual_start_time?: string | null
          actual_end_time?: string | null
          confirmed_start_time?: string | null
          confirmed_duration?: number | null
          payment_method?: string | null
          payment_status?: string
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
          confirmed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
        }
        Update: {
          id?: string
          booking_reference?: string
          customer_id?: string
          service_id?: string | null
          vehicle_id?: string | null
          address_id?: string | null
          time_slot_id?: string | null
          base_price?: number
          vehicle_size_multiplier?: number
          distance_surcharge?: number
          total_price?: number
          vehicle_details?: Json | null
          service_address?: Json | null
          distance_km?: number | null
          estimated_duration?: number | null
          pricing_breakdown?: Json | null
          status?: string
          special_instructions?: string | null
          admin_notes?: string | null
          internal_notes?: string | null
          scheduled_date?: string
          scheduled_start_time?: string
          scheduled_end_time?: string
          actual_start_time?: string | null
          actual_end_time?: string | null
          confirmed_start_time?: string | null
          confirmed_duration?: number | null
          payment_method?: string | null
          payment_status?: string
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
          confirmed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "available_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      booking_services: {
        Row: {
          id: string
          booking_id: string
          service_id: string
          service_details: Json
          price: number
          estimated_duration: number
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          service_id: string
          service_details: Json
          price: number
          estimated_duration: number
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          service_id?: string
          service_details?: Json
          price?: number
          estimated_duration?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      booking_status_history: {
        Row: {
          id: string
          booking_id: string
          from_status: string | null
          to_status: string
          changed_by: string | null
          reason: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          from_status?: string | null
          to_status: string
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          from_status?: string | null
          to_status?: string
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          name: string
          short_description: string | null
          long_description: string | null
          base_price: number
          duration_minutes: number
          is_active: boolean
          category_id: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          short_description?: string | null
          long_description?: string | null
          base_price: number
          duration_minutes: number
          is_active?: boolean
          category_id?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_description?: string | null
          long_description?: string | null
          base_price?: number
          duration_minutes?: number
          is_active?: boolean
          category_id?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      service_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          id: string
          service_id: string
          vehicle_size_id: string
          price_adjustment: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          vehicle_size_id: string
          price_adjustment: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          vehicle_size_id?: string
          price_adjustment?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_pricing_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_pricing_vehicle_size_id_fkey"
            columns: ["vehicle_size_id"]
            isOneToOne: false
            referencedRelation: "vehicle_sizes"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          role: string
          is_active: boolean
          email_verified: boolean
          phone_verified: boolean
          created_at: string
          updated_at: string
          last_sign_in: string | null
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string
          is_active?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          created_at?: string
          updated_at?: string
          last_sign_in?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string
          is_active?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          created_at?: string
          updated_at?: string
          last_sign_in?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicles: {
        Row: {
          id: string
          user_id: string
          vehicle_size_id: string
          name: string | null
          make: string | null
          model: string | null
          year: number | null
          color: string | null
          license_plate: string | null
          registration: string | null
          notes: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_size_id: string
          name?: string | null
          make?: string | null
          model?: string | null
          year?: number | null
          color?: string | null
          license_plate?: string | null
          registration?: string | null
          notes?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_size_id?: string
          name?: string | null
          make?: string | null
          model?: string | null
          year?: number | null
          color?: string | null
          license_plate?: string | null
          registration?: string | null
          notes?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vehicle_size_id_fkey"
            columns: ["vehicle_size_id"]
            isOneToOne: false
            referencedRelation: "vehicle_sizes"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicle_sizes: {
        Row: {
          id: string
          name: string
          description: string | null
          price_multiplier: number
          examples: string[] | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_multiplier: number
          examples?: string[] | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_multiplier?: number
          examples?: string[] | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: 'draft' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'paid' | 'cancelled' | 'no_show'
      user_role: 'customer' | 'admin' | 'super_admin'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// Type aliases for convenience
export type BookingRow = Tables<'bookings'>
export type BookingInsert = TablesInsert<'bookings'>
export type BookingUpdate = TablesUpdate<'bookings'>

export type UserProfileRow = Tables<'user_profiles'>
export type UserProfileInsert = TablesInsert<'user_profiles'>
export type UserProfileUpdate = TablesUpdate<'user_profiles'>

export type VehicleRow = Tables<'vehicles'>
export type VehicleInsert = TablesInsert<'vehicles'>
export type VehicleUpdate = TablesUpdate<'vehicles'>

export type AddressRow = Tables<'addresses'>
export type AddressInsert = TablesInsert<'addresses'>
export type AddressUpdate = TablesUpdate<'addresses'>

export type ServiceRow = Tables<'services'>
export type ServiceInsert = TablesInsert<'services'>
export type ServiceUpdate = TablesUpdate<'services'>

export type VehicleSizeRow = Tables<'vehicle_sizes'>
export type VehicleSizeInsert = TablesInsert<'vehicle_sizes'>
export type VehicleSizeUpdate = TablesUpdate<'vehicle_sizes'>

export type AvailableSlotRow = Tables<'available_slots'>
export type AvailableSlotInsert = TablesInsert<'available_slots'>
export type AvailableSlotUpdate = TablesUpdate<'available_slots'>

export type BookingServiceRow = Tables<'booking_services'>
export type BookingServiceInsert = TablesInsert<'booking_services'>
export type BookingServiceUpdate = TablesUpdate<'booking_services'>

export type BookingStatusHistoryRow = Tables<'booking_status_history'>
export type BookingStatusHistoryInsert = TablesInsert<'booking_status_history'>
export type BookingStatusHistoryUpdate = TablesUpdate<'booking_status_history'>

// Enum type aliases
export type BookingStatus = Enums<'booking_status'>
export type UserRole = Enums<'user_role'>
export type PaymentStatus = Enums<'payment_status'>