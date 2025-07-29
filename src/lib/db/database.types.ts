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
      booking_history: {
        Row: {
          id: string
          booking_id: string
          action: string
          details: Json | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          action: string
          details?: Json | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          action?: string
          details?: Json | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      booking_messages: {
        Row: {
          id: string
          booking_id: string
          sender_id: string
          recipient_id: string | null
          message_type: string | null
          subject: string | null
          message: string
          is_internal: boolean | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          sender_id: string
          recipient_id?: string | null
          message_type?: string | null
          subject?: string | null
          message: string
          is_internal?: boolean | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          sender_id?: string
          recipient_id?: string | null
          message_type?: string | null
          subject?: string | null
          message?: string
          is_internal?: boolean | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
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
          estimated_duration?: number
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
          from_status: Database["public"]["Enums"]["booking_status"] | null
          to_status: Database["public"]["Enums"]["booking_status"]
          changed_by: string | null
          reason: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          to_status: Database["public"]["Enums"]["booking_status"]
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          to_status?: Database["public"]["Enums"]["booking_status"]
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
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          booking_reference: string
          customer_id: string | null
          service_id: string | null
          vehicle_id: string | null
          address_id: string | null
          time_slot_id: string | null
          base_price: number
          vehicle_size_multiplier: number | null
          distance_surcharge: number | null
          total_price: number
          status: Database["public"]["Enums"]["booking_status"] | null
          special_instructions: string | null
          internal_notes: string | null
          scheduled_date: string
          scheduled_start_time: string
          scheduled_end_time: string
          actual_start_time: string | null
          actual_end_time: string | null
          payment_method: string | null
          payment_status: string | null
          payment_reference: string | null
          created_at: string
          updated_at: string
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          estimated_duration: number | null
          vehicle_details: Json | null
          service_address: Json | null
          distance_km: number | null
          pricing_breakdown: Json | null
          confirmed_start_time: string | null
          confirmed_duration: number | null
          admin_notes: string | null
          confirmed_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          booking_reference: string
          customer_id?: string | null
          service_id?: string | null
          vehicle_id?: string | null
          address_id?: string | null
          time_slot_id?: string | null
          base_price: number
          vehicle_size_multiplier?: number | null
          distance_surcharge?: number | null
          total_price: number
          status?: Database["public"]["Enums"]["booking_status"] | null
          special_instructions?: string | null
          internal_notes?: string | null
          scheduled_date: string
          scheduled_start_time: string
          scheduled_end_time: string
          actual_start_time?: string | null
          actual_end_time?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          estimated_duration?: number | null
          vehicle_details?: Json | null
          service_address?: Json | null
          distance_km?: number | null
          pricing_breakdown?: Json | null
          confirmed_start_time?: string | null
          confirmed_duration?: number | null
          admin_notes?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          booking_reference?: string
          customer_id?: string | null
          service_id?: string | null
          vehicle_id?: string | null
          address_id?: string | null
          time_slot_id?: string | null
          base_price?: number
          vehicle_size_multiplier?: number | null
          distance_surcharge?: number | null
          total_price?: number
          status?: Database["public"]["Enums"]["booking_status"] | null
          special_instructions?: string | null
          internal_notes?: string | null
          scheduled_date?: string
          scheduled_start_time?: string
          scheduled_end_time?: string
          actual_start_time?: string | null
          actual_end_time?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          estimated_duration?: number | null
          vehicle_details?: Json | null
          service_address?: Json | null
          distance_km?: number | null
          pricing_breakdown?: Json | null
          confirmed_start_time?: string | null
          confirmed_duration?: number | null
          admin_notes?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
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
            referencedRelation: "customer_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_addresses: {
        Row: {
          id: string
          user_id: string | null
          address_line_1: string
          address_line_2: string | null
          city: string
          postal_code: string
          county: string | null
          country: string | null
          latitude: number | null
          longitude: number | null
          distance_from_base: number | null
          is_primary: boolean | null
          is_verified: boolean | null
          created_at: string
          updated_at: string
          name: string | null
          is_default: boolean | null
          distance_from_business: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          address_line_1: string
          address_line_2?: string | null
          city: string
          postal_code: string
          county?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          distance_from_base?: number | null
          is_primary?: boolean | null
          is_verified?: boolean | null
          created_at?: string
          updated_at?: string
          name?: string | null
          is_default?: boolean | null
          distance_from_business?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          postal_code?: string
          county?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          distance_from_base?: number | null
          is_primary?: boolean | null
          is_verified?: boolean | null
          created_at?: string
          updated_at?: string
          name?: string | null
          is_default?: boolean | null
          distance_from_business?: number | null
        }
        Relationships: []
      }
      customer_vehicles: {
        Row: {
          id: string
          user_id: string | null
          vehicle_size_id: string | null
          make: string | null
          model: string | null
          year: number | null
          color: string | null
          license_plate: string | null
          notes: string | null
          is_primary: boolean | null
          created_at: string
          updated_at: string
          name: string | null
          is_default: boolean | null
          registration: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          vehicle_size_id?: string | null
          make?: string | null
          model?: string | null
          year?: number | null
          color?: string | null
          license_plate?: string | null
          notes?: string | null
          is_primary?: boolean | null
          created_at?: string
          updated_at?: string
          name?: string | null
          is_default?: boolean | null
          registration?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          vehicle_size_id?: string | null
          make?: string | null
          model?: string | null
          year?: number | null
          color?: string | null
          license_plate?: string | null
          notes?: string | null
          is_primary?: boolean | null
          created_at?: string
          updated_at?: string
          name?: string | null
          is_default?: boolean | null
          registration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_vehicles_vehicle_size_id_fkey"
            columns: ["vehicle_size_id"]
            isOneToOne: false
            referencedRelation: "vehicle_sizes"
            referencedColumns: ["id"]
          }
        ]
      }
      faq_items: {
        Row: {
          id: string
          question: string
          answer: string
          category: string | null
          display_order: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question: string
          answer: string
          category?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question?: string
          answer?: string
          category?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          id: string
          user_id: string
          token_hash: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token_hash: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token_hash?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          display_order: number | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          category_id: string | null
          name: string
          slug: string
          short_description: string | null
          full_description: string | null
          base_price: number
          duration_minutes: number
          is_mobile_only: boolean | null
          requires_water_source: boolean | null
          requires_power_source: boolean | null
          max_vehicles_per_slot: number | null
          is_active: boolean | null
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          slug: string
          short_description?: string | null
          full_description?: string | null
          base_price: number
          duration_minutes: number
          is_mobile_only?: boolean | null
          requires_water_source?: boolean | null
          requires_power_source?: boolean | null
          max_vehicles_per_slot?: number | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          slug?: string
          short_description?: string | null
          full_description?: string | null
          base_price?: number
          duration_minutes?: number
          is_mobile_only?: boolean | null
          requires_water_source?: boolean | null
          requires_power_source?: boolean | null
          max_vehicles_per_slot?: number | null
          is_active?: boolean | null
          display_order?: number | null
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
      site_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          id: string
          customer_name: string
          customer_location: string | null
          service_name: string | null
          rating: number | null
          review_text: string
          is_featured: boolean | null
          is_verified: boolean | null
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_location?: string | null
          service_name?: string | null
          rating?: number | null
          review_text: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_location?: string | null
          service_name?: string | null
          rating?: number | null
          review_text?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          id: string
          slot_date: string
          start_time: string
          is_available: boolean | null
          created_by: string | null
          notes: string | null
          created_at: string
          booking_reference: string | null
          booking_status: Database["public"]["Enums"]["booking_status"] | null
        }
        Insert: {
          id?: string
          slot_date: string
          start_time: string
          is_available?: boolean | null
          created_by?: string | null
          notes?: string | null
          created_at?: string
          booking_reference?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
        }
        Update: {
          id?: string
          slot_date?: string
          start_time?: string
          is_available?: boolean | null
          created_by?: string | null
          notes?: string | null
          created_at?: string
          booking_reference?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          id: string
          user_id: string
          email_bookings: boolean | null
          email_reminders: boolean | null
          sms_bookings: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_bookings?: boolean | null
          email_reminders?: boolean | null
          sms_bookings?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_bookings?: boolean | null
          email_reminders?: boolean | null
          sms_bookings?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          role: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
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
      vehicle_sizes: {
        Row: {
          id: string
          name: string
          description: string | null
          price_multiplier: number | null
          examples: string[] | null
          display_order: number | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_multiplier?: number | null
          examples?: string[] | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_multiplier?: number | null
          examples?: string[] | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string
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
      booking_status: "draft" | "pending" | "confirmed" | "in_progress" | "completed" | "paid" | "cancelled" | "no_show"
      user_role: "customer" | "admin" | "super_admin"
      payment_status: "pending" | "processing" | "completed" | "failed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
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
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
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
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
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
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Convenient type aliases for all tables
export type BookingHistoryRow = Tables<'booking_history'>
export type BookingHistoryInsert = TablesInsert<'booking_history'>
export type BookingHistoryUpdate = TablesUpdate<'booking_history'>

export type BookingMessageRow = Tables<'booking_messages'>
export type BookingMessageInsert = TablesInsert<'booking_messages'>
export type BookingMessageUpdate = TablesUpdate<'booking_messages'>

export type BookingServiceRow = Tables<'booking_services'>
export type BookingServiceInsert = TablesInsert<'booking_services'>
export type BookingServiceUpdate = TablesUpdate<'booking_services'>

export type BookingStatusHistoryRow = Tables<'booking_status_history'>
export type BookingStatusHistoryInsert = TablesInsert<'booking_status_history'>
export type BookingStatusHistoryUpdate = TablesUpdate<'booking_status_history'>

export type BookingRow = Tables<'bookings'>
export type BookingInsert = TablesInsert<'bookings'>
export type BookingUpdate = TablesUpdate<'bookings'>

export type CustomerAddressRow = Tables<'customer_addresses'>
export type CustomerAddressInsert = TablesInsert<'customer_addresses'>
export type CustomerAddressUpdate = TablesUpdate<'customer_addresses'>

export type CustomerVehicleRow = Tables<'customer_vehicles'>
export type CustomerVehicleInsert = TablesInsert<'customer_vehicles'>
export type CustomerVehicleUpdate = TablesUpdate<'customer_vehicles'>

export type FaqItemRow = Tables<'faq_items'>
export type FaqItemInsert = TablesInsert<'faq_items'>
export type FaqItemUpdate = TablesUpdate<'faq_items'>

export type PasswordResetTokenRow = Tables<'password_reset_tokens'>
export type PasswordResetTokenInsert = TablesInsert<'password_reset_tokens'>
export type PasswordResetTokenUpdate = TablesUpdate<'password_reset_tokens'>

export type ServiceCategoryRow = Tables<'service_categories'>
export type ServiceCategoryInsert = TablesInsert<'service_categories'>
export type ServiceCategoryUpdate = TablesUpdate<'service_categories'>

export type ServiceRow = Tables<'services'>
export type ServiceInsert = TablesInsert<'services'>
export type ServiceUpdate = TablesUpdate<'services'>

export type SiteSettingRow = Tables<'site_settings'>
export type SiteSettingInsert = TablesInsert<'site_settings'>
export type SiteSettingUpdate = TablesUpdate<'site_settings'>

export type TestimonialRow = Tables<'testimonials'>
export type TestimonialInsert = TablesInsert<'testimonials'>
export type TestimonialUpdate = TablesUpdate<'testimonials'>

export type TimeSlotRow = Tables<'time_slots'>
export type TimeSlotInsert = TablesInsert<'time_slots'>
export type TimeSlotUpdate = TablesUpdate<'time_slots'>

export type UserNotificationSettingRow = Tables<'user_notification_settings'>
export type UserNotificationSettingInsert = TablesInsert<'user_notification_settings'>
export type UserNotificationSettingUpdate = TablesUpdate<'user_notification_settings'>

export type UserProfileRow = Tables<'user_profiles'>
export type UserProfileInsert = TablesInsert<'user_profiles'>
export type UserProfileUpdate = TablesUpdate<'user_profiles'>

export type VehicleSizeRow = Tables<'vehicle_sizes'>
export type VehicleSizeInsert = TablesInsert<'vehicle_sizes'>
export type VehicleSizeUpdate = TablesUpdate<'vehicle_sizes'>

// Enum type aliases
export type BookingStatus = Enums<'booking_status'>
export type UserRole = Enums<'user_role'>
export type PaymentStatus = Enums<'payment_status'>