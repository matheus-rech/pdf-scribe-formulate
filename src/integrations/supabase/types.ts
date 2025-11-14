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
      ab_test_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          extracted_value: string | null
          extraction_id: string
          field_name: string
          field_type: Database["public"]["Enums"]["field_type"]
          human_verified: boolean
          human_verified_at: string | null
          human_verified_by: string | null
          id: string
          processing_time_ms: number | null
          test_id: string
          variant_id: string
          was_correct: boolean | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          extracted_value?: string | null
          extraction_id: string
          field_name: string
          field_type: Database["public"]["Enums"]["field_type"]
          human_verified?: boolean
          human_verified_at?: string | null
          human_verified_by?: string | null
          id?: string
          processing_time_ms?: number | null
          test_id: string
          variant_id: string
          was_correct?: boolean | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          extracted_value?: string | null
          extraction_id?: string
          field_name?: string
          field_type?: Database["public"]["Enums"]["field_type"]
          human_verified?: boolean
          human_verified_at?: string | null
          human_verified_by?: string | null
          id?: string
          processing_time_ms?: number | null
          test_id?: string
          variant_id?: string
          was_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_results_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_test_stats: {
        Row: {
          accuracy_rate: number | null
          agreement_rate: number | null
          avg_confidence: number | null
          avg_cost: number | null
          avg_processing_time_ms: number | null
          id: string
          is_significant: boolean
          sample_size: number
          statistical_significance: number | null
          test_id: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          accuracy_rate?: number | null
          agreement_rate?: number | null
          avg_confidence?: number | null
          avg_cost?: number | null
          avg_processing_time_ms?: number | null
          id?: string
          is_significant?: boolean
          sample_size?: number
          statistical_significance?: number | null
          test_id: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          accuracy_rate?: number | null
          agreement_rate?: number | null
          avg_confidence?: number | null
          avg_cost?: number | null
          avg_processing_time_ms?: number | null
          id?: string
          is_significant?: boolean
          sample_size?: number
          statistical_significance?: number | null
          test_id?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_stats_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_stats_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_test_variants: {
        Row: {
          created_at: string
          custom_parameters: Json | null
          id: string
          is_control: boolean
          max_tokens: number | null
          model: string
          prompt_template_id: string | null
          reasoning_effort: string | null
          seed: number | null
          temperature: number | null
          test_id: string
          traffic_allocation: number
          variant_name: string
        }
        Insert: {
          created_at?: string
          custom_parameters?: Json | null
          id?: string
          is_control?: boolean
          max_tokens?: number | null
          model: string
          prompt_template_id?: string | null
          reasoning_effort?: string | null
          seed?: number | null
          temperature?: number | null
          test_id: string
          traffic_allocation?: number
          variant_name: string
        }
        Update: {
          created_at?: string
          custom_parameters?: Json | null
          id?: string
          is_control?: boolean
          max_tokens?: number | null
          model?: string
          prompt_template_id?: string | null
          reasoning_effort?: string | null
          seed?: number | null
          temperature?: number | null
          test_id?: string
          traffic_allocation?: number
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_variants_prompt_template_id_fkey"
            columns: ["prompt_template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_variants_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          completed_at: string | null
          confidence_level: number
          created_at: string
          description: string | null
          field_types: Database["public"]["Enums"]["field_type"][]
          id: string
          min_sample_size: number
          name: string
          primary_metric: Database["public"]["Enums"]["test_metric"]
          started_at: string | null
          status: Database["public"]["Enums"]["ab_test_status"]
          traffic_split: number
          updated_at: string
          user_id: string
          winner_variant: string | null
        }
        Insert: {
          completed_at?: string | null
          confidence_level?: number
          created_at?: string
          description?: string | null
          field_types: Database["public"]["Enums"]["field_type"][]
          id?: string
          min_sample_size?: number
          name: string
          primary_metric?: Database["public"]["Enums"]["test_metric"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["ab_test_status"]
          traffic_split?: number
          updated_at?: string
          user_id: string
          winner_variant?: string | null
        }
        Update: {
          completed_at?: string | null
          confidence_level?: number
          created_at?: string
          description?: string | null
          field_types?: Database["public"]["Enums"]["field_type"][]
          id?: string
          min_sample_size?: number
          name?: string
          primary_metric?: Database["public"]["Enums"]["test_metric"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["ab_test_status"]
          traffic_split?: number
          updated_at?: string
          user_id?: string
          winner_variant?: string | null
        }
        Relationships: []
      }
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
      extraction_settings: {
        Row: {
          auto_accept_high_concordance: boolean
          auto_select_model: boolean
          created_at: string
          default_reviewers: number
          high_concordance_threshold_even: number
          high_concordance_threshold_odd: number
          id: string
          max_reviewers: number
          min_reviewers: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_accept_high_concordance?: boolean
          auto_select_model?: boolean
          created_at?: string
          default_reviewers?: number
          high_concordance_threshold_even?: number
          high_concordance_threshold_odd?: number
          id?: string
          max_reviewers?: number
          min_reviewers?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_accept_high_concordance?: boolean
          auto_select_model?: boolean
          created_at?: string
          default_reviewers?: number
          high_concordance_threshold_even?: number
          high_concordance_threshold_odd?: number
          id?: string
          max_reviewers?: number
          min_reviewers?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
      model_field_accuracy: {
        Row: {
          accuracy_rate: number | null
          created_at: string
          field_type: Database["public"]["Enums"]["field_type"]
          id: string
          last_updated: string
          model: string
          successful_extractions: number
          total_extractions: number
          user_id: string
        }
        Insert: {
          accuracy_rate?: number | null
          created_at?: string
          field_type: Database["public"]["Enums"]["field_type"]
          id?: string
          last_updated?: string
          model: string
          successful_extractions?: number
          total_extractions?: number
          user_id: string
        }
        Update: {
          accuracy_rate?: number | null
          created_at?: string
          field_type?: Database["public"]["Enums"]["field_type"]
          id?: string
          last_updated?: string
          model?: string
          successful_extractions?: number
          total_extractions?: number
          user_id?: string
        }
        Relationships: []
      }
      pdf_annotations: {
        Row: {
          content: string | null
          created_at: string
          id: string
          page_number: number
          study_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          page_number: number
          study_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          page_number?: number
          study_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_figures: {
        Row: {
          ai_enhanced: boolean | null
          bbox_height: number | null
          bbox_width: number | null
          caption: string | null
          color_space: number | null
          created_at: string
          data_length: number | null
          data_url: string
          extraction_method: string
          figure_id: string
          has_alpha: boolean | null
          height: number
          id: string
          page_number: number
          study_id: string
          updated_at: string
          user_id: string
          width: number
          x: number | null
          y: number | null
        }
        Insert: {
          ai_enhanced?: boolean | null
          bbox_height?: number | null
          bbox_width?: number | null
          caption?: string | null
          color_space?: number | null
          created_at?: string
          data_length?: number | null
          data_url: string
          extraction_method: string
          figure_id: string
          has_alpha?: boolean | null
          height: number
          id?: string
          page_number: number
          study_id: string
          updated_at?: string
          user_id: string
          width: number
          x?: number | null
          y?: number | null
        }
        Update: {
          ai_enhanced?: boolean | null
          bbox_height?: number | null
          bbox_width?: number | null
          caption?: string | null
          color_space?: number | null
          created_at?: string
          data_length?: number | null
          data_url?: string
          extraction_method?: string
          figure_id?: string
          has_alpha?: boolean | null
          height?: number
          id?: string
          page_number?: number
          study_id?: string
          updated_at?: string
          user_id?: string
          width?: number
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_figures_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_tables: {
        Row: {
          ai_enhanced: boolean | null
          bbox_height: number | null
          bbox_width: number | null
          caption: string | null
          column_count: number
          column_positions: Json | null
          confidence_score: number | null
          created_at: string | null
          extraction_method: string
          headers: Json
          id: string
          page_number: number
          row_count: number
          rows: Json
          study_id: string
          table_id: string
          title: string | null
          updated_at: string | null
          user_id: string
          x: number | null
          y: number | null
        }
        Insert: {
          ai_enhanced?: boolean | null
          bbox_height?: number | null
          bbox_width?: number | null
          caption?: string | null
          column_count: number
          column_positions?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          extraction_method: string
          headers: Json
          id?: string
          page_number: number
          row_count: number
          rows: Json
          study_id: string
          table_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
          x?: number | null
          y?: number | null
        }
        Update: {
          ai_enhanced?: boolean | null
          bbox_height?: number | null
          bbox_width?: number | null
          caption?: string | null
          column_count?: number
          column_positions?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          extraction_method?: string
          headers?: Json
          id?: string
          page_number?: number
          row_count?: number
          rows?: Json
          study_id?: string
          table_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_tables_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_text_chunks: {
        Row: {
          char_end: number
          char_start: number
          chunk_index: number
          created_at: string | null
          font_name: string | null
          font_size: number | null
          height: number
          id: string
          is_bold: boolean | null
          is_heading: boolean | null
          page_number: number
          section_name: string | null
          sentence_count: number
          study_id: string
          text: string
          user_id: string
          width: number
          x: number
          y: number
        }
        Insert: {
          char_end: number
          char_start: number
          chunk_index: number
          created_at?: string | null
          font_name?: string | null
          font_size?: number | null
          height: number
          id?: string
          is_bold?: boolean | null
          is_heading?: boolean | null
          page_number: number
          section_name?: string | null
          sentence_count?: number
          study_id: string
          text: string
          user_id: string
          width: number
          x: number
          y: number
        }
        Update: {
          char_end?: number
          char_start?: number
          chunk_index?: number
          created_at?: string | null
          font_name?: string | null
          font_size?: number | null
          height?: number
          id?: string
          is_bold?: boolean | null
          is_heading?: boolean | null
          page_number?: number
          section_name?: string | null
          sentence_count?: number
          study_id?: string
          text?: string
          user_id?: string
          width?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "pdf_text_chunks_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          created_at: string
          extraction_prompt: string
          field_specific_instructions: Json | null
          id: string
          is_default: boolean
          model_provider: string
          system_prompt: string
          template_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extraction_prompt: string
          field_specific_instructions?: Json | null
          id?: string
          is_default?: boolean
          model_provider: string
          system_prompt: string
          template_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extraction_prompt?: string
          field_specific_instructions?: Json | null
          id?: string
          is_default?: boolean
          model_provider?: string
          system_prompt?: string
          template_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviewer_configs: {
        Row: {
          created_at: string
          custom_parameters: Json | null
          enabled: boolean
          id: string
          max_tokens: number | null
          model: Database["public"]["Enums"]["ai_provider"]
          name: string
          priority: number
          prompt_strategy: Database["public"]["Enums"]["review_strategy"]
          reasoning_effort: string | null
          seed: number | null
          system_prompt: string
          temperature: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_parameters?: Json | null
          enabled?: boolean
          id?: string
          max_tokens?: number | null
          model: Database["public"]["Enums"]["ai_provider"]
          name: string
          priority?: number
          prompt_strategy: Database["public"]["Enums"]["review_strategy"]
          reasoning_effort?: string | null
          seed?: number | null
          system_prompt: string
          temperature?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_parameters?: Json | null
          enabled?: boolean
          id?: string
          max_tokens?: number | null
          model?: Database["public"]["Enums"]["ai_provider"]
          name?: string
          priority?: number
          prompt_strategy?: Database["public"]["Enums"]["review_strategy"]
          reasoning_effort?: string | null
          seed?: number | null
          system_prompt?: string
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studies: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          page_annotations: Json | null
          pdf_chunks: Json | null
          pdf_name: string | null
          pdf_url: string | null
          total_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          page_annotations?: Json | null
          pdf_chunks?: Json | null
          pdf_name?: string | null
          pdf_url?: string | null
          total_pages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          page_annotations?: Json | null
          pdf_chunks?: Json | null
          pdf_name?: string | null
          pdf_url?: string | null
          total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_extractions: {
        Row: {
          annotations: Json | null
          created_at: string
          data: Json
          id: string
          study_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annotations?: Json | null
          created_at?: string
          data?: Json
          id?: string
          study_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annotations?: Json | null
          created_at?: string
          data?: Json
          id?: string
          study_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_ab_test_significance: {
        Args: { p_test_id: string }
        Returns: {
          is_significant: boolean
          p_value: number
          sample_size: number
          success_rate: number
          variant_id: string
          variant_name: string
          z_score: number
        }[]
      }
      create_default_reviewers_for_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      get_best_model_for_field: {
        Args: {
          p_field_type: Database["public"]["Enums"]["field_type"]
          p_min_extractions?: number
          p_user_id: string
        }
        Returns: {
          accuracy_rate: number
          model: string
        }[]
      }
      update_ab_test_statistics: {
        Args: { p_test_id: string }
        Returns: undefined
      }
    }
    Enums: {
      ab_test_status:
        | "draft"
        | "running"
        | "paused"
        | "completed"
        | "winner_selected"
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
      field_type:
        | "population"
        | "intervention"
        | "comparator"
        | "outcomes"
        | "study_design"
        | "sample_size"
        | "duration"
        | "setting"
        | "results"
        | "conclusions"
        | "other"
      review_status: "pending" | "in_progress" | "resolved" | "escalated"
      review_strategy: "conservative" | "balanced" | "comprehensive" | "fast"
      test_metric:
        | "accuracy"
        | "confidence"
        | "speed"
        | "cost"
        | "agreement_rate"
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
      ab_test_status: [
        "draft",
        "running",
        "paused",
        "completed",
        "winner_selected",
      ],
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
      field_type: [
        "population",
        "intervention",
        "comparator",
        "outcomes",
        "study_design",
        "sample_size",
        "duration",
        "setting",
        "results",
        "conclusions",
        "other",
      ],
      review_status: ["pending", "in_progress", "resolved", "escalated"],
      review_strategy: ["conservative", "balanced", "comprehensive", "fast"],
      test_metric: [
        "accuracy",
        "confidence",
        "speed",
        "cost",
        "agreement_rate",
      ],
    },
  },
} as const
