export type GrammarType =
  // Backend categories (more specific)
  | 'tense' | 'case' | 'mood' | 'voice' | 'verb-form' | 'preposition'
  | 'conjunction' | 'agreement' | 'word-order' | 'article' | 'pronoun'
  | 'adjective' | 'noun' | 'separable-verb' | 'modal-verb' | 'collocation'
  | 'special-construction' | 'functional-verb' | 'participial-attribute'
  | 'clause' | 'reflexive-verb' | 'passive'
  // Legacy types (backward compatibility)
  | 'verb' | 'special'
  | 'special_construction' | 'subjunctive' | 'modal'
  | 'functional_verb' | 'advanced_conjunction' | 'nominalization' | 'passive';

export interface GrammarPoint {
  type: GrammarType;
  level: CEFRLevel;
  text: string;
  explanation: string;
  position: { start: number; end: number }; // Legacy single range
  positions?: Array<{ start: number; end: number }>; // Multi-range support
  
  // Optional metadata for functional verbs and other constructions
  compactForm?: string;
  fullConstruction?: string;
  simpleVerb?: string;
}

export interface VocabularyPoint {
  word: string;
  level: string;
  pos?: string;
  article?: string;
  plural?: string;
  conjugations?: {
    present?: string;
    past?: string;
    perfect?: string;
  };
  meaning_en?: string;
  meaning_zh?: string;
  example_sentences?: string[];
  startIndex: number;
  endIndex: number;
}

export interface SentenceAnalysis {
  sentence: string;
  translation: string;
  grammarPoints: GrammarPoint[];
  vocabularyPoints?: VocabularyPoint[];
}

export interface ArticleAnalysis {
  sentences: SentenceAnalysis[];
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Import CEFR level descriptions to avoid duplication
import { CEFR_LEVEL_DESCRIPTIONS } from './grammar/cefrConfig';

export interface GrammarCategory {
  level: CEFRLevel;
  types: GrammarType[];
  label: string;
}

// Grammar categories grouped by CEFR level (using backend categories)
export const GRAMMAR_CATEGORIES: GrammarCategory[] = [
  {
    level: 'A1',
    label: `A1 - ${CEFR_LEVEL_DESCRIPTIONS.A1}`,
    types: ['article', 'noun', 'pronoun']
  },
  {
    level: 'A2',
    label: `A2 - ${CEFR_LEVEL_DESCRIPTIONS.A2}`,
    types: ['tense', 'case', 'preposition', 'conjunction', 'adjective']
  },
  {
    level: 'B1',
    label: `B1 - ${CEFR_LEVEL_DESCRIPTIONS.B1}`,
    types: ['verb-form', 'agreement', 'word-order', 'modal-verb', 'separable-verb']
  },
  {
    level: 'B2',
    label: `B2 - ${CEFR_LEVEL_DESCRIPTIONS.B2}`,
    types: ['mood', 'voice', 'collocation', 'special-construction']
  },
  {
    level: 'C1',
    label: `C1 - ${CEFR_LEVEL_DESCRIPTIONS.C1}`,
    types: ['tense', 'case', 'preposition', 'conjunction', 'adjective', 'verb-form', 'agreement', 'word-order', 'modal-verb', 'separable-verb', 'mood', 'voice', 'collocation', 'special-construction']
  },
  {
    level: 'C2',
    label: `C2 - ${CEFR_LEVEL_DESCRIPTIONS.C2}`,
    types: ['tense', 'case', 'preposition', 'conjunction', 'adjective', 'verb-form', 'agreement', 'word-order', 'modal-verb', 'separable-verb', 'mood', 'voice', 'collocation', 'special-construction']
  }
];

// Helper to get all grammar types
export const ALL_GRAMMAR_TYPES: GrammarType[] = GRAMMAR_CATEGORIES.flatMap(cat => cat.types);
