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
      auth_failures: {
        Row: {
          id: string
          identifier: string
          failure_type: string
          failure_count: number | null
          last_attempt: string | null
          locked_until: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          identifier: string
          failure_type: string
          failure_count?: number | null
          last_attempt?: string | null
          locked_until?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          identifier?: string
          failure_type?: string
          failure_count?: number | null
          last_attempt?: string | null
          locked_until?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      booking_history: {
        Row: {
          id: string
          booking_id: string
          action: string
          details: Json | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          action: string
          details?: Json | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          action?: string
          details?: Json | null
          created_by?: string | null
          created_at?: string | null
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
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
      booking_reschedule_requests: {
        Row: {
          id: string
          booking_id: string
          requested_date: string
          requested_time: string
          reason: string | null
          status: string
          admin_response: string | null
          admin_id: string | null
          customer_notes: string | null
          admin_notes: string | null
          original_date: string
          original_time: string
          created_at: string
          updated_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          requested_date: string
          requested_time: string
          reason?: string | null
          status?: string
          admin_response?: string | null
          admin_id?: string | null
          customer_notes?: string | null
          admin_notes?: string | null
          original_date: string
          original_time: string
          created_at?: string
          updated_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          requested_date?: string
          requested_time?: string
          reason?: string | null
          status?: string
          admin_response?: string | null
          admin_id?: string | null
          customer_notes?: string | null
          admin_notes?: string | null
          original_date?: string
          original_time?: string
          created_at?: string
          updated_at?: string
          responded_at?: string | null
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
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          service_id: string
          service_details: Json
          price: number
          estimated_duration?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          service_id?: string
          service_details?: Json
          price?: number
          estimated_duration?: number
          created_at?: string | null
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
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          to_status: Database["public"]["Enums"]["booking_status"]
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          to_status?: Database["public"]["Enums"]["booking_status"]
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string | null
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
          created_at: string | null
          updated_at: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
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
          created_at: string | null
          updated_at: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          created_at: string | null
          updated_at: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          question: string
          answer: string
          category?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          question?: string
          answer?: string
          category?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          id: string
          user_id: string
          token_hash: string
          expires_at: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token_hash: string
          expires_at: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          token_hash?: string
          expires_at?: string
          created_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          id: string
          identifier: string
          action_type: string
          attempts: number | null
          window_start: string | null
          blocked_until: string | null
        }
        Insert: {
          id?: string
          identifier: string
          action_type: string
          attempts?: number | null
          window_start?: string | null
          blocked_until?: string | null
        }
        Update: {
          id?: string
          identifier?: string
          action_type?: string
          attempts?: number | null
          window_start?: string | null
          blocked_until?: string | null
        }
        Relationships: []
      }
      refresh_token_usage: {
        Row: {
          id: string
          session_id: string | null
          token_hash: string
          used_at: string | null
          replaced_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          token_hash: string
          used_at?: string | null
          replaced_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          token_hash?: string
          used_at?: string | null
          replaced_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_token_usage_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      security_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          severity: string
          description: string
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          severity: string
          description: string
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          severity?: string
          description?: string
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
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
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          id: string
          service_id: string
          small: number | null
          medium: number | null
          large: number | null
          extra_large: number | null
          service_description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          service_id: string
          small?: number | null
          medium?: number | null
          large?: number | null
          extra_large?: number | null
          service_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          service_id?: string
          small?: number | null
          medium?: number | null
          large?: number | null
          extra_large?: number | null
          service_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_pricing_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      service_pricing_backup: {
        Row: {
          id: string | null
          service_id: string | null
          vehicle_size_id: string | null
          price: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          service_id?: string | null
          vehicle_size_id?: string | null
          price?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          service_id?: string | null
          vehicle_size_id?: string | null
          price?: number | null
          created_at?: string | null
          updated_at?: string | null
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
          created_at: string | null
          updated_at: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          description?: string | null
          updated_at?: string | null
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
          created_at: string | null
          updated_at: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email_bookings?: boolean | null
          email_reminders?: boolean | null
          sms_bookings?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email_bookings?: boolean | null
          email_reminders?: boolean | null
          sms_bookings?: boolean | null
          created_at?: string | null
        }
        Relationships: []
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
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string | null
          supabase_session_id: string | null
          session_token: string
          refresh_token_family: string
          device_info: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
          last_activity: string | null
          expires_at: string
          revoked_at: string | null
          revocation_reason: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          supabase_session_id?: string | null
          session_token: string
          refresh_token_family: string
          device_info?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
          last_activity?: string | null
          expires_at: string
          revoked_at?: string | null
          revocation_reason?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          supabase_session_id?: string | null
          session_token?: string
          refresh_token_family?: string
          device_info?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
          last_activity?: string | null
          expires_at?: string
          revoked_at?: string | null
          revocation_reason?: string | null
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
      booking_status: "draft" | "pending" | "confirmed" | "rescheduled" | "in_progress" | "completed" | "paid" | "cancelled" | "no_show"
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

// Type aliases for easier usage
export type BookingStatus = Database['public']['Enums']['booking_status']
export type UserRole = Database['public']['Enums']['user_role']
export type PaymentStatus = Database['public']['Enums']['payment_status']

// Table row types
export type AuthFailure = Tables<'auth_failures'>
export type AuthFailureInsert = TablesInsert<'auth_failures'>
export type AuthFailureUpdate = TablesUpdate<'auth_failures'>

export type BookingHistory = Tables<'booking_history'>
export type BookingHistoryInsert = TablesInsert<'booking_history'>
export type BookingHistoryUpdate = TablesUpdate<'booking_history'>

export type BookingMessage = Tables<'booking_messages'>
export type BookingMessageInsert = TablesInsert<'booking_messages'>
export type BookingMessageUpdate = TablesUpdate<'booking_messages'>

export type BookingRescheduleRequest = Tables<'booking_reschedule_requests'>
export type BookingRescheduleRequestInsert = TablesInsert<'booking_reschedule_requests'>
export type BookingRescheduleRequestUpdate = TablesUpdate<'booking_reschedule_requests'>

export type BookingService = Tables<'booking_services'>
export type BookingServiceInsert = TablesInsert<'booking_services'>
export type BookingServiceUpdate = TablesUpdate<'booking_services'>

export type BookingStatusHistory = Tables<'booking_status_history'>
export type BookingStatusHistoryInsert = TablesInsert<'booking_status_history'>
export type BookingStatusHistoryUpdate = TablesUpdate<'booking_status_history'>

export type Booking = Tables<'bookings'>
export type BookingInsert = TablesInsert<'bookings'>
export type BookingUpdate = TablesUpdate<'bookings'>

export type CustomerAddress = Tables<'customer_addresses'>
export type CustomerAddressInsert = TablesInsert<'customer_addresses'>
export type CustomerAddressUpdate = TablesUpdate<'customer_addresses'>

export type CustomerVehicle = Tables<'customer_vehicles'>
export type CustomerVehicleInsert = TablesInsert<'customer_vehicles'>
export type CustomerVehicleUpdate = TablesUpdate<'customer_vehicles'>

export type FaqItem = Tables<'faq_items'>
export type FaqItemInsert = TablesInsert<'faq_items'>
export type FaqItemUpdate = TablesUpdate<'faq_items'>

export type PasswordResetToken = Tables<'password_reset_tokens'>
export type PasswordResetTokenInsert = TablesInsert<'password_reset_tokens'>
export type PasswordResetTokenUpdate = TablesUpdate<'password_reset_tokens'>

export type RateLimit = Tables<'rate_limits'>
export type RateLimitInsert = TablesInsert<'rate_limits'>
export type RateLimitUpdate = TablesUpdate<'rate_limits'>

export type RefreshTokenUsage = Tables<'refresh_token_usage'>
export type RefreshTokenUsageInsert = TablesInsert<'refresh_token_usage'>
export type RefreshTokenUsageUpdate = TablesUpdate<'refresh_token_usage'>

export type SecurityEvent = Tables<'security_events'>
export type SecurityEventInsert = TablesInsert<'security_events'>
export type SecurityEventUpdate = TablesUpdate<'security_events'>

export type ServiceCategory = Tables<'service_categories'>
export type ServiceCategoryInsert = TablesInsert<'service_categories'>
export type ServiceCategoryUpdate = TablesUpdate<'service_categories'>

export type ServicePricing = Tables<'service_pricing'>
export type ServicePricingInsert = TablesInsert<'service_pricing'>
export type ServicePricingUpdate = TablesUpdate<'service_pricing'>

export type ServicePricingBackup = Tables<'service_pricing_backup'>
export type ServicePricingBackupInsert = TablesInsert<'service_pricing_backup'>
export type ServicePricingBackupUpdate = TablesUpdate<'service_pricing_backup'>

export type Service = Tables<'services'>
export type ServiceInsert = TablesInsert<'services'>
export type ServiceUpdate = TablesUpdate<'services'>

export type SiteSetting = Tables<'site_settings'>
export type SiteSettingInsert = TablesInsert<'site_settings'>
export type SiteSettingUpdate = TablesUpdate<'site_settings'>

export type Testimonial = Tables<'testimonials'>
export type TestimonialInsert = TablesInsert<'testimonials'>
export type TestimonialUpdate = TablesUpdate<'testimonials'>

export type TimeSlot = Tables<'time_slots'>
export type TimeSlotInsert = TablesInsert<'time_slots'>
export type TimeSlotUpdate = TablesUpdate<'time_slots'>

export type UserNotificationSetting = Tables<'user_notification_settings'>
export type UserNotificationSettingInsert = TablesInsert<'user_notification_settings'>
export type UserNotificationSettingUpdate = TablesUpdate<'user_notification_settings'>

export type UserProfile = Tables<'user_profiles'>
export type UserProfileInsert = TablesInsert<'user_profiles'>
export type UserProfileUpdate = TablesUpdate<'user_profiles'>

export type UserSession = Tables<'user_sessions'>
export type UserSessionInsert = TablesInsert<'user_sessions'>
export type UserSessionUpdate = TablesUpdate<'user_sessions'>