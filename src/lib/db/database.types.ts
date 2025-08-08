export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      auth_failures: {
        Row: {
          failure_count: number | null
          failure_type: string
          id: string
          identifier: string
          last_attempt: string | null
          locked_until: string | null
          metadata: Json | null
        }
        Insert: {
          failure_count?: number | null
          failure_type: string
          id?: string
          identifier: string
          last_attempt?: string | null
          locked_until?: string | null
          metadata?: Json | null
        }
        Update: {
          failure_count?: number | null
          failure_type?: string
          id?: string
          identifier?: string
          last_attempt?: string | null
          locked_until?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      booking_history: {
        Row: {
          action: string
          booking_id: string
          created_at: string | null
          created_by: string | null
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          booking_id: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          booking_id?: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          id?: string
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
          },
        ]
      }
      booking_messages: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          message: string
          message_type: string | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          subject: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message: string
          message_type?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          subject?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message?: string
          message_type?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reschedule_requests: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          admin_response: string | null
          booking_id: string
          created_at: string
          customer_notes: string | null
          id: string
          original_date: string
          original_time: string
          reason: string | null
          requested_date: string
          requested_time: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          admin_response?: string | null
          booking_id: string
          created_at?: string
          customer_notes?: string | null
          id?: string
          original_date: string
          original_time: string
          reason?: string | null
          requested_date: string
          requested_time: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          admin_response?: string | null
          booking_id?: string
          created_at?: string
          customer_notes?: string | null
          id?: string
          original_date?: string
          original_time?: string
          reason?: string | null
          requested_date?: string
          requested_time?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_reschedule_requests_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reschedule_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_services: {
        Row: {
          booking_id: string
          created_at: string | null
          estimated_duration: number
          id: string
          price: number
          service_details: Json
          service_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          estimated_duration?: number
          id?: string
          price: number
          service_details: Json
          service_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          estimated_duration?: number
          id?: string
          price?: number
          service_details?: Json
          service_id?: string
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
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string | null
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: string
          notes: string | null
          reason: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          notes?: string | null
          reason?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          notes?: string | null
          reason?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          address_id: string | null
          admin_notes: string | null
          base_price: number
          booking_reference: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          confirmed_at: string | null
          confirmed_duration: number | null
          confirmed_start_time: string | null
          created_at: string | null
          customer_id: string | null
          distance_km: number | null
          distance_surcharge: number | null
          estimated_duration: number | null
          id: string
          internal_notes: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          pricing_breakdown: Json | null
          scheduled_date: string
          scheduled_end_time: string
          scheduled_start_time: string
          service_address: Json | null
          service_id: string | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          time_slot_id: string | null
          total_price: number
          updated_at: string | null
          vehicle_details: Json | null
          vehicle_id: string | null
          vehicle_size_multiplier: number | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          address_id?: string | null
          admin_notes?: string | null
          base_price: number
          booking_reference: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_duration?: number | null
          confirmed_start_time?: string | null
          created_at?: string | null
          customer_id?: string | null
          distance_km?: number | null
          distance_surcharge?: number | null
          estimated_duration?: number | null
          id?: string
          internal_notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          pricing_breakdown?: Json | null
          scheduled_date: string
          scheduled_end_time: string
          scheduled_start_time: string
          service_address?: Json | null
          service_id?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          time_slot_id?: string | null
          total_price: number
          updated_at?: string | null
          vehicle_details?: Json | null
          vehicle_id?: string | null
          vehicle_size_multiplier?: number | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          address_id?: string | null
          admin_notes?: string | null
          base_price?: number
          booking_reference?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_duration?: number | null
          confirmed_start_time?: string | null
          created_at?: string | null
          customer_id?: string | null
          distance_km?: number | null
          distance_surcharge?: number | null
          estimated_duration?: number | null
          id?: string
          internal_notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          pricing_breakdown?: Json | null
          scheduled_date?: string
          scheduled_end_time?: string
          scheduled_start_time?: string
          service_address?: Json | null
          service_id?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          time_slot_id?: string | null
          total_price?: number
          updated_at?: string | null
          vehicle_details?: Json | null
          vehicle_id?: string | null
          vehicle_size_multiplier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
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
            foreignKeyName: "bookings_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "customer_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string | null
          county: string | null
          created_at: string | null
          distance_from_base: number | null
          distance_from_business: number | null
          id: string
          is_default: boolean | null
          is_primary: boolean | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          postal_code: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country?: string | null
          county?: string | null
          created_at?: string | null
          distance_from_base?: number | null
          distance_from_business?: number | null
          id?: string
          is_default?: boolean | null
          is_primary?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          postal_code: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string | null
          county?: string | null
          created_at?: string | null
          distance_from_base?: number | null
          distance_from_business?: number | null
          id?: string
          is_default?: boolean | null
          is_primary?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          postal_code?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_vehicles: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          is_primary: boolean | null
          license_plate: string | null
          make: string | null
          model: string | null
          name: string | null
          notes: string | null
          registration: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_size_id: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_primary?: boolean | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          name?: string | null
          notes?: string | null
          registration?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_size_id?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_primary?: boolean | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          name?: string | null
          notes?: string | null
          registration?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_size_id?: string | null
          year?: number | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          attempts: number | null
          blocked_until: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          action_type: string
          attempts?: number | null
          blocked_until?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          action_type?: string
          attempts?: number | null
          blocked_until?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      refresh_token_usage: {
        Row: {
          created_at: string | null
          id: string
          replaced_by: string | null
          session_id: string | null
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          replaced_by?: string | null
          session_id?: string | null
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          replaced_by?: string | null
          session_id?: string | null
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_token_usage_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string | null
          description: string
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          created_at: string | null
          extra_large: number | null
          id: string
          large: number | null
          medium: number | null
          service_description: string | null
          service_id: string
          small: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          extra_large?: number | null
          id?: string
          large?: number | null
          medium?: number | null
          service_description?: string | null
          service_id: string
          small?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          extra_large?: number | null
          id?: string
          large?: number | null
          medium?: number | null
          service_description?: string | null
          service_id?: string
          small?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_pricing_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_pricing_backup: {
        Row: {
          created_at: string | null
          id: string | null
          price: number | null
          service_id: string | null
          updated_at: string | null
          vehicle_size_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          price?: number | null
          service_id?: string | null
          updated_at?: string | null
          vehicle_size_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          price?: number | null
          service_id?: string | null
          updated_at?: string | null
          vehicle_size_id?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string | null
          display_order: number | null
          duration_minutes: number
          full_description: string | null
          id: string
          is_active: boolean | null
          name: string
          short_description: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          display_order?: number | null
          duration_minutes: number
          full_description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          short_description?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          display_order?: number | null
          duration_minutes?: number
          full_description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          short_description?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          booking_reference: string | null
          booking_status: Database["public"]["Enums"]["booking_status"] | null
          created_at: string | null
          created_by: string | null
          id: string
          is_available: boolean | null
          notes: string | null
          slot_date: string
          start_time: string
        }
        Insert: {
          booking_reference?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_available?: boolean | null
          notes?: string | null
          slot_date: string
          start_time: string
        }
        Update: {
          booking_reference?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_available?: boolean | null
          notes?: string | null
          slot_date?: string
          start_time?: string
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          created_at: string | null
          email_bookings: boolean | null
          email_reminders: boolean | null
          id: string
          sms_bookings: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_bookings?: boolean | null
          email_reminders?: boolean | null
          id?: string
          sms_bookings?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_bookings?: boolean | null
          email_reminders?: boolean | null
          id?: string
          sms_bookings?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          email_verified: boolean | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown | null
          last_activity: string | null
          refresh_token_family: string
          revocation_reason: string | null
          revoked_at: string | null
          session_token: string
          supabase_session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          refresh_token_family: string
          revocation_reason?: string | null
          revoked_at?: string | null
          session_token: string
          supabase_session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          refresh_token_family?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          session_token?: string
          supabase_session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      calculate_booking_price: {
        Args: {
          service_id: string
          vehicle_size_id: string
          distance_km?: number
        }
        Returns: number
      }
      can_access_booking: {
        Args: { booking_id: string; user_id?: string }
        Returns: boolean
      }
      check_admin_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          identifier_param: string
          action_type_param: string
          max_attempts?: number
          window_minutes?: number
        }
        Returns: Json
      }
      cleanup_expired_reset_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_user_profile: {
        Args: {
          user_id: string
          user_email: string
          first_name?: string
          last_name?: string
          phone?: string
          user_role?: string
        }
        Returns: {
          created_at: string | null
          email: string
          email_verified: boolean | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
      }
      debug_auth_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          auth_uid: string
          user_exists: boolean
          user_active: boolean
          user_role: string
          session_valid: boolean
        }[]
      }
      debug_user_creation: {
        Args: { test_email?: string }
        Returns: {
          check_name: string
          status: string
          details: string
        }[]
      }
      ensure_user_profile_exists: {
        Args: { user_id: string }
        Returns: {
          created_at: string | null
          email: string
          email_verified: boolean | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
      }
      generate_booking_reference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string
          role: string
        }[]
      }
      is_time_slot_available: {
        Args: { slot_id: string; booking_date: string; start_time: string }
        Returns: boolean
      }
      owns_resource: {
        Args: { resource_user_id: string; user_id?: string }
        Returns: boolean
      }
      reschedule_booking: {
        Args: {
          p_booking_id: string
          p_new_date: string
          p_new_start_time: string
          p_new_end_time: string
          p_new_time_slot_id: string
          p_reschedule_reason?: string
          p_old_date?: string
          p_old_start_time?: string
        }
        Returns: undefined
      }
      reschedule_booking_atomic: {
        Args: {
          p_booking_id: string
          p_reschedule_request_id: string
          p_new_date: string
          p_new_time: string
          p_admin_response?: string
        }
        Returns: Json
      }
      revoke_user_sessions: {
        Args: { target_user_id: string; reason?: string }
        Returns: number
      }
      validate_user_session: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "rescheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
        | "processing"
        | "payment_failed"
        | "declined"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "rescheduled",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
        "processing",
        "payment_failed",
        "declined",
      ],
    },
  },
} as const
