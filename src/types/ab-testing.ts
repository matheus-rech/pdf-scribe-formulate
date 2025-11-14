// Type definitions for A/B Testing and Prompt Templates
// These extend the Supabase generated types

export interface PromptTemplate {
  id: string;
  user_id: string;
  model_provider: string;
  template_name: string;
  system_prompt: string;
  extraction_prompt: string;
  field_specific_instructions: Record<string, string>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ABTest {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  field_types: string[];
  primary_metric: string;
  min_sample_size: number;
  traffic_split: number;
  status: string;
  winner_variant: string | null;
  started_at: string | null;
  completed_at: string | null;
  confidence_level: number;
  created_at: string;
  updated_at: string;
}

export interface ABTestVariant {
  id: string;
  test_id: string;
  variant_name: string;
  model: string;
  temperature: number | null;
  max_tokens: number | null;
  prompt_template_id: string | null;
  is_control: boolean;
  traffic_allocation: number;
  reasoning_effort: string | null;
  seed: number | null;
  custom_parameters: Record<string, any> | null;
  created_at: string;
}

export interface ABTestStats {
  id: string;
  test_id: string;
  variant_id: string;
  sample_size: number;
  accuracy_rate: number | null;
  avg_confidence: number | null;
  avg_processing_time_ms: number | null;
  avg_cost: number | null;
  agreement_rate: number | null;
  statistical_significance: number | null;
  is_significant: boolean;
  updated_at: string;
}

export interface ABTestResult {
  id: string;
  test_id: string;
  variant_id: string;
  extraction_id: string;
  field_name: string;
  field_type: string;
  extracted_value: string | null;
  confidence_score: number | null;
  processing_time_ms: number | null;
  was_correct: boolean | null;
  human_verified: boolean;
  human_verified_by: string | null;
  human_verified_at: string | null;
  created_at: string;
}
