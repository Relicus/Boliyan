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
      listings: {
        Row: {
          id: string
          seller_id: string | null
          title: string
          description: string | null
          asked_price: number
          category: string | null
          images: string[] | null
          auction_mode: string | null
          status: string | null
          created_at: string | null
          search_vector: string | null
          condition: string | null
          slug: string | null
          ends_at: string | null
          final_buyer_id: string | null
          contact_phone: string | null
          go_live_at: string | null
          location_lat: number | null
          location_lng: number | null
          location_address: string | null
          contact_whatsapp: string | null
          listing_duration: number | null
          last_edited_at: string | null
          moderation_status: string | null
          rejection_reason: string | null
          rejected_at: string | null
          moderated_by: string | null
        }
        Insert: {
          id?: string
          seller_id?: string | null
          title: string
          description?: string | null
          asked_price: number
          category?: string | null
          images?: string[] | null
          auction_mode?: string | null
          status?: string | null
          created_at?: string | null
          search_vector?: string | null
          condition?: string | null
          slug?: string | null
          ends_at?: string | null
          final_buyer_id?: string | null
          contact_phone?: string | null
          go_live_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          contact_whatsapp?: string | null
          listing_duration?: number | null
          last_edited_at?: string | null
          moderation_status?: string | null
          rejection_reason?: string | null
          rejected_at?: string | null
          moderated_by?: string | null
        }
        Update: {
          id?: string
          seller_id?: string | null
          title?: string
          description?: string | null
          asked_price?: number
          category?: string | null
          images?: string[] | null
          auction_mode?: string | null
          status?: string | null
          created_at?: string | null
          search_vector?: string | null
          condition?: string | null
          slug?: string | null
          ends_at?: string | null
          final_buyer_id?: string | null
          contact_phone?: string | null
          go_live_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          contact_whatsapp?: string | null
          listing_duration?: number | null
          last_edited_at?: string | null
          moderation_status?: string | null
          rejection_reason?: string | null
          rejected_at?: string | null
          moderated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          location: string | null
          rating: number | null
          rating_count: number | null
          created_at: string | null
          is_verified: boolean | null
          email: string | null
          phone: string | null
          seller_success_rate: number | null
          buyer_success_rate: number | null
          deals_sealed_count: number | null
          location_lat: number | null
          location_lng: number | null
          whatsapp: string | null
          role: string | null
          banned_until: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          location?: string | null
          rating?: number | null
          rating_count?: number | null
          created_at?: string | null
          is_verified?: boolean | null
          email?: string | null
          phone?: string | null
          seller_success_rate?: number | null
          buyer_success_rate?: number | null
          deals_sealed_count?: number | null
          location_lat?: number | null
          location_lng?: number | null
          whatsapp?: string | null
          role?: string | null
          banned_until?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          location?: string | null
          rating?: number | null
          rating_count?: number | null
          created_at?: string | null
          is_verified?: boolean | null
          email?: string | null
          phone?: string | null
          seller_success_rate?: number | null
          buyer_success_rate?: number | null
          deals_sealed_count?: number | null
          location_lat?: number | null
          location_lng?: number | null
          whatsapp?: string | null
          role?: string | null
          banned_until?: string | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          id: string
          listing_id: string | null
          bidder_id: string | null
          amount: number
          message: string | null
          status: string | null
          created_at: string | null
          update_count: number | null
          updated_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          listing_id?: string | null
          bidder_id?: string | null
          amount: number
          message?: string | null
          status?: string | null
          created_at?: string | null
          update_count?: number | null
          updated_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string | null
          bidder_id?: string | null
          amount?: number
          message?: string | null
          status?: string | null
          created_at?: string | null
          update_count?: number | null
          updated_at?: string | null
          expires_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string | null
          reviewed_id: string | null
          listing_id: string | null
          conversation_id: string | null
          rating: number
          content: string | null
          role: string
          created_at: string | null
        }
        Insert: {
          id?: string
          reviewer_id?: string | null
          reviewed_id?: string | null
          listing_id?: string | null
          conversation_id?: string | null
          rating: number
          content?: string | null
          role: string
          created_at?: string | null
        }
        Update: {
          id?: string
          reviewer_id?: string | null
          reviewed_id?: string | null
          listing_id?: string | null
          conversation_id?: string | null
          rating?: number
          content?: string | null
          role?: string
          created_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          reason: string
          details: string | null
          status: string
          resolved_by: string | null
          resolved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id: string
          reason: string
          details?: string | null
          status?: string
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string | null
          reported_user_id?: string
          reason?: string
          details?: string | null
          status?: string
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          listing_id: string | null
          seller_id: string | null
          bidder_id: string | null
          last_message: string | null
          created_at: string | null
          updated_at: string | null
          expires_at: string | null
          seller_confirmed_at: string | null
          buyer_confirmed_at: string | null
          is_sealed: boolean | null
          short_code: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          listing_id?: string | null
          seller_id?: string | null
          bidder_id?: string | null
          last_message?: string | null
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
          seller_confirmed_at?: string | null
          buyer_confirmed_at?: string | null
          is_sealed?: boolean | null
          short_code?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          listing_id?: string | null
          seller_id?: string | null
          bidder_id?: string | null
          last_message?: string | null
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
          seller_confirmed_at?: string | null
          buyer_confirmed_at?: string | null
          is_sealed?: boolean | null
          short_code?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string | null
          sender_id: string | null
          content: string | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          sender_id?: string | null
          content?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string | null
          sender_id?: string | null
          content?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          is_read: boolean | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          is_read?: boolean | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          link?: string | null
          is_read?: boolean | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          user_id: string
          listing_id: string
          created_at: string | null
        }
        Insert: {
          user_id: string
          listing_id: string
          created_at?: string | null
        }
        Update: {
          user_id?: string
          listing_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          parent_id: string | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          parent_id?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          parent_id?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          id: string
          user_id: string | null
          query: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          query: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          query?: string
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      marketplace_listings: {
        Row: {
          id: string
          seller_id: string | null
          title: string | null
          description: string | null
          asked_price: number | null
          category: string | null
          images: string[] | null
          auction_mode: string | null
          status: string | null
          created_at: string | null
          search_vector: string | null
          condition: string | null
          seller_name: string | null
          seller_avatar: string | null
          seller_rating: number | null
          seller_rating_count: number | null
          seller_location: string | null
          location_lat: number | null
          location_lng: number | null
          location_address: string | null
          bid_count: number | null
          bid_attempts_count: number | null
          high_bid: number | null
          high_bidder_id: string | null
          slug: string | null
          ends_at: string | null
          go_live_at: string | null
          contact_phone: string | null
          moderation_status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_bid: {
        Args: {
          p_bid_id: string
        }
        Returns: {
          bid_id: string
          conversation_id: string
        }[]
      }
      reject_bid: {
        Args: {
          p_bid_id: string
        }
        Returns: void
      }
      create_listing: {
        Args: {
          p_title: string
          p_description: string | null
          p_category: string | null
          p_asked_price: number
          p_images: string[]
          p_contact_phone: string | null
          p_auction_mode: string | null
          p_condition: string | null
          p_listing_duration: number | null
          p_location_lat: number | null
          p_location_lng: number | null
          p_location_address: string | null
        }
        Returns: { id: string }[]
      }
      edit_listing_with_cooldown: {
        Args: {
          p_listing_id: string
          p_title: string
          p_description: string | null
          p_category: string | null
          p_asked_price: number
          p_images: string[]
          p_contact_phone: string | null
          p_auction_mode: string | null
          p_condition: string | null
          p_listing_duration: number | null
          p_location_lat: number | null
          p_location_lng: number | null
          p_location_address: string | null
        }
        Returns: { id: string }[]
      }
      delete_listing: {
        Args: {
          p_listing_id: string
        }
        Returns: void
      }
      update_listing_fields: {
        Args: {
          p_listing_id: string
          p_status: string | null
          p_title: string | null
        }
        Returns: void
      }
      place_bid: {
        Args: {
          p_listing_id: string
          p_amount: number
          p_message: string | null
        }
        Returns: Json
      }
      ensure_conversation: {
          Args: {
              p_listing_id: string
              p_bidder_id: string
          }
          Returns: string
      }
      send_message: {
          Args: {
              p_conversation_id: string
              p_content: string
          }
          Returns: Database['public']['Tables']['messages']['Row']
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
