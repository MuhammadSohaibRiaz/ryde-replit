export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'passenger' | 'driver' | 'admin'
          full_name: string
          phone: string | null
          avatar_url: string | null
          is_verified: boolean
          is_active: boolean
          date_of_birth: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'passenger' | 'driver' | 'admin'
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          date_of_birth?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'passenger' | 'driver' | 'admin'
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          date_of_birth?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rides: {
        Row: {
          id: string
          passenger_id: string | null
          driver_id: string | null
          status: 'requested' | 'assigned' | 'arriving' | 'in_progress' | 'completed' | 'canceled'
          pickup_address: string
          pickup_location: any // geography type
          dropoff_address: string
          dropoff_location: any // geography type
          distance_km: number | null
          estimated_duration_min: number | null
          fare_estimate: number | null
          fare_final: number | null
          surge_multiplier: number
          passenger_notes: string | null
          driver_notes: string | null
          requested_at: string
          assigned_at: string | null
          pickup_at: string | null
          dropoff_at: string | null
          canceled_at: string | null
          canceled_by: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          passenger_id?: string | null
          driver_id?: string | null
          status?: 'requested' | 'assigned' | 'arriving' | 'in_progress' | 'completed' | 'canceled'
          pickup_address: string
          pickup_location: any
          dropoff_address: string
          dropoff_location: any
          distance_km?: number | null
          estimated_duration_min?: number | null
          fare_estimate?: number | null
          fare_final?: number | null
          surge_multiplier?: number
          passenger_notes?: string | null
          driver_notes?: string | null
          requested_at?: string
          assigned_at?: string | null
          pickup_at?: string | null
          dropoff_at?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          passenger_id?: string | null
          driver_id?: string | null
          status?: 'requested' | 'assigned' | 'arriving' | 'in_progress' | 'completed' | 'canceled'
          pickup_address?: string
          pickup_location?: any
          dropoff_address?: string
          dropoff_location?: any
          distance_km?: number | null
          estimated_duration_min?: number | null
          fare_estimate?: number | null
          fare_final?: number | null
          surge_multiplier?: number
          passenger_notes?: string | null
          driver_notes?: string | null
          requested_at?: string
          assigned_at?: string | null
          pickup_at?: string | null
          dropoff_at?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          user_id: string
          license_number: string
          license_expiry: string
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
          vehicle_color: string
          vehicle_plate: string
          status: 'offline' | 'online' | 'busy'
          documents_verified: boolean
          background_check_verified: boolean
          rating: number
          total_rides: number
          total_earnings: number
          current_location: any | null
          current_heading: number | null
          last_location_update: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          license_number: string
          license_expiry: string
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
          vehicle_color: string
          vehicle_plate: string
          status?: 'offline' | 'online' | 'busy'
          documents_verified?: boolean
          background_check_verified?: boolean
          rating?: number
          total_rides?: number
          total_earnings?: number
          current_location?: any | null
          current_heading?: number | null
          last_location_update?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          license_number?: string
          license_expiry?: string
          vehicle_make?: string
          vehicle_model?: string
          vehicle_year?: number
          vehicle_color?: string
          vehicle_plate?: string
          status?: 'offline' | 'online' | 'busy'
          documents_verified?: boolean
          background_check_verified?: boolean
          rating?: number
          total_rides?: number
          total_earnings?: number
          current_location?: any | null
          current_heading?: number | null
          last_location_update?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'passenger' | 'driver' | 'admin'
      ride_status: 'requested' | 'assigned' | 'arriving' | 'in_progress' | 'completed' | 'canceled'
      driver_status: 'offline' | 'online' | 'busy'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}