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
          condition: 'new' | 'like_new' | 'used' | 'fair' | null
          auction_mode: 'hidden' | 'visible' | 'sealed' | null
          status: 'active' | 'completed' | 'cancelled' | 'hidden' | null
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
          condition?: 'new' | 'like_new' | 'used' | 'fair' | null
          auction_mode?: 'hidden' | 'visible' | 'sealed' | null
          status?: 'active' | 'completed' | 'cancelled' | 'hidden' | null
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
          condition?: 'new' | 'like_new' | 'used' | 'fair' | null
          auction_mode?: 'hidden' | 'visible' | 'sealed' | null
          status?: 'active' | 'completed' | 'cancelled' | 'hidden' | null
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
      conversations: {
        Row: {
          id: string
          listing_id: string | null
          seller_id: string | null
          bidder_id: string | null
          created_at: string | null
          last_message?: string | null
          updated_at?: string | null
        }
        Insert: {
          id?: string
          listing_id?: string | null
          seller_id?: string | null
          bidder_id?: string | null
          created_at?: string | null
          last_message?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string | null
          seller_id?: string | null
          bidder_id?: string | null
          created_at?: string | null
          last_message?: string | null
          updated_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string | null
          sender_id: string | null
          content: string
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          sender_id?: string | null
          content: string
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string | null
          sender_id?: string | null
          content?: string
          is_read?: boolean | null
          created_at?: string | null
        }
      }
    }
  }
}
