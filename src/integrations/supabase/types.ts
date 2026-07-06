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
      ads_spend: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          platform: string
          spend_date: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          platform?: string
          spend_date: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          platform?: string
          spend_date?: string
          updated_at?: string
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
      category_settings: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_enabled: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
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
          additional_notes: string | null
          address: string | null
          balance_amount: number | null
          car_model: string | null
          city: string | null
          created_at: string | null
          deposit_amount: number | null
          email: string
          gateway_bill_id: string | null
          gross_profit: number | null
          id: string
          name: string
          order_date: string | null
          order_number: number | null
          order_status: string
          order_time: string | null
          paid_amount: number | null
          payment_gateway: string | null
          payment_source: string | null
          payment_type: string | null
          phone: string | null
          product: string | null
          product_variation: string | null
          sales_amount: number | null
          seat_image_back: string | null
          seat_image_front: string | null
          seat_image_third_row: string | null
          state: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          additional_notes?: string | null
          address?: string | null
          balance_amount?: number | null
          car_model?: string | null
          city?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          email: string
          gateway_bill_id?: string | null
          gross_profit?: number | null
          id?: string
          name: string
          order_date?: string | null
          order_number?: number | null
          order_status?: string
          order_time?: string | null
          paid_amount?: number | null
          payment_gateway?: string | null
          payment_source?: string | null
          payment_type?: string | null
          phone?: string | null
          product?: string | null
          product_variation?: string | null
          sales_amount?: number | null
          seat_image_back?: string | null
          seat_image_front?: string | null
          seat_image_third_row?: string | null
          state?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          additional_notes?: string | null
          address?: string | null
          balance_amount?: number | null
          car_model?: string | null
          city?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          email?: string
          gateway_bill_id?: string | null
          gross_profit?: number | null
          id?: string
          name?: string
          order_date?: string | null
          order_number?: number | null
          order_status?: string
          order_time?: string | null
          paid_amount?: number | null
          payment_gateway?: string | null
          payment_source?: string | null
          payment_type?: string | null
          phone?: string | null
          product?: string | null
          product_variation?: string | null
          sales_amount?: number | null
          seat_image_back?: string | null
          seat_image_front?: string | null
          seat_image_third_row?: string | null
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
          car_model: string | null
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
          car_model?: string | null
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
          car_model?: string | null
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
            referencedRelation: "admin_products"
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
      page_views: {
        Row: {
          id: string
          material: string
          referrer: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          material: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          material?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          created_at: string
          credentials: Json
          display_name: string
          display_order: number
          id: string
          is_enabled: boolean
          provider: string
          sandbox_mode: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials?: Json
          display_name: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          provider: string
          sandbox_mode?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials?: Json
          display_name?: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          provider?: string
          sandbox_mode?: boolean
          updated_at?: string
        }
        Relationships: []
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
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
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
      public_dashboard_settings: {
        Row: {
          created_at: string
          expires_at: string
          hide_sensitive_costs: boolean
          id: string
          last_changed_at: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          hide_sensitive_costs?: boolean
          id?: string
          last_changed_at?: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          hide_sensitive_costs?: boolean
          id?: string
          last_changed_at?: string
          password_hash?: string
          updated_at?: string
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
      admin_product_variations: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string | null
          inventory: number | null
          name: string | null
          price: number | null
          product_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string | null
          inventory?: number | null
          name?: string | null
          price?: number | null
          product_id?: string | null
        }
        Update: {
          cost?: number | null
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
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
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
      admin_products: {
        Row: {
          category: string | null
          cost: number | null
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
          cost?: number | null
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
          cost?: number | null
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
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
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
      get_public_dashboard_status: { Args: never; Returns: Json }
      get_public_race_dash: { Args: { p_password: string }; Returns: Json }
      increment_coupon_usage: { Args: { p_code: string }; Returns: undefined }
      invalidate_admin_session: {
        Args: { p_token: string }
        Returns: undefined
      }
      is_valid_admin_session: { Args: never; Returns: boolean }
      recalculate_gross_profit_all: {
        Args: { p_only_zero?: boolean }
        Returns: number
      }
      resolve_product_cost: {
        Args: { p_product: string; p_variation: string }
        Returns: number
      }
      set_public_dashboard_hide_costs: {
        Args: { p_hide: boolean }
        Returns: boolean
      }
      set_public_dashboard_password: {
        Args: { p_password: string }
        Returns: Json
      }
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
      verify_public_dashboard_password: {
        Args: { p_password: string }
        Returns: Json
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
