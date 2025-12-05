/**
 * Type definitions for subordinate clause detection
 * Simplified MVP version focusing on core clause types
 */

/**
 * Type of subordinate clause
 * Simplified to 4 core types for MVP
 */
export type ClauseType = 
  | 'dass'        // Completive clauses (dass, ob)
  | 'relative'    // Relative clauses (der, die, das, etc.)
  | 'adverbial'   // Adverbial clauses (weil, wenn, obwohl, als, etc.)
  | 'infinitive'; // Infinitive clauses (um...zu, ohne...zu, statt...zu)

/**
 * Type of clause marker
 */
export type MarkerType = 
  | 'SCONJ'              // Subordinating conjunction (dass, weil, wenn, etc.)
  | 'PRELS'              // Relative pronoun (der, die, das as relative)
  | 'infinitive-marker'; // Infinitive markers (um, ohne, statt with zu)

/**
 * Marker that introduces a subordinate clause
 */
export interface ClauseMarker {
  type: MarkerType;
  tokenIndex: number;
  lemma: string;
  text: string;
}

/**
 * Boundary information for a clause
 */
export interface ClauseBoundary {
  start: number;  // Token index where clause starts (usually the marker)
  end: number;    // Token index where clause ends (usually after the verb)
  startChar: number;  // Character position in original text
  endChar: number;    // Character position in original text
}

/**
 * Verb information in a clause
 */
export interface ClauseVerb {
  tokenIndex: number;
  lemma: string;
  text: string;
  tag: string;  // spaCy tag (VVFIN, VVINF, VVPP, etc.)
  isCompound: boolean;  // true if verb is part of compound (haben + Partizip II)
  auxiliaryIndex?: number;  // Index of auxiliary verb if compound
}

/**
 * Complete clause entity detected in a sentence
 */
export interface ClauseEntity {
  type: ClauseType;
  markers: ClauseMarker[];
  verb: ClauseVerb;
  boundaries: ClauseBoundary;
  confidence: number;
  parentClauseId?: string;  // For nested clauses (1 level depth)
  details: {
    conjunction?: string;      // For dass/adverbial clauses
    relativeWord?: string;     // For relative clauses
    verbForm?: string;         // Description of verb form
    clauseFunction?: string;   // Semantic function (causal, temporal, etc.)
  };
}

/**
 * Result of clause detection for a sentence
 */
export interface ClauseDetectionResult {
  clauses: ClauseEntity[];
  mainClauseVerb?: {
    tokenIndex: number;
    text: string;
  };
}
