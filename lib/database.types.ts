export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          email: string
          full_name: string
          student_id: string | null
          avatar_url: string | null
          phone: string | null
          bio: string | null
          location: string | null
          roles: string[]
          active_role: Database["public"]["Enums"]["user_role_enum"]
          is_admin: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email: string
          full_name?: string
          student_id?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          location?: string | null
          roles?: string[]
          active_role?: Database["public"]["Enums"]["user_role_enum"]
          is_admin?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email?: string
          full_name?: string
          student_id?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          location?: string | null
          roles?: string[]
          active_role?: Database["public"]["Enums"]["user_role_enum"]
          is_admin?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          user_id: string
          program: string | null
          level: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          program?: string | null
          level?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          program?: string | null
          level?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      provider_profiles: {
        Row: {
          user_id: string
          headline: string | null
          momo_name: string | null
          momo_network: string | null
          momo_number: string | null
          available_days: string[]
          available_time: string | null
          avg_rating: number
          total_reviews: number
          total_bookings: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          headline?: string | null
          momo_name?: string | null
          momo_network?: string | null
          momo_number?: string | null
          available_days?: string[]
          available_time?: string | null
          avg_rating?: number
          total_reviews?: number
          total_bookings?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          headline?: string | null
          momo_name?: string | null
          momo_network?: string | null
          momo_number?: string | null
          available_days?: string[]
          available_time?: string | null
          avg_rating?: number
          total_reviews?: number
          total_bookings?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      services: {
        Row: {
          id: string
          provider_id: string
          title: string
          description: string
          category: string
          price: number
          pricing_type: string | null
          images: string[]
          tags: string[]
          status: Database["public"]["Enums"]["service_status_enum"]
          rejection_reason: string | null
          avg_rating: number
          total_reviews: number
          total_bookings: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          title: string
          description?: string
          category: string
          price?: number
          pricing_type?: string | null
          images?: string[]
          tags?: string[]
          status?: Database["public"]["Enums"]["service_status_enum"]
          rejection_reason?: string | null
          avg_rating?: number
          total_reviews?: number
          total_bookings?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          title?: string
          description?: string
          category?: string
          price?: number
          pricing_type?: string | null
          images?: string[]
          tags?: string[]
          status?: Database["public"]["Enums"]["service_status_enum"]
          rejection_reason?: string | null
          avg_rating?: number
          total_reviews?: number
          total_bookings?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bookings: {
        Row: {
          id: string
          service_id: string
          client_id: string
          provider_id: string
          appointment_date: string
          appointment_time: string
          base_amount: number
          total_amount: number
          payment_status: string
          payment_term: string
          notes: string | null
          status: Database["public"]["Enums"]["booking_status_enum"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          client_id: string
          provider_id: string
          appointment_date?: string
          appointment_time?: string
          base_amount?: number
          total_amount?: number
          payment_status?: string
          payment_term?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status_enum"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          client_id?: string
          provider_id?: string
          appointment_date?: string
          appointment_time?: string
          base_amount?: number
          total_amount?: number
          payment_status?: string
          payment_term?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status_enum"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          service_id: string
          provider_id: string
          reviewer_id: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          service_id: string
          provider_id: string
          reviewer_id: string
          rating: number
          comment?: string
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          service_id?: string
          provider_id?: string
          reviewer_id?: string
          rating?: number
          comment?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_services: {
        Row: {
          id: string
          student_id: string
          service_id: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          service_id: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          service_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_services_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saved_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string | null
          service_id: string | null
          reason: string
          description: string
          status: Database["public"]["Enums"]["report_status_enum"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id?: string | null
          service_id?: string | null
          reason: string
          description?: string
          status?: Database["public"]["Enums"]["report_status_enum"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string | null
          service_id?: string | null
          reason?: string
          description?: string
          status?: Database["public"]["Enums"]["report_status_enum"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          type: Database["public"]["Enums"]["conversation_type_enum"]
          booking_id: string | null
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          type?: Database["public"]["Enums"]["conversation_type_enum"]
          booking_id?: string | null
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          type?: Database["public"]["Enums"]["conversation_type_enum"]
          booking_id?: string | null
          last_message_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
          last_read_at: string | null
        }
        Insert: {
          conversation_id: string
          user_id: string
          last_read_at?: string | null
        }
        Update: {
          conversation_id?: string
          user_id?: string
          last_read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string | null
          attachments: string[]
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content?: string | null
          attachments?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string | null
          attachments?: string[]
          created_at?: string
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
            referencedColumns: ["user_id"]
          },
        ]
      }
      message_deletions: {
        Row: {
          message_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          message_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          message_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_deletions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_deletions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      get_or_create_direct_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      get_or_create_booking_conversation: {
        Args: { p_booking_id: string }
        Returns: string
      }
      get_conversation_previews: {
        Args: Record<string, never>
        Returns: {
          id: string
          type: "direct" | "booking"
          booking_id: string | null
          last_message_at: string
          other_user_id: string | null
          other_full_name: string | null
          other_avatar_url: string | null
          last_message_content: string | null
          last_message_attachments: string[] | null
          last_message_created_at: string | null
          last_message_sender_id: string | null
          unread_count: number
        }[]
      }
      get_platform_stats: {
        Args: Record<string, never>
        Returns: {
          active_users: number
          services_listed: number
          average_rating: number
          success_rate: number
        }[]
      }
      refresh_profile_roles: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_conversation_participant: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role_enum: "student" | "provider" | "admin"
      booking_status_enum:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      report_status_enum: "open" | "investigating" | "resolved" | "dismissed"
      service_status_enum: "pending" | "approved" | "rejected" | "archived"
      conversation_type_enum: "direct" | "booking"
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
    Enums: {
      user_role_enum: ["student", "provider", "admin"],
      booking_status_enum: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      report_status_enum: ["open", "investigating", "resolved", "dismissed"],
      service_status_enum: ["pending", "approved", "rejected", "archived"],
      conversation_type_enum: ["direct", "booking"],
    },
  },
} as const
