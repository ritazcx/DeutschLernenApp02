/**
 * NLP Engine - Shared Type Definitions
 */

export interface Token {
  id: number;
  word: string;
  lemma: string;
  pos: string;
  morph: Record<string, string>; // spaCy format: e.g., {Tense: 'Past', VerbForm: 'Fin', ...}
  position: {start: number, end: number};
}

export interface ParsedSentence {
  text: string;
  tokens: Token[];
  usedSpaCy: boolean; // true if spaCy analysis succeeded, false if fallback was used
}

export interface ExtractedVocabulary {
  lemma: string;
  word: string;
  pos: string;
  level?: string;
  meaning?: string;
  frequency: number;
  allForms?: string[];
}
