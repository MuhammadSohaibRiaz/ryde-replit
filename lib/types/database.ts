export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_type: 'passenger' | 'driver' | 'admin'
          full_name: string
          phone: string | null
          avatar_url: string | null
          account_status: 'active' | 'pending_verification' | 'suspended' | 'banned'
          email_verified: boolean
          email_verified_at: string | null
          profile_completed: boolean
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          user_type?: 'passenger' | 'driver' | 'admin'
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          account_status?: 'active' | 'pending_verification' | 'suspended' | 'banned'
          email_verified?: boolean
          email_verified_at?: string | null
          profile_completed?: boolean
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          user_type?: 'passenger' | 'driver' | 'admin'
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          account_status?: 'active' | 'pending_verification' | 'suspended' | 'banned'
          email_verified?: boolean
          email_verified_at?: string | null
          profile_completed?: boolean
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      driver_profiles: {
        Row: {
          user_id: string
          license_number: string
          license_expiry_date: string
          license_state: string
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
          vehicle_color: string
          vehicle_plate_number: string
          verification_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required'
          is_online: boolean
          can_receive_rides: boolean
          total_rides: number
          avg_rating: number
          documents_submitted_at: string | null
          verification_completed_at: string | null
          last_document_update: string | null
          admin_notes: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          license_number: string
          license_expiry_date: string
          license_state: string
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
          vehicle_color: string
          vehicle_plate_number: string
          verification_status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required'
          is_online?: boolean
          can_receive_rides?: boolean
          total_rides?: number
          avg_rating?: number
          documents_submitted_at?: string | null
          verification_completed_at?: string | null
          last_document_update?: string | null
          admin_notes?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          license_number?: string
          license_expiry_date?: string
          license_state?: string
          vehicle_make?: string
          vehicle_model?: string
          vehicle_year?: number
          vehicle_color?: string
          vehicle_plate_number?: string
          verification_status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required'
          is_online?: boolean
          can_receive_rides?: boolean
          total_rides?: number
          avg_rating?: number
          documents_submitted_at?: string | null
          verification_completed_at?: string | null
          last_document_update?: string | null
          admin_notes?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      driver_documents: {
        Row: {
          id: string
          driver_id: string
          document_type: 'drivers_license' | 'vehicle_registration' | 'insurance_certificate' | 'background_check' | 'profile_photo' | 'vehicle_photo'
          file_url: string
          file_name: string
          file_size: number
          mime_type: string
          status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required'
          uploaded_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          admin_notes: string | null
          rejection_reason: string | null
          is_current: boolean
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          document_type: 'drivers_license' | 'vehicle_registration' | 'insurance_certificate' | 'background_check' | 'profile_photo' | 'vehicle_photo'
          file_url: string
          file_name: string
          file_size: number
          mime_type: string
          status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required'
          uploaded_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          admin_notes?: string | null
          rejection_reason?: string | null
          is_current?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          document_type?: 'drivers_license' | 'vehicle_registration' | 'insurance_certificate' | 'background_check' | 'profile_photo' | 'vehicle_photo'
          file_url?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required'
          uploaded_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          admin_notes?: string | null
          rejection_reason?: string | null
          is_current?: boolean
          expires_at?: string | null
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
      user_type: 'passenger' | 'driver' | 'admin'
      account_status: 'active' | 'pending_verification' | 'suspended' | 'banned'
      verification_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required'
      document_type: 'drivers_license' | 'vehicle_registration' | 'insurance_certificate' | 'background_check' | 'profile_photo' | 'vehicle_photo'
      ride_status: 'requested' | 'assigned' | 'arriving' | 'in_progress' | 'completed' | 'canceled'
      driver_status: 'offline' | 'online' | 'busy'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}