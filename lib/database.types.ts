// B:\Projects\kejetia\lib\database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          student_id: string;
          avatar_url: string;
          bio: string;
          phone: string;
          location: string;
          role: "student" | "provider" | "admin";
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email?: string;
          student_id?: string;
          avatar_url?: string;
          bio?: string;
          phone?: string;
          location?: string;
          role?: "student" | "provider" | "admin";
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          email?: string;
          student_id?: string;
          avatar_url?: string;
          bio?: string;
          phone?: string;
          location?: string;
          role?: string;
          is_verified?: boolean;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          provider_id: string;
          title: string;
          description: string;
          category: string;
          price: number;
          images: string[];
          tags: string[];
          status: "pending" | "approved" | "rejected" | "archived";
          rejection_reason: string;
          avg_rating: number;
          total_reviews: number;
          total_bookings: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          title: string;
          description?: string;
          category?: string;
          price?: number;
          images?: string[];
          tags?: string[];
          status?: "pending" | "approved" | "rejected" | "archived";
          rejection_reason?: string;
          avg_rating?: number;
          total_reviews?: number;
          total_bookings?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          category?: string;
          price?: number;
          images?: string[];
          tags?: string[];
          status?: string;
          rejection_reason?: string;
          avg_rating?: number;
          total_reviews?: number;
          total_bookings?: number;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          service_id: string;
          student_id: string;
          provider_id: string;
          status:
            | "pending"
            | "confirmed"
            | "in_progress"
            | "completed"
            | "cancelled";
          booking_date: string | null;
          notes: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          student_id: string;
          provider_id: string;
          status?:
            | "pending"
            | "confirmed"
            | "in_progress"
            | "completed"
            | "cancelled";
          booking_date?: string | null;
          notes?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?:
            | "pending"
            | "confirmed"
            | "in_progress"
            | "completed"
            | "cancelled";
          booking_date?: string | null;
          notes?: string;
          amount?: number;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          reviewer_id: string;
          provider_id: string;
          service_id: string;
          rating: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          reviewer_id: string;
          provider_id: string;
          service_id: string;
          rating: number;
          comment?: string;
          created_at?: string;
        };
        Update: {
          rating?: number;
          comment?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string;
          title?: string;
          message?: string;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      saved_services: {
        Row: {
          id: string;
          student_id: string;
          service_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          service_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          service_id: string | null;
          reason: string;
          description: string;
          status: "open" | "investigating" | "resolved" | "dismissed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          service_id?: string | null;
          reason: string;
          description?: string;
          status?: "open" | "investigating" | "resolved" | "dismissed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
