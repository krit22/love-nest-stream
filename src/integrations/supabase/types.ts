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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      couples: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          content: string
          couple_id: string
          created_at: string
          entry_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          couple_id: string
          created_at?: string
          entry_date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          couple_id?: string
          created_at?: string
          entry_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      game_results: {
        Row: {
          couple_id: string
          created_at: string
          game: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          game: string
          id?: string
          payload?: Json
          user_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          game?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          couple_id: string | null
          created_at: string
          expires_at: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          couple_id?: string | null
          created_at?: string
          expires_at?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          couple_id?: string | null
          created_at?: string
          expires_at?: string
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          caption: string | null
          couple_id: string
          created_at: string
          diary_entry_id: string | null
          duration_seconds: number | null
          id: string
          kind: string
          tag: string | null
          url: string
          user_id: string
          vault_category: string | null
        }
        Insert: {
          caption?: string | null
          couple_id: string
          created_at?: string
          diary_entry_id?: string | null
          duration_seconds?: number | null
          id?: string
          kind: string
          tag?: string | null
          url: string
          user_id: string
          vault_category?: string | null
        }
        Update: {
          caption?: string | null
          couple_id?: string
          created_at?: string
          diary_entry_id?: string | null
          duration_seconds?: number | null
          id?: string
          kind?: string
          tag?: string | null
          url?: string
          user_id?: string
          vault_category?: string | null
        }
        Relationships: []
      }
      moods: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          mood: string
          mood_date: string
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          mood: string
          mood_date?: string
          user_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          mood?: string
          mood_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moods_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          couple_id: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          couple_id?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          couple_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_couple_fk"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          couple_id: string
          current_streak: number
          last_active_date: string | null
          updated_at: string
        }
        Insert: {
          couple_id: string
          current_streak?: number
          last_active_date?: string | null
          updated_at?: string
        }
        Update: {
          couple_id?: string
          current_streak?: number
          last_active_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: true
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_items: {
        Row: {
          category: string
          content: string | null
          couple_id: string
          created_at: string
          id: string
          kind: string
          url: string | null
          user_id: string
        }
        Insert: {
          category: string
          content?: string | null
          couple_id: string
          created_at?: string
          id?: string
          kind: string
          url?: string | null
          user_id: string
        }
        Update: {
          category?: string
          content?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          kind?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      virtual_dates: {
        Row: {
          couple_id: string
          created_at: string
          created_by: string
          date_type: string
          id: string
          notes: string | null
          recurrence: string | null
          scheduled_at: string
          title: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          created_by: string
          date_type?: string
          id?: string
          notes?: string | null
          recurrence?: string | null
          scheduled_at: string
          title: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          created_by?: string
          date_type?: string
          id?: string
          notes?: string | null
          recurrence?: string | null
          scheduled_at?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_streak: { Args: never; Returns: undefined }
      current_couple_id: { Args: never; Returns: string }
      join_partner: { Args: { p_code: string }; Returns: string }
      unlink_couple: { Args: never; Returns: undefined }
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
