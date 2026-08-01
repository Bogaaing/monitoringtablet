export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string | null
          name: string
          email: string
          role: 'admin' | 'pic' | 'manager'
          phone: string | null
          location_id: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id?: string | null
          name: string
          email: string
          role?: 'admin' | 'pic' | 'manager'
          phone?: string | null
          location_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string | null
          name?: string
          email?: string
          role?: 'admin' | 'pic' | 'manager'
          phone?: string | null
          location_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          code: string
          address: string | null
          description: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          address?: string | null
          description?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: string | null
          description?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tablets: {
        Row: {
          id: string
          qr_code: string
          serial_number: string
          brand: string | null
          model: string
          location_id: string | null
          status: 'active' | 'maintenance' | 'inactive'
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          qr_code: string
          serial_number: string
          brand?: string | null
          model: string
          location_id?: string | null
          status?: 'active' | 'maintenance' | 'inactive'
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          qr_code?: string
          serial_number?: string
          brand?: string | null
          model?: string
          location_id?: string | null
          status?: 'active' | 'maintenance' | 'inactive'
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inspection_periods: {
        Row: {
          id: string
          name: string
          year: number
          month: number
          start_date: string
          end_date: string
          is_active: boolean
          status: 'draft' | 'active' | 'closed' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          year: number
          month: number
          start_date: string
          end_date: string
          is_active?: boolean
          status?: 'draft' | 'active' | 'closed' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          year?: number
          month?: number
          start_date?: string
          end_date?: string
          is_active?: boolean
          status?: 'draft' | 'active' | 'closed' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      inspections: {
        Row: {
          id: string
          period_id: string
          tablet_id: string
          pic_id: string
          status: 'pending' | 'approved' | 'rejected'
          notes: string | null
          rejection_reason: string | null
          submitted_at: string
          reviewed_at: string | null
          reviewer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          period_id: string
          tablet_id: string
          pic_id: string
          status?: 'pending' | 'approved' | 'rejected'
          notes?: string | null
          rejection_reason?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          period_id?: string
          tablet_id?: string
          pic_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          notes?: string | null
          rejection_reason?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inspection_photos: {
        Row: {
          id: string
          inspection_id: string
          photo_url: string
          photo_type: 'front' | 'back' | 'screen' | 'accessory'
          uploaded_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          photo_url: string
          photo_type: 'front' | 'back' | 'screen' | 'accessory'
          uploaded_at?: string
        }
        Update: {
          id?: string
          inspection_id?: string
          photo_url?: string
          photo_type?: 'front' | 'back' | 'screen' | 'accessory'
          uploaded_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          details?: Json | null
          created_at?: string
        }
      }
    }
  }
}
