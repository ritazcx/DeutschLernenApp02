/**
 * NLP Engine - Shared Type Definitions
 */

export interface MorphFeature {
  case?: 'nominative' | 'genitive' | 'dative' | 'accusative' | 'n/a';
  number?: 'singular' | 'plural' | 'n/a';
  gender?: 'masculine' | 'feminine' | 'neuter' | 'n/a';
  tense?: 'present' | 'past' | 'perfect' | 'pluperfect' | 'future' | 'n/a';
  mood?: 'indicative' | 'subjunctive' | 'conditional' | 'imperative' | 'n/a';
  person?: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | 'n/a';
  voice?: 'active' | 'passive' | 'n/a';
  verbForm?: 'fin' | 'inf' | 'part' | 'ger' | 'n/a';
}

export interface Token {
  id: number;
  word: string;
  lemma: string;
  pos: string;
  morph: MorphFeature;
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
