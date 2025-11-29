export type GrammarType = 
  // Legacy types (backward compatibility)
  | 'verb' | 'case' | 'clause' | 'conjunction' | 'special'
  // New B2/C1 types
  | 'collocation' | 'special_construction' | 'subjunctive' | 'modal' 
  | 'functional_verb' | 'advanced_conjunction' | 'nominalization' | 'passive';

export interface GrammarPoint {
  type: GrammarType;
  text: string;
  explanation: string;
  position: { start: number; end: number };
}

export interface SentenceAnalysis {
  sentence: string;
  translation: string;
  grammarPoints: GrammarPoint[];
}

export interface ArticleAnalysis {
  sentences: SentenceAnalysis[];
}

export type CEFRLevel = 'B1' | 'B2' | 'C1';

export interface GrammarCategory {
  level: CEFRLevel;
  types: GrammarType[];
  label: string;
}

// Grammar categories grouped by CEFR level
export const GRAMMAR_CATEGORIES: GrammarCategory[] = [
  {
    level: 'B1',
    label: 'B1 - Basic Advanced Grammar',
    types: ['conjunction', 'clause', 'passive', 'verb']
  },
  {
    level: 'B2',
    label: 'B2 - Intermediate Advanced Grammar',
    types: ['subjunctive', 'functional_verb', 'special_construction', 'collocation', 'advanced_conjunction', 'modal']
  },
  {
    level: 'C1',
    label: 'C1 - Advanced Grammar',
    types: ['nominalization', 'case', 'special']
  }
];

// Helper to get all grammar types
export const ALL_GRAMMAR_TYPES: GrammarType[] = GRAMMAR_CATEGORIES.flatMap(cat => cat.types);

// Helper to get label for grammar type
export const GRAMMAR_TYPE_LABELS: Record<GrammarType, string> = {
  // Legacy
  'verb': 'Verb Conjugation',
  'case': 'Case Usage',
  'clause': 'Subordinate Clauses',
  'conjunction': 'Basic Conjunctions',
  'special': 'Special Constructions',
  // New types
  'collocation': 'Word Collocations',
  'special_construction': 'Special Verb Constructions',
  'subjunctive': 'Subjunctive Mood (Konjunktiv)',
  'modal': 'Modal Verbs',
  'functional_verb': 'Functional Verbs',
  'advanced_conjunction': 'Advanced Conjunctions',
  'nominalization': 'Nominalization',
  'passive': 'Passive Voice'
};
