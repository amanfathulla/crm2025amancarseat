export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          id: string
          last_activity: string
          token: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at: string
          id?: string
          last_activity?: string
          token: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_activity?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
          password: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      billplz_settings: {
        Row: {
          api_key: string
          collection_id: string
          id: string
          updated_at: string
          x_signature_key: string
        }
        Insert: {
          api_key?: string
          collection_id?: string
          id?: string
          updated_at?: string
          x_signature_key?: string
        }
        Update: {
          api_key?: string
          collection_id?: string
          id?: string
          updated_at?: string
          x_signature_key?: string
        }
        Relationships: []
      }
      category_settings: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_amount: number
          discount_type: string
          id: string
          is_active: boolean
          updated_at: string | null
          usage_count: number
          usage_limit: number
          valid_from: string
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_amount?: number
          discount_type?: string
          id?: string
          is_active?: boolean
          updated_at?: string | null
          usage_count?: number
          usage_limit?: number
          valid_from?: string
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_amount?: number
          discount_type?: string
          id?: string
          is_active?: boolean
          updated_at?: string | null
          usage_count?: number
          usage_limit?: number
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          car_model: string | null
          city: string | null
          created_at: string | null
          email: string
          gross_profit: number | null
          id: string
          name: string
          order_date: string | null
          order_number: number | null
          order_status: string
          order_time: string | null
          paid_amount: number | null
          payment_source: string | null
          phone: string | null
          product: string | null
          product_variation: string | null
          sales_amount: number | null
          state: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          car_model?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          gross_profit?: number | null
          id?: string
          name: string
          order_date?: string | null
          order_number?: number | null
          order_status?: string
          order_time?: string | null
          paid_amount?: number | null
          payment_source?: string | null
          phone?: string | null
          product?: string | null
          product_variation?: string | null
          sales_amount?: number | null
          state?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          car_model?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          gross_profit?: number | null
          id?: string
          name?: string
          order_date?: string | null
          order_number?: number | null
          order_status?: string
          order_time?: string | null
          paid_amount?: number | null
          payment_source?: string | null
          phone?: string | null
          product?: string | null
          product_variation?: string | null
          sales_amount?: number | null
          state?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          closed_at: string | null
          contacted_at: string | null
          created_at: string
          id: string
          name: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          contacted_at?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          contacted_at?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      marketing_content: {
        Row: {
          completed_at: string | null
          content_date: string
          content_time: string | null
          created_at: string | null
          description: string | null
          id: string
          media: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          content_date: string
          content_time?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          media?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          content_date?: string
          content_time?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          media?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_events: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_tasks: {
        Row: {
          completed: boolean
          created_at: string | null
          due_date: string
          id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string | null
          due_date: string
          id?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string | null
          due_date?: string
          id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          price: number
          product_id: string | null
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          price: number
          product_id?: string | null
          quantity: number
          subtotal: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          price?: number
          product_id?: string | null
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          cost: number
          created_at: string | null
          id: string
          inventory: number | null
          name: string
          price: number
          product_id: string
        }
        Insert: {
          cost?: number
          created_at?: string | null
          id?: string
          inventory?: number | null
          name: string
          price: number
          product_id: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          id?: string
          inventory?: number | null
          name?: string
          price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          inventory: number | null
          name: string
          price: number
          sales: number | null
          sku: string | null
          status: string | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          inventory?: number | null
          name: string
          price: number
          sales?: number | null
          sku?: string | null
          status?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          inventory?: number | null
          name?: string
          price?: number
          sales?: number | null
          sku?: string | null
          status?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      sales_records: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      shipping_settings: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean
          sabah_sarawak_cost: number
          semenanjung_cost: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          sabah_sarawak_cost?: number
          semenanjung_cost?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          sabah_sarawak_cost?: number
          semenanjung_cost?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      telegram_settings: {
        Row: {
          bot_token: string
          chat_id: string
          created_at: string | null
          id: string
          is_enabled: boolean
          notify_new_order: boolean
          updated_at: string | null
        }
        Insert: {
          bot_token?: string
          chat_id?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          notify_new_order?: boolean
          updated_at?: string | null
        }
        Update: {
          bot_token?: string
          chat_id?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          notify_new_order?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      yearly_sales: {
        Row: {
          created_at: string | null
          id: string
          quarter_1: number
          quarter_2: number
          quarter_3: number
          quarter_4: number
          total_profit: number
          total_revenue: number
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          quarter_1: number
          quarter_2: number
          quarter_3: number
          quarter_4: number
          total_profit?: number
          total_revenue: number
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          quarter_1?: number
          quarter_2?: number
          quarter_3?: number
          quarter_4?: number
          total_profit?: number
          total_revenue?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      public_product_variations: {
        Row: {
          created_at: string | null
          id: string | null
          inventory: number | null
          name: string | null
          price: number | null
          product_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          inventory?: number | null
          name?: string | null
          price?: number | null
          product_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          inventory?: number | null
          name?: string | null
          price?: number | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      public_products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          image_urls: string[] | null
          inventory: number | null
          name: string | null
          price: number | null
          sales: number | null
          sku: string | null
          status: string | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          image_urls?: string[] | null
          inventory?: number | null
          name?: string | null
          price?: number | null
          sales?: number | null
          sku?: string | null
          status?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          image_urls?: string[] | null
          inventory?: number | null
          name?: string | null
          price?: number | null
          sales?: number | null
          sku?: string | null
          status?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_admin_password:
        | { Args: { email: string; password: string }; Returns: string }
        | {
            Args: { email: string; p_user_agent?: string; password: string }
            Returns: string
          }
      create_admin_session: {
        Args: { p_admin_id: string; p_user_agent?: string }
        Returns: string
      }
      increment_coupon_usage: { Args: { p_code: string }; Returns: undefined }
      invalidate_admin_session: {
        Args: { p_token: string }
        Returns: undefined
      }
      is_valid_admin_session: { Args: never; Returns: boolean }
      update_admin_email: {
        Args: { p_admin_id: string; p_new_email: string; p_password: string }
        Returns: boolean
      }
      update_admin_password: {
        Args: {
          p_admin_id: string
          p_current_password: string
          p_new_password: string
        }
        Returns: boolean
      }
      validate_admin_session: { Args: { p_token: string }; Returns: string }
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
