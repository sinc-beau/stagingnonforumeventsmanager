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
      events: {
        Row: {
          id: string
          title: string
          date: string | null
          timezone: string
          city: string
          brand: string
          venue: string
          venue_address: string
          venue_link: string
          zip_code: string
          type: string
          blurb: string
          agenda: string
          hubspot_form_id: string
          slug: string
          islive: boolean
          user_id: string | null
          created_at: string
          updated_at: string
          description: string
          location: string
        }
        Insert: {
          id?: string
          title: string
          date?: string | null
          timezone?: string
          city?: string
          brand?: string
          venue?: string
          venue_address?: string
          venue_link?: string
          zip_code?: string
          type?: string
          blurb?: string
          agenda?: string
          hubspot_form_id?: string
          slug?: string
          islive?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
          description?: string
          location?: string
        }
        Update: {
          id?: string
          title?: string
          date?: string | null
          timezone?: string
          city?: string
          brand?: string
          venue?: string
          venue_address?: string
          venue_link?: string
          zip_code?: string
          type?: string
          blurb?: string
          agenda?: string
          hubspot_form_id?: string
          slug?: string
          islive?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
          description?: string
          location?: string
        }
      }
      event_speakers: {
        Row: {
          id: string
          event_id: string
          name: string
          about: string
          headshot_url: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          about?: string
          headshot_url?: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          about?: string
          headshot_url?: string
          order_index?: number
          created_at?: string
        }
      }
      event_sponsors: {
        Row: {
          id: string
          event_id: string
          name: string
          about: string
          logo_url: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          about?: string
          logo_url?: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          about?: string
          logo_url?: string
          order_index?: number
          created_at?: string
        }
      }
      agenda_items: {
        Row: {
          id: string
          event_id: string
          time_slot: string
          title: string
          description: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          time_slot?: string
          title?: string
          description?: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          time_slot?: string
          title?: string
          description?: string
          order_index?: number
          created_at?: string
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
      [_ in never]: never
    }
  }
}
