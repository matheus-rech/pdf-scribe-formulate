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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_reviews: {
        Row: {
          confidence_score: number
          created_at: string
          extracted_value: string | null
          extraction_id: string
          field_name: string
          id: string
          processing_time_ms: number | null
          reasoning: string | null
          reviewer_config_id: string
          source_page: number | null
          source_section: string | null
          source_text: string | null
        }
        Insert: {
          confidence_score: number
          created_at?: string
          extracted_value?: string | null
          extraction_id: string
          field_name: string
          id?: string
          processing_time_ms?: number | null
          reasoning?: string | null
          reviewer_config_id: string
          source_page?: number | null
          source_section?: string | null
          source_text?: string | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          extracted_value?: string | null
          extraction_id?: string
          field_name?: string
          id?: string
          processing_time_ms?: number | null
          reasoning?: string | null
          reviewer_config_id?: string
          source_page?: number | null
          source_section?: string | null
          source_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_reviews_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_reviews_reviewer_config_id_fkey"
            columns: ["reviewer_config_id"]
            isOneToOne: false
            referencedRelation: "reviewer_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_consensus: {
        Row: {
          agreeing_reviewers: number
          agreement_level: number
          conflict_detected: boolean
          conflict_types: Database["public"]["Enums"]["conflict_type"][] | null
          consensus_value: string | null
          created_at: string
          extraction_id: string
          field_name: string
          human_resolution_notes: string | null
          human_resolved_at: string | null
          human_resolved_by: string | null
          human_resolved_value: string | null
          human_review_status:
            | Database["public"]["Enums"]["review_status"]
            | null
          id: string
          requires_human_review: boolean
          total_reviewers: number
          updated_at: string
        }
        Insert: {
          agreeing_reviewers: number
          agreement_level: number
          conflict_detected?: boolean
          conflict_types?: Database["public"]["Enums"]["conflict_type"][] | null
          consensus_value?: string | null
          created_at?: string
          extraction_id: string
          field_name: string
          human_resolution_notes?: string | null
          human_resolved_at?: string | null
          human_resolved_by?: string | null
          human_resolved_value?: string | null
          human_review_status?:
            | Database["public"]["Enums"]["review_status"]
            | null
          id?: string
          requires_human_review?: boolean
          total_reviewers: number
          updated_at?: string
        }
        Update: {
          agreeing_reviewers?: number
          agreement_level?: number
          conflict_detected?: boolean
          conflict_types?: Database["public"]["Enums"]["conflict_type"][] | null
          consensus_value?: string | null
          created_at?: string
          extraction_id?: string
          field_name?: string
          human_resolution_notes?: string | null
          human_resolved_at?: string | null
          human_resolved_by?: string | null
          human_resolved_value?: string | null
          human_review_status?:
            | Database["public"]["Enums"]["review_status"]
            | null
          id?: string
          requires_human_review?: boolean
          total_reviewers?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_consensus_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      extractions: {
        Row: {
          confidence_score: number | null
          coordinates: Json | null
          created_at: string
          extraction_id: string
          field_name: string
          id: string
          image_data: string | null
          method: string | null
          page: number | null
          region: Json | null
          source_citations: Json | null
          study_id: string
          text: string | null
          timestamp: string | null
          validation_status: string | null
        }
        Insert: {
          confidence_score?: number | null
          coordinates?: Json | null
          created_at?: string
          extraction_id: string
          field_name: string
          id?: string
          image_data?: string | null
          method?: string | null
          page?: number | null
          region?: Json | null
          source_citations?: Json | null
          study_id: string
          text?: string | null
          timestamp?: string | null
          validation_status?: string | null
        }
        Update: {
          confidence_score?: number | null
          coordinates?: Json | null
          created_at?: string
          extraction_id?: string
          field_name?: string
          id?: string
          image_data?: string | null
          method?: string | null
          page?: number | null
          region?: Json | null
          source_citations?: Json | null
          study_id?: string
          text?: string | null
          timestamp?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extractions_project_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      reviewer_configs: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          model: Database["public"]["Enums"]["ai_provider"]
          name: string
          priority: number
          prompt_strategy: Database["public"]["Enums"]["review_strategy"]
          system_prompt: string
          temperature: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          model: Database["public"]["Enums"]["ai_provider"]
          name: string
          priority?: number
          prompt_strategy: Database["public"]["Enums"]["review_strategy"]
          system_prompt: string
          temperature?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          model?: Database["public"]["Enums"]["ai_provider"]
          name?: string
          priority?: number
          prompt_strategy?: Database["public"]["Enums"]["review_strategy"]
          system_prompt?: string
          temperature?: number
          updated_at?: string
        }
        Relationships: []
      }
      studies: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          pdf_chunks: Json | null
          pdf_name: string | null
          pdf_url: string | null
          total_pages: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          pdf_chunks?: Json | null
          pdf_name?: string | null
          pdf_url?: string | null
          total_pages?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          pdf_chunks?: Json | null
          pdf_name?: string | null
          pdf_url?: string | null
          total_pages?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_provider:
        | "google/gemini-2.5-pro"
        | "google/gemini-2.5-flash"
        | "google/gemini-2.5-flash-lite"
        | "openai/gpt-5"
        | "openai/gpt-5-mini"
        | "openai/gpt-5-nano"
      conflict_type:
        | "value_disagreement"
        | "confidence_variance"
        | "split_vote"
        | "outlier_detected"
      review_status: "pending" | "in_progress" | "resolved" | "escalated"
      review_strategy: "conservative" | "balanced" | "comprehensive" | "fast"
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
      ai_provider: [
        "google/gemini-2.5-pro",
        "google/gemini-2.5-flash",
        "google/gemini-2.5-flash-lite",
        "openai/gpt-5",
        "openai/gpt-5-mini",
        "openai/gpt-5-nano",
      ],
      conflict_type: [
        "value_disagreement",
        "confidence_variance",
        "split_vote",
        "outlier_detected",
      ],
      review_status: ["pending", "in_progress", "resolved", "escalated"],
      review_strategy: ["conservative", "balanced", "comprehensive", "fast"],
    },
  },
} as const
