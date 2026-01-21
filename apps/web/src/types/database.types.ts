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
          ends_at: string | null
          slug: string | null
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
          ends_at?: string | null
          slug?: string | null
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
          ends_at?: string | null
          slug?: string | null
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
      marketplace_listings: {
        Row: {
          id: string
          title: string
          description: string | null
          images: string[] | null
          seller_id: string | null
          asked_price: number
          category: string | null
          auction_mode: 'hidden' | 'visible' | 'sealed' | null
          created_at: string | null
          status: 'active' | 'completed' | 'cancelled' | 'hidden' | null
          seller_name: string | null
          seller_avatar: string | null
          seller_rating: number | null
          seller_rating_count: number | null
          seller_location: string | null
          bid_count: number | null
          high_bid: number | null
          high_bidder_id: string | null
          condition: 'new' | 'like_new' | 'used' | 'fair' | null
          slug: string | null
          ends_at: string | null
        }
        Insert: {
          id?: string
          title?: string
          description?: string | null
          images?: string[] | null
          seller_id?: string | null
          asked_price?: number
          category?: string | null
          auction_mode?: 'hidden' | 'visible' | 'sealed' | null
          created_at?: string | null
          status?: 'active' | 'completed' | 'cancelled' | 'hidden' | null
          seller_name?: string | null
          seller_avatar?: string | null
          seller_rating?: number | null
          seller_rating_count?: number | null
          seller_location?: string | null
          bid_count?: number | null
          high_bid?: number | null
          high_bidder_id?: string | null
          condition?: 'new' | 'like_new' | 'used' | 'fair' | null
          slug?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          images?: string[] | null
          seller_id?: string | null
          asked_price?: number
          category?: string | null
          auction_mode?: 'hidden' | 'visible' | 'sealed' | null
          created_at?: string | null
          status?: 'active' | 'completed' | 'cancelled' | 'hidden' | null
          seller_name?: string | null
          seller_avatar?: string | null
          seller_rating?: number | null
          seller_rating_count?: number | null
          seller_location?: string | null
          bid_count?: number | null
          high_bid?: number | null
          high_bidder_id?: string | null
          condition?: 'new' | 'like_new' | 'used' | 'fair' | null
          slug?: string | null
        }
      }
      watchlist: {
        Row: {
          id: string
          user_id: string | null
          listing_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          listing_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          listing_id?: string | null
          created_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string | null
          title: string | null
          body: string | null
          link: string | null
          is_read: boolean | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          type?: string | null
          title?: string | null
          body?: string | null
          link?: string | null
          is_read?: boolean | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string | null
          title?: string | null
          body?: string | null
          link?: string | null
          is_read?: boolean | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string | null
          reviewed_id: string | null
          listing_id: string | null
          conversation_id: string | null
          rating: number | null
          content: string | null
          role: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          reviewer_id?: string | null
          reviewed_id?: string | null
          listing_id?: string | null
          conversation_id?: string | null
          rating?: number | null
          content?: string | null
          role?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          reviewer_id?: string | null
          reviewed_id?: string | null
          listing_id?: string | null
          conversation_id?: string | null
          rating?: number | null
          content?: string | null
          role?: string | null
          created_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          sort_order?: number | null
        }
      }
      search_history: {
        Row: {
          id: string
          user_id: string | null
          query: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          query?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          query?: string | null
          created_at?: string | null
        }
      }
    }
  }
}
