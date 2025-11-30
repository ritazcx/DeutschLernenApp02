/**
 * Grammar Rules Engine Types
 * Defines interfaces for B1-C1 level grammar rule detection
 */

import { Token, ParsedSentence } from '../nlpEngine/types';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type GrammarCategory = 
  | 'tense'
  | 'case'
  | 'mood'
  | 'voice'
  | 'verb_form'
  | 'preposition'
  | 'conjunction'
  | 'agreement'
  | 'word_order'
  | 'article'
  | 'pronoun'
  | 'adjective'
  | 'noun'
  | 'separable_verb'
  | 'modal_verb'
  | 'collocation'
  | 'special_construction';

export interface GrammarPoint {
  id: string;
  category: GrammarCategory;
  level: CEFRLevel;
  text: string;
  startPos: number;
  endPos: number;
  explanation: string;
  details?: {
    case?: string;
    number?: string;
    gender?: string;
    tense?: string;
    mood?: string;
    person?: string;
    aspect?: string;
  };
  tokenIndices: number[]; // Indices in token array
}

export interface GrammarRuleResult {
  sentence: ParsedSentence;
  grammarPoints: GrammarPoint[];
  hasErrors: boolean;
  summary: {
    totalPoints: number;
    byLevel: Record<CEFRLevel, number>;
    byCategory: Record<GrammarCategory, number>;
  };
}

export interface GrammarRule {
  name: string;
  category: GrammarCategory;
  level: CEFRLevel;
  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null;
  getExplanation(point: GrammarPoint, tokens: Token[]): string;
}

export interface AgreementError {
  type: 'case' | 'number' | 'gender' | 'person';
  expected: string;
  actual: string;
  tokens: string[];
}
