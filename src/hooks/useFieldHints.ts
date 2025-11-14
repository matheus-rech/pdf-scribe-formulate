import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FieldHint {
  suggestion: string;
  confidence: number;
  sourceLocation: string;
  sourceText: string;
}

interface UseFieldHintsProps {
  fieldName: string;
  currentValue: string;
  pdfText: string;
  enabled?: boolean;
  debounceMs?: number;
}

export const useFieldHints = ({
  fieldName,
  currentValue,
  pdfText,
  enabled = true,
  debounceMs = 500
}: UseFieldHintsProps) => {
  const [hints, setHints] = useState<FieldHint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateHints = useCallback(async (value: string) => {
    // Don't generate hints for very short inputs
    if (!enabled || value.length < 3 || !pdfText) {
      setHints([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      // Extract relevant context from PDF based on field name
      const fieldContext = getFieldContext(fieldName);
      
      // Call edge function for AI-powered hints
      const { data, error } = await supabase.functions.invoke('generate-field-hints', {
        body: {
          fieldName,
          currentValue: value,
          pdfText: pdfText.substring(0, 50000), // Limit to first 50k chars for performance
          fieldContext
        }
      });

      if (error) throw error;

      if (data?.hints) {
        setHints(data.hints);
      } else {
        setHints([]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error generating field hints:', error);
        setHints([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fieldName, pdfText]);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      generateHints(currentValue);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentValue, generateHints, debounceMs]);

  const clearHints = useCallback(() => {
    setHints([]);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    hints,
    isLoading,
    clearHints
  };
};

// Helper function to provide field-specific context
const getFieldContext = (fieldName: string): string => {
  const contextMap: Record<string, string> = {
    'doi': 'digital object identifier or DOI number',
    'pmid': 'PubMed ID or PMID number',
    'journal': 'journal name or publication',
    'year': 'publication year or date',
    'country': 'country or location of study',
    'population': 'study population, patient characteristics, or inclusion criteria',
    'intervention': 'surgical intervention, procedure, or treatment',
    'comparator': 'control group or comparison intervention',
    'outcomes': 'primary outcomes, endpoints, or results measured',
    'totalN': 'total sample size or number of participants',
    'ageMean': 'mean age or average age',
    'ageMedian': 'median age',
    'vascularTerritory': 'vascular territory, affected vessels, or anatomical location',
    'infarctVolume': 'infarct volume, lesion size, or stroke volume',
    'nihssMean': 'NIHSS score, National Institutes of Health Stroke Scale',
    'gcsMean': 'Glasgow Coma Scale or GCS score',
    'predictorsSummary': 'predictors of outcome, prognostic factors, or risk factors'
  };

  return contextMap[fieldName] || `${fieldName} field data`;
};
