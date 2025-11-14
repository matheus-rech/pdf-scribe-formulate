import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';

// Types
export interface StudyArm {
  id: string;
  name: string;
  description: string;
  n: string;
}

export interface Indication {
  id: string;
  text: string;
}

export interface Intervention {
  id: string;
  type: string;
  details: string;
}

export interface MortalityData {
  id: string;
  timepoint: string;
  overallN: string;
  overallPercent: string;
  armData: { armId: string; n: string; percent: string }[];
}

export interface MRSData {
  id: string;
  timepoint: string;
  armData: { armId: string; mrs0: string; mrs1: string; mrs2: string; mrs3: string; mrs4: string; mrs5: string; mrs6: string }[];
}

export interface Predictor {
  id: string;
  variable: string;
  outcome: string;
  statisticalMeasure: string;
}

export interface ExtractionFormState {
  currentStep: number;
  formData: Record<string, unknown>;
  studyArms: StudyArm[];
  indications: Indication[];
  interventions: Intervention[];
  mortalityData: MortalityData[];
  mrsData: MRSData[];
  predictors: Predictor[];
  isExtractingPICOT: boolean;
  isExtractingAll: boolean;
  saveStatus: 'saved' | 'saving' | 'error' | 'unsaved';
  lastSaved: Date | null;
  confidenceScores: Record<string, {
    confidence: number;
    sourceSection: string;
    sourceText: string;
  }>;
  validationResults: Record<string, {
    isValid: boolean;
    confidence: number;
    issues: string[];
    suggestions: string;
    sourceText: string;
  }>;
}

// Actions
export type ExtractionFormAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_FORM_DATA'; payload: Record<string, string> }
  | { type: 'UPDATE_FIELD'; payload: { field: string; value: string } }
  | { type: 'ADD_STUDY_ARM'; payload: StudyArm }
  | { type: 'REMOVE_STUDY_ARM'; payload: string }
  | { type: 'UPDATE_STUDY_ARM'; payload: { id: string; updates: Partial<StudyArm> } }
  | { type: 'ADD_INDICATION'; payload: Indication }
  | { type: 'REMOVE_INDICATION'; payload: string }
  | { type: 'ADD_INTERVENTION'; payload: Intervention }
  | { type: 'REMOVE_INTERVENTION'; payload: string }
  | { type: 'SET_EXTRACTING_PICOT'; payload: boolean }
  | { type: 'SET_EXTRACTING_ALL'; payload: boolean }
  | { type: 'SET_SAVE_STATUS'; payload: 'saved' | 'saving' | 'error' | 'unsaved' }
  | { type: 'SET_CONFIDENCE_SCORES'; payload: ExtractionFormState['confidenceScores'] }
  | { type: 'SET_VALIDATION_RESULTS'; payload: ExtractionFormState['validationResults'] }
  | { type: 'RESET_FORM' };

// Initial state
const initialState: ExtractionFormState = {
  currentStep: 1,
  formData: {},
  studyArms: [],
  indications: [],
  interventions: [],
  mortalityData: [],
  mrsData: [],
  predictors: [],
  isExtractingPICOT: false,
  isExtractingAll: false,
  saveStatus: 'saved',
  lastSaved: null,
  confidenceScores: {},
  validationResults: {},
};

// Reducer
function extractionFormReducer(
  state: ExtractionFormState,
  action: ExtractionFormAction
): ExtractionFormState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_FORM_DATA':
      return { ...state, formData: action.payload, saveStatus: 'unsaved' };

    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: { ...state.formData, [action.payload.field]: action.payload.value },
        saveStatus: 'unsaved',
      };

    case 'ADD_STUDY_ARM':
      return {
        ...state,
        studyArms: [...state.studyArms, action.payload],
        saveStatus: 'unsaved',
      };

    case 'REMOVE_STUDY_ARM':
      return {
        ...state,
        studyArms: state.studyArms.filter(arm => arm.id !== action.payload),
        saveStatus: 'unsaved',
      };

    case 'UPDATE_STUDY_ARM':
      return {
        ...state,
        studyArms: state.studyArms.map(arm =>
          arm.id === action.payload.id ? { ...arm, ...action.payload.updates } : arm
        ),
        saveStatus: 'unsaved',
      };

    case 'ADD_INDICATION':
      return {
        ...state,
        indications: [...state.indications, action.payload],
        saveStatus: 'unsaved',
      };

    case 'REMOVE_INDICATION':
      return {
        ...state,
        indications: state.indications.filter(ind => ind.id !== action.payload),
        saveStatus: 'unsaved',
      };

    case 'ADD_INTERVENTION':
      return {
        ...state,
        interventions: [...state.interventions, action.payload],
        saveStatus: 'unsaved',
      };

    case 'REMOVE_INTERVENTION':
      return {
        ...state,
        interventions: state.interventions.filter(int => int.id !== action.payload),
        saveStatus: 'unsaved',
      };

    case 'SET_EXTRACTING_PICOT':
      return { ...state, isExtractingPICOT: action.payload };

    case 'SET_EXTRACTING_ALL':
      return { ...state, isExtractingAll: action.payload };

    case 'SET_SAVE_STATUS':
      return {
        ...state,
        saveStatus: action.payload,
        lastSaved: action.payload === 'saved' ? new Date() : state.lastSaved,
      };

    case 'SET_CONFIDENCE_SCORES':
      return { ...state, confidenceScores: action.payload };

    case 'SET_VALIDATION_RESULTS':
      return { ...state, validationResults: action.payload };

    case 'RESET_FORM':
      return initialState;

    default:
      return state;
  }
}

// Context
interface ExtractionFormContextType {
  state: ExtractionFormState;
  dispatch: Dispatch<ExtractionFormAction>;
}

const ExtractionFormContext = createContext<ExtractionFormContextType | undefined>(undefined);

// Provider
export function ExtractionFormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(extractionFormReducer, initialState);

  return (
    <ExtractionFormContext.Provider value={{ state, dispatch }}>
      {children}
    </ExtractionFormContext.Provider>
  );
}

// Hook
export function useExtractionForm() {
  const context = useContext(ExtractionFormContext);
  if (context === undefined) {
    throw new Error('useExtractionForm must be used within ExtractionFormProvider');
  }
  return context;
}
