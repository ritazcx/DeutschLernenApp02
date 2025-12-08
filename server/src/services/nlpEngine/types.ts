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
  tag?: string; // Original spaCy POS tag (PROPN, SCONJ, etc.)
  dep?: string; // Dependency relation (ROOT, sb, oa, svp, etc.)
  head?: string; // Head token text (for dependency parsing)
  
  // === Entity-Aware Fields ===
  entity_type?: string;      // NER entity type: LOC, PER, ORG, MISC
  entity_id?: number;        // Shared ID for multi-token entities
  is_entity_start?: boolean; // True if first token of entity
  is_entity_end?: boolean;   // True if last token of entity
  entity_text?: string;      // Complete entity text (e.g., "Rio de Janeiro")
}

export interface ParsedSentence {
  text: string;
  tokens: Token[];
  usedSpaCy: boolean; // true if spaCy analysis succeeded, false if fallback was used
  // Optional entity list produced by the NLP pipeline (NER). Kept generic
  // to allow different engine implementations to attach additional data.
  entities?: any[];
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
