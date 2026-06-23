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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      approval_audit_log: {
        Row: {
          assigned_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["approval_status"]
          pending_approval_id: string
          performed_by: string | null
          performed_by_name: string | null
          previous_status: Database["public"]["Enums"]["approval_status"] | null
          target_email: string
          target_user_id: string
        }
        Insert: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["approval_status"]
          pending_approval_id: string
          performed_by?: string | null
          performed_by_name?: string | null
          previous_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          target_email: string
          target_user_id: string
        }
        Update: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["approval_status"]
          pending_approval_id?: string
          performed_by?: string | null
          performed_by_name?: string | null
          previous_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          target_email?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_audit_log_pending_approval_id_fkey"
            columns: ["pending_approval_id"]
            isOneToOne: false
            referencedRelation: "pending_approvals"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_comments: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          incident_id: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          incident_id: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_delegations: {
        Row: {
          accepted_at: string | null
          completed_at: string | null
          created_at: string
          declined_at: string | null
          delegated_by: string
          delegated_to: string
          delegated_to_name: string | null
          due_date: string | null
          id: string
          incident_id: string
          is_read: boolean
          read_at: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          declined_at?: string | null
          delegated_by: string
          delegated_to: string
          delegated_to_name?: string | null
          due_date?: string | null
          id?: string
          incident_id: string
          is_read?: boolean
          read_at?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          declined_at?: string | null
          delegated_by?: string
          delegated_to?: string
          delegated_to_name?: string | null
          due_date?: string | null
          id?: string
          incident_id?: string
          is_read?: boolean
          read_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_delegations_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          coordinator: string
          created_at: string
          description: string
          id: string
          image_urls: string[]
          incident_mode: string
          needs_follow_up: boolean
          problem_type: string
          resolved: boolean
          resolved_at: string | null
          solution: string
          teacher_name: string
          under_analysis: boolean
          urgency: string
        }
        Insert: {
          coordinator: string
          created_at?: string
          description: string
          id?: string
          image_urls?: string[]
          incident_mode?: string
          needs_follow_up?: boolean
          problem_type: string
          resolved?: boolean
          resolved_at?: string | null
          solution?: string
          teacher_name: string
          under_analysis?: boolean
          urgency: string
        }
        Update: {
          coordinator?: string
          created_at?: string
          description?: string
          id?: string
          image_urls?: string[]
          incident_mode?: string
          needs_follow_up?: boolean
          problem_type?: string
          resolved?: boolean
          resolved_at?: string | null
          solution?: string
          teacher_name?: string
          under_analysis?: boolean
          urgency?: string
        }
        Relationships: []
      }
      mes_analise_alert_reads: {
        Row: {
          alert_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          alert_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mes_analise_alert_reads_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "mes_analise_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      mes_analise_alerts: {
        Row: {
          breakdown: Json
          canonical_name: string
          created_at: string
          id: string
          level: string
          total_count: number
          variations: Json
        }
        Insert: {
          breakdown?: Json
          canonical_name: string
          created_at?: string
          id?: string
          level: string
          total_count: number
          variations?: Json
        }
        Update: {
          breakdown?: Json
          canonical_name?: string
          created_at?: string
          id?: string
          level?: string
          total_count?: number
          variations?: Json
        }
        Relationships: []
      }
      pending_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          status: Database["public"]["Enums"]["approval_status"]
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_sign_in_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_sign_in_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_sign_in_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      teacher_folder_members: {
        Row: {
          added_by: string | null
          created_at: string
          folder_id: string
          teacher_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          folder_id: string
          teacher_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          folder_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_folder_members_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "teacher_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_folder_members_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_folders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_meetings: {
        Row: {
          coordinator_id: string | null
          coordinator_name: string
          created_at: string
          id: string
          meeting_date: string
          notes: string | null
          teacher_id: string
        }
        Insert: {
          coordinator_id?: string | null
          coordinator_name: string
          created_at?: string
          id?: string
          meeting_date?: string
          notes?: string | null
          teacher_id: string
        }
        Update: {
          coordinator_id?: string | null
          coordinator_name?: string
          created_at?: string
          id?: string
          meeting_date?: string
          notes?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_meetings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          id: string
          teacher_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          teacher_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_recurrences: {
        Row: {
          created_at: string
          id: string
          incident_id: string | null
          occurred_at: string
          source: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id?: string | null
          occurred_at?: string
          source: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string | null
          occurred_at?: string
          source?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_recurrences_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_recurrences_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_tracking: {
        Row: {
          created_at: string
          first_message_date: string | null
          first_message_sent: boolean
          forwarded_to_coordination: boolean
          forwarded_to_coordination_date: string | null
          id: string
          last_recurrence_at: string | null
          message_stage: number
          next_message_due: string | null
          problem_resolved: boolean
          recurrence_count: number
          resolved_at: string | null
          second_message_date: string | null
          second_message_sent: boolean
          teacher_name: string
          third_message_date: string | null
          third_message_sent: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_message_date?: string | null
          first_message_sent?: boolean
          forwarded_to_coordination?: boolean
          forwarded_to_coordination_date?: string | null
          id?: string
          last_recurrence_at?: string | null
          message_stage?: number
          next_message_due?: string | null
          problem_resolved?: boolean
          recurrence_count?: number
          resolved_at?: string | null
          second_message_date?: string | null
          second_message_sent?: boolean
          teacher_name: string
          third_message_date?: string | null
          third_message_sent?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_message_date?: string | null
          first_message_sent?: boolean
          forwarded_to_coordination?: boolean
          forwarded_to_coordination_date?: string | null
          id?: string
          last_recurrence_at?: string | null
          message_stage?: number
          next_message_due?: string | null
          problem_resolved?: boolean
          recurrence_count?: number
          resolved_at?: string | null
          second_message_date?: string | null
          second_message_sent?: boolean
          teacher_name?: string
          third_message_date?: string | null
          third_message_sent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      approved_users: {
        Row: {
          display_name: string | null
          email: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_pending_user: {
        Args: {
          _display_name: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      last_week_of_month: { Args: { _ref: string }; Returns: string }
      reject_pending_user: { Args: { _user_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "coordenacao" | "suporte" | "suporte_aluno"
      approval_status: "pending" | "approved" | "rejected"
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
      app_role: ["coordenacao", "suporte", "suporte_aluno"],
      approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
