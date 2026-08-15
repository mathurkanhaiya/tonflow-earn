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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievement_claims: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          tickets: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          tickets?: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          tickets?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_claims_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          achievement_type: string
          created_at: string
          enabled: boolean
          id: string
          key: string
          threshold: number
          tickets: number
          updated_at: string
        }
        Insert: {
          achievement_type: string
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          threshold: number
          tickets?: number
          updated_at?: string
        }
        Update: {
          achievement_type?: string
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          threshold?: number
          tickets?: number
          updated_at?: string
        }
        Relationships: []
      }
      ad_networks: {
        Row: {
          config: Json
          cooldown_seconds: number
          created_at: string
          daily_limit: number
          enabled: boolean
          id: string
          network: string
          reward_max: number
          reward_min: number
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          config?: Json
          cooldown_seconds?: number
          created_at?: string
          daily_limit?: number
          enabled?: boolean
          id?: string
          network: string
          reward_max?: number
          reward_min?: number
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          config?: Json
          cooldown_seconds?: number
          created_at?: string
          daily_limit?: number
          enabled?: boolean
          id?: string
          network?: string
          reward_max?: number
          reward_min?: number
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ad_views: {
        Row: {
          created_at: string
          id: string
          network: string
          nonce: string | null
          reward: number
          ticket_awarded: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          network: string
          nonce?: string | null
          reward?: number
          ticket_awarded?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          network?: string
          nonce?: string | null
          reward?: number
          ticket_awarded?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_logs: {
        Row: {
          action: string
          admin_telegram_id: number
          created_at: string
          id: string
          metadata: Json
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_telegram_id: number
          created_at?: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_telegram_id?: number
          created_at?: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_claims: {
        Row: {
          created_at: string
          id: string
          promo_code_id: string
          reward: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          promo_code_id: string
          reward?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          promo_code_id?: string
          reward?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_claims_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          enabled: boolean
          expires_at: string | null
          id: string
          per_user_limit: number
          reward: number
          updated_at: string
          usage_limit: number
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          enabled?: boolean
          expires_at?: string | null
          id?: string
          per_user_limit?: number
          reward?: number
          updated_at?: string
          usage_limit?: number
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          enabled?: boolean
          expires_at?: string | null
          id?: string
          per_user_limit?: number
          reward?: number
          updated_at?: string
          usage_limit?: number
          used_count?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_earned: number
          created_at: string
          fraud_flag: string | null
          id: string
          referred_id: string
          referrer_id: string
          reward_paid: number
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          commission_earned?: number
          created_at?: string
          fraud_flag?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          reward_paid?: number
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          commission_earned?: number
          created_at?: string
          fraud_flag?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_paid?: number
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
      spins: {
        Row: {
          created_at: string
          id: string
          is_jackpot: boolean
          reward: number
          segment_index: number
          spin_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_jackpot?: boolean
          reward?: number
          segment_index?: number
          spin_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_jackpot?: boolean
          reward?: number
          segment_index?: number
          spin_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          created_at: string
          id: string
          left_detected_at: string | null
          penalty_applied: boolean
          penalty_check_at: string | null
          reward: number
          status: string
          task_id: string
          user_id: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          left_detected_at?: string | null
          penalty_applied?: boolean
          penalty_check_at?: string | null
          reward?: number
          status?: string
          task_id: string
          user_id: string
          verified_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          left_detected_at?: string | null
          penalty_applied?: boolean
          penalty_check_at?: string | null
          reward?: number
          status?: string
          task_id?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          budget: number
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          is_publisher: boolean
          max_participants: number
          participants: number
          penalty_amount: number
          penalty_enabled: boolean
          penalty_hours: number
          publisher_user_id: string | null
          reject_reason: string | null
          reward: number
          spent: number
          status: string
          target_chat: string | null
          target_url: string | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          is_publisher?: boolean
          max_participants?: number
          participants?: number
          penalty_amount?: number
          penalty_enabled?: boolean
          penalty_hours?: number
          publisher_user_id?: string | null
          reject_reason?: string | null
          reward?: number
          spent?: number
          status?: string
          target_chat?: string | null
          target_url?: string | null
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          is_publisher?: boolean
          max_participants?: number
          participants?: number
          penalty_amount?: number
          penalty_enabled?: boolean
          penalty_hours?: number
          publisher_user_id?: string | null
          reject_reason?: string | null
          reward?: number
          spent?: number
          status?: string
          target_chat?: string | null
          target_url?: string | null
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_publisher_user_id_fkey"
            columns: ["publisher_user_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tonflow_users: {
        Row: {
          ads_watched: number
          balance: number
          created_at: string
          device_hash: string | null
          first_name: string | null
          id: string
          is_banned: boolean
          language: string
          language_chosen: boolean
          last_daily_reward_at: string | null
          last_free_spin_at: string | null
          last_name: string | null
          last_seen_at: string
          notifications_enabled: boolean
          photo_url: string | null
          referral_earned: number
          referral_verified: boolean
          referred_by: number | null
          spin_tickets: number
          tasks_completed: number
          telegram_id: number
          total_earned: number
          updated_at: string
          username: string | null
        }
        Insert: {
          ads_watched?: number
          balance?: number
          created_at?: string
          device_hash?: string | null
          first_name?: string | null
          id?: string
          is_banned?: boolean
          language?: string
          language_chosen?: boolean
          last_daily_reward_at?: string | null
          last_free_spin_at?: string | null
          last_name?: string | null
          last_seen_at?: string
          notifications_enabled?: boolean
          photo_url?: string | null
          referral_earned?: number
          referral_verified?: boolean
          referred_by?: number | null
          spin_tickets?: number
          tasks_completed?: number
          telegram_id: number
          total_earned?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          ads_watched?: number
          balance?: number
          created_at?: string
          device_hash?: string | null
          first_name?: string | null
          id?: string
          is_banned?: boolean
          language?: string
          language_chosen?: boolean
          last_daily_reward_at?: string | null
          last_free_spin_at?: string | null
          last_name?: string | null
          last_seen_at?: string
          notifications_enabled?: boolean
          photo_url?: string | null
          referral_earned?: number
          referral_verified?: boolean
          referred_by?: number | null
          spin_tickets?: number
          tasks_completed?: number
          telegram_id?: number
          total_earned?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          id: string
          key: string
          lang: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          lang: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          lang?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          fee: number
          id: string
          net_amount: number
          processed_at: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
          wallet: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          fee?: number
          id?: string
          net_amount: number
          processed_at?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          wallet: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          net_amount?: number
          processed_at?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          wallet?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tonflow_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_user: {
        Args: {
          _amount: number
          _description: string
          _metadata?: Json
          _type: string
          _user_id: string
        }
        Returns: number
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
