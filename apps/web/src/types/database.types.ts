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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          location: string | null
          rating: number | null
          rating_count: number | null
          created_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          location?: string | null
          rating?: number | null
          rating_count?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          location?: string | null
          rating?: number | null
          rating_count?: number | null
          created_at?: string | null
        }
      }
      listings: {
        Row: {
          id: string
          seller_id: string | null
          title: string
          description: string | null
          asked_price: number
          category: string | null
          images: string[] | null
          auction_mode: 'hidden' | 'visible' | null
          status: 'active' | 'completed' | 'cancelled' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          seller_id?: string | null
          title: string
          description?: string | null
          asked_price: number
          category?: string | null
          images?: string[] | null
          auction_mode?: 'hidden' | 'visible' | null
          status?: 'active' | 'completed' | 'cancelled' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          seller_id?: string | null
          title?: string
          description?: string | null
          asked_price?: number
          category?: string | null
          images?: string[] | null
          auction_mode?: 'hidden' | 'visible' | null
          status?: 'active' | 'completed' | 'cancelled' | null
          created_at?: string | null
        }
      }
      bids: {
        Row: {
          id: string
          listing_id: string | null
          bidder_id: string | null
          amount: number
          message: string | null
          status: 'pending' | 'accepted' | 'ignored' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          listing_id?: string | null
          bidder_id?: string | null
          amount: number
          message?: string | null
          status?: 'pending' | 'accepted' | 'ignored' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string | null
          bidder_id?: string | null
          amount?: number
          message?: string | null
          status?: 'pending' | 'accepted' | 'ignored' | null
          created_at?: string | null
        }
      }
    }
  }
}
