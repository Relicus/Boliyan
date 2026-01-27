export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          amount: number
          bidder_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          listing_id: string | null
          message: string | null
          status: string | null
          update_count: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bidder_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          listing_id?: string | null
          message?: string | null
          status?: string | null
          update_count?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bidder_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          listing_id?: string | null
          message?: string | null
          status?: string | null
          update_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          bidder_id: string | null
          buyer_confirmed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_sealed: boolean | null
          last_message: string | null
          listing_id: string | null
          seller_confirmed_at: string | null
          seller_id: string | null
          updated_at: string | null
        }
        Insert: {
          bidder_id?: string | null
          buyer_confirmed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_sealed?: boolean | null
          last_message?: string | null
          listing_id?: string | null
          seller_confirmed_at?: string | null
          seller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bidder_id?: string | null
          buyer_confirmed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_sealed?: boolean | null
          last_message?: string | null
          listing_id?: string | null
          seller_confirmed_at?: string | null
          seller_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          asked_price: number
          auction_mode: string | null
          category: string | null
          condition: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          ends_at: string | null
          go_live_at: string | null
          last_edited_at: string | null
          final_buyer_id: string | null
          id: string
          images: string[] | null
          search_vector: unknown
          seller_id: string | null
          slug: string | null
          status: string | null
          title: string
          location_lat: number | null
          location_lng: number | null
          location_address: string | null
          listing_duration: number | null
        }
        Insert: {
          asked_price: number
          auction_mode?: string | null
          category?: string | null
          condition?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          go_live_at?: string | null
          last_edited_at?: string | null
          final_buyer_id?: string | null
          id?: string
          images?: string[] | null
          search_vector?: unknown
          seller_id?: string | null
          slug?: string | null
          status?: string | null
          title: string
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          listing_duration?: number | null
        }
        Update: {
          asked_price?: number
          auction_mode?: string | null
          category?: string | null
          condition?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          go_live_at?: string | null
          last_edited_at?: string | null
          final_buyer_id?: string | null
          id?: string
          images?: string[] | null
          search_vector?: unknown
          seller_id?: string | null
          slug?: string | null
          status?: string | null
          title?: string
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          listing_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_final_buyer_id_fkey"
            columns: ["final_buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          buyer_success_rate: number | null
          created_at: string | null
          deals_sealed_count: number | null
          email: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          location: string | null
          phone: string | null
          rating: number | null
          rating_count: number | null
          seller_success_rate: number | null
          location_lat: number | null
          location_lng: number | null
        }
        Insert: {
          avatar_url?: string | null
          buyer_success_rate?: number | null
          created_at?: string | null
          deals_sealed_count?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          rating?: number | null
          rating_count?: number | null
          seller_success_rate?: number | null
          location_lat?: number | null
          location_lng?: number | null
        }
        Update: {
          avatar_url?: string | null
          buyer_success_rate?: number | null
          created_at?: string | null
          deals_sealed_count?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          rating?: number | null
          rating_count?: number | null
          seller_success_rate?: number | null
          location_lat?: number | null
          location_lng?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          listing_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          role: string
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          listing_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          role: string
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string | null
          id: string
          query: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          query: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query?: string
          user_id?: string | null
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string | null
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      listing_bid_stats: {
        Row: {
          bid_count: number | null
          high_bid: number | null
          high_bidder_id: string | null
          listing_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          asked_price: number | null
          auction_mode: string | null
          bid_count: number | null
          category: string | null
          condition: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          ends_at: string | null
          go_live_at: string | null
          high_bid: number | null
          high_bidder_id: string | null
          id: string | null
          images: string[] | null
          search_vector: unknown
          seller_avatar: string | null
          seller_id: string | null
          seller_location: string | null
          seller_name: string | null
          seller_rating: number | null
          seller_rating_count: number | null
          slug: string | null
          status: string | null
          title: string | null
          location_lat: number | null
          location_lng: number | null
          location_address: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_expired_bids: { Args: never; Returns: undefined }
      edit_listing_with_cooldown: {
        Args: {
          p_listing_id: string
          p_title: string
          p_description: string
          p_category: string
          p_asked_price: number
          p_contact_phone: string
          p_auction_mode: string
          p_images: string[]
          p_condition: string
          p_ends_at: string
          p_listing_duration?: number
        }
        Returns: string
      }
      expire_old_bids: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
