/**
 * Base Grammar Detector
 * All grammar detectors extend this class
 */

import { GrammarPoint, CEFRLevel, GrammarCategory } from '../../cefr-taxonomy';

export interface DetectionResult {
  grammarPointId: string;
  grammarPoint: GrammarPoint;
  position: { start: number; end: number }; // Legacy single range
  positions?: Array<{ start: number; end: number }>; // Multi-range support for non-contiguous highlighting
  confidence: number; // 0-1
  details: Record<string, any>;
}

/**
 * Named Entity metadata
 */
export interface Entity {
  id: number;
  type: string;          // LOC, PER, ORG, MISC
  text: string;          // Complete entity text (e.g., "Rio de Janeiro")
  token_indices: number[]; // Indices of tokens that form this entity
  start: number;         // Character start position
  end: number;           // Character end position
}

/**
 * Token with entity-aware fields
 */
export interface TokenData {
  text: string;
  lemma: string;
  pos: string;
  tag: string;          // Original spaCy POS tag (PROPN, SCONJ, etc.)
  dep: string;              // Dependency relation (ROOT, sb, oa, svp, etc.)
  head?: string;            // Head token text (for dependency parsing)
  morph: Record<string, string>;
  index: number;
  characterStart: number;
  characterEnd: number;
  
  // === Entity-Aware Fields ===
  entity_type?: string;      // NER entity type: LOC, PER, ORG, MISC
  entity_id?: number;        // Shared ID for multi-token entities
  is_entity_start?: boolean; // True if this is the first token of an entity
  is_entity_end?: boolean;   // True if this is the last token of an entity
  entity_text?: string;      // Complete entity text (stored in each token for convenience)
}

/**
 * Sentence with tokens and optional entity metadata
 */
export interface SentenceData {
  text: string;
  tokens: TokenData[];
  entities?: Entity[];  // Optional: entity metadata array for advanced analysis
}

export abstract class BaseGrammarDetector {
  abstract name: string;
  abstract category: GrammarCategory;

  /**
   * Detect grammar points in a sentence
   */
  abstract detect(sentence: SentenceData): DetectionResult[];

  /**
   * Calculate character position in original text
   */
  protected calculatePosition(tokens: TokenData[], startIndex: number, endIndex: number) {
    const startToken = tokens[startIndex];
    const endToken = tokens[endIndex];
    return {
      start: startToken.characterStart,
      end: endToken.characterEnd,
    };
  }

  // ==================== Entity-Aware Helper Methods ====================
  
  /**
   * Check if a token is a named entity (LOC, PER, ORG)
   * Use this to skip entity tokens in grammar detection
   * 
   * @example
   * if (this.isNamedEntity(token)) return; // Skip "Rio de Janeiro"
   */
  protected isNamedEntity(token: TokenData): boolean {
    return !!token.entity_type && ['LOC', 'PER', 'ORG'].includes(token.entity_type);
  }

  /**
   * Check if a token is part of any entity (including MISC)
   * More comprehensive than isNamedEntity()
   */
  protected isPartOfEntity(token: TokenData): boolean {
    return token.entity_id !== undefined;
  }

  /**
   * Get all tokens that belong to the same entity as the given token
   * Returns single-element array if token is not part of an entity
   * 
   * @example
   * const entityTokens = this.getEntityTokens(token, sentence);
   * // For "Rio": returns [Rio, de, Janeiro]
   */
  protected getEntityTokens(token: TokenData, sentence: SentenceData): TokenData[] {
    if (token.entity_id === undefined) {
      return [token];
    }
    return sentence.tokens.filter(t => t.entity_id === token.entity_id);
  }

  /**
   * Get the complete entity text for a token
   * Returns token.text if not part of an entity
   * 
   * @example
   * this.getEntityText(rioToken) // Returns "Rio de Janeiro"
   */
  protected getEntityText(token: TokenData): string {
    return token.entity_text || token.text;
  }

  /**
   * Check if a token is the start of an entity
   * Useful for detecting entity boundaries
   */
  protected isEntityStart(token: TokenData): boolean {
    return token.is_entity_start === true;
  }

  /**
   * Check if a token is the end of an entity
   * Useful for detecting entity boundaries
   */
  protected isEntityEnd(token: TokenData): boolean {
    return token.is_entity_end === true;
  }

  /**
   * Get the text of a range of tokens
   */
  protected getTokenRangeText(tokens: TokenData[], startIndex: number, endIndex: number): string {
    return tokens
      .slice(startIndex, endIndex + 1)
      .map((t) => t.text)
      .join(' ');
  }

  /**
   * Check if token has a morphological feature
   */
  protected hasMorphFeature(token: TokenData, featureName: string, value: string): boolean {
    return token.morph?.[featureName] === value;
  }

  /**
   * Get morphological feature value
   */
  protected getMorphFeature(token: TokenData, featureName: string): string | undefined {
    return token.morph?.[featureName];
  }

  /**
   * Find adjacent token with specific POS
   */
  protected findAdjacentTokenWithPos(tokens: TokenData[], index: number, pos: string, direction: 'left' | 'right' = 'right'): number | null {
    if (direction === 'right') {
      for (let i = index + 1; i < tokens.length; i++) {
        if (tokens[i].pos === pos) return i;
      }
    } else {
      for (let i = index - 1; i >= 0; i--) {
        if (tokens[i].pos === pos) return i;
      }
    }
    return null;
  }

  /**
   * Find token by lemma
   */
  protected findTokenByLemma(tokens: TokenData[], lemma: string): number | null {
    return tokens.findIndex((t) => t.lemma === lemma);
  }

  /**
   * Calculate multiple position ranges (for non-contiguous highlighting)
   */
  protected calculateMultiplePositions(
    tokens: TokenData[],
    indices: number[]
  ): Array<{ start: number; end: number }> {
    return indices.map((index) => ({
      start: tokens[index].characterStart,
      end: tokens[index].characterEnd,
    }));
  }

  /**
   * Find clause boundaries for context-aware search
   */
  protected findClauseEnd(tokens: TokenData[], startIndex: number): number {
    for (let i = startIndex + 1; i < tokens.length; i++) {
      const token = tokens[i];

      // Stop at punctuation (comma, period)
      if (token.pos === 'PUNCT' && [',', '.', '!', '?', ';'].includes(token.text)) {
        return i - 1;
      }

      // Stop at subordinating conjunction (new clause)
      if (token.pos === 'SCONJ') {
        return i - 1;
      }

      // Stop at coordinating conjunction (und, oder, aber)
      if (token.pos === 'CCONJ') {
        return i - 1;
      }
    }

    return tokens.length - 1; // End of sentence
  }

  /**
   * Find start of current clause
   */
  protected findClauseStart(tokens: TokenData[], verbIndex: number): number {
    for (let i = verbIndex - 1; i >= 0; i--) {
      const token = tokens[i];

      // Stop at subordinating conjunction (dass, weil, etc.)
      if (token.pos === 'SCONJ') {
        return i + 1; // Start after conjunction
      }

      // Stop at comma (likely clause boundary)
      if (token.text === ',') {
        return i + 1;
      }
    }

    return 0; // Start of sentence
  }

  /**
   * Check if token is a preposition (including contracted forms)
   * @param token Token to check
   * @returns true if token is ADP, APPRART, or PREP (spaCy German uses PREP for prepositions)
   */
  protected isPreposition(token: TokenData): boolean {
    return token.pos === 'ADP' || token.pos === 'APPRART' || token.pos === 'PREP';
  }

  /**
   * Match preposition by lemma, handling both plain and contracted forms
   * @param token Token to check
   * @param expectedPrep Expected preposition lemma (e.g., 'zu', 'in', 'auf')
   * @returns true if token matches the preposition
   * 
   * Examples:
   * - matchPreposition({lemma: 'zu', pos: 'ADP'}, 'zu') → true
   * - matchPreposition({lemma: 'zu', pos: 'APPRART', text: 'zur'}, 'zu') → true
   * - matchPreposition({lemma: 'zu', pos: 'APPRART', text: 'zum'}, 'zu') → true
   */
  protected matchPreposition(token: TokenData, expectedPrep: string): boolean {
    if (!this.isPreposition(token)) {
      return false;
    }
    return token.lemma.toLowerCase() === expectedPrep.toLowerCase();
  }

  /**
   * Check if token is a contracted preposition+article form (APPRART)
   * @param token Token to check
   * @returns true if token is a contracted form like zur/zum/am/im/etc.
   * 
   * Contracted forms:
   * - zur = zu + der
   * - zum = zu + dem
   * - am = an + dem
   * - im = in + dem
   * - ans = an + das
   * - ins = in + das
   * - vom = von + dem
   * - beim = bei + dem
   */
  protected isContractedPreposition(token: TokenData): boolean {
    // Check for APPRART tag or known contracted forms
    if (token.pos === 'APPRART') return true;
    
    // spaCy German may use PREP for contracted forms, check text
    const contractedForms = ['zur', 'zum', 'am', 'im', 'ans', 'ins', 'vom', 'beim', 'aufs', 'durchs', 'fürs', 'übers', 'ums', 'unterm', 'hinterm', 'überm', 'vors'];
    return token.pos === 'PREP' && contractedForms.includes(token.text.toLowerCase());
  }

  /**
   * Find preposition before a noun (within 1-2 tokens)
   * Handles both plain prepositions (ADP) and contracted forms (APPRART)
   * @param tokens All tokens
   * @param nounIndex Index of the noun
   * @param expectedPrepLemma Expected preposition lemma (e.g., 'zu', 'in')
   * @returns Index of preposition or null if not found
   */
  protected findPrepositionBeforeNoun(
    tokens: TokenData[],
    nounIndex: number,
    expectedPrepLemma: string
  ): number | null {
    // Check 1-2 tokens before noun
    for (let offset = 1; offset <= 2; offset++) {
      const prepIndex = nounIndex - offset;
      if (prepIndex < 0) break;

      const token = tokens[prepIndex];
      if (this.matchPreposition(token, expectedPrepLemma)) {
        return prepIndex;
      }
    }
    return null;
  }

  /**
   * Create a detection result
   */
  protected createResult(
    grammarPoint: GrammarPoint,
    position: { start: number; end: number },
    confidence: number = 0.95,
    details: Record<string, any> = {},
  ): DetectionResult {
    return {
      grammarPointId: grammarPoint.id,
      grammarPoint,
      position,
      confidence,
      details,
    };
  }

  /**
   * Check if a token is a verb or auxiliary verb (VERB or AUX)
   * 
   * Note: AUX includes sein, haben, werden - auxiliary verbs used for
   * perfect tenses, passive, and future. This helper is for structural
   * checks where both VERB and AUX behave similarly (e.g., clause boundaries,
   * verb position detection).
   * 
   * For semantic distinction (e.g., detecting auxiliary patterns),
   * check token.pos === 'AUX' or token.lemma === 'haben'/'sein'/'werden' explicitly.
   */
  protected isVerbOrAux(token: TokenData): boolean {
    return token.pos === 'VERB' || token.pos === 'AUX';
  }

  /**
   * Check if a token is an infinitive verb (comprehensive check with fallbacks)
   * 
   * Checks in order:
   * 1. Morphological features (VerbForm=Inf)
   * 2. POS tag (INF, VVINF)
   * 3. Text pattern matching (German infinitive endings: -en, -eln, -ern)
   */
  protected isInfinitive(token: TokenData): boolean {
    // Must be a verb
    if (!this.isVerbOrAux(token)) return false;

    // Check morphological features (most reliable)
    if (token.morph.VerbForm === 'Inf' || token.morph.VerbForm === 'Inf,Part') {
      return true;
    }

    // Check POS tag
    if (token.tag?.includes('INF') || token.tag === 'VVINF') {
      return true;
    }

    // Fallback: pattern matching for German infinitive endings
    return this.hasInfinitiveEnding(token.text);
  }

  /**
   * Check if a text has typical German infinitive endings
   */
  protected hasInfinitiveEnding(text: string): boolean {
    // German infinitives typically end with -en, -eln, -ern
    return /[a-zäöü]+(en|eln|ern)$/i.test(text);
  }

  /**
   * Check if token is a past participle (Partizip II)
   * Comprehensive check with multiple fallbacks for robustness
   * 
   * Past participles are used in:
   * - Perfect tenses: haben/sein + participle (Ich habe gegessen)
   * - Passive voice: werden + participle (Das Haus wird gebaut)
   * - Attributive position: participle + noun (das gebaute Haus)
   * 
   * Checks in order:
   * 1. POS tag VVPP (most reliable for past participles)
   * 2. Morphological VerbForm=Part BUT NOT Tense=Pres (to exclude present participles)
   * 3. Tense=Perf or Aspect=Perf (excluding finite verbs with VerbForm=Fin)
   */
  protected isPastParticiple(token: TokenData): boolean {
    // Check POS tag first (most reliable)
    if (token.tag === 'VVPP') {
      return true;
    }

    // Exclude present participles (VVPPR tag or VerbForm=Part + Tense=Pres)
    if (token.tag === 'VVPPR' || token.morph.Tense === 'Pres') {
      return false;
    }

    // Exclude finite verbs (kaufte, ging, etc. have VerbForm=Fin, not participles)
    if (token.morph.VerbForm === 'Fin') {
      return false;
    }

    // Check morphological features (VerbForm=Part without Tense=Pres)
    if (token.morph.VerbForm === 'Part') {
      return true;
    }

    // Check tense/aspect markers that indicate past participle (but NOT finite past)
    if (token.morph.Tense === 'Perf' || token.morph.Aspect === 'Perf') {
      return true;
    }

    return false;
  }

  /**
   * Check if token is a present participle (Partizip I)
   * German present participles end in -end (laufend, lesend, kommend)
   * 
   * Present participles are used:
   * - Attributively: der laufende Mann (the running man)
   * - Adverbially: Sie singt tanzend (She sings while dancing)
   * 
   * Checks:
   * 1. POS tag VVPPR (present participle tag)
   * 2. VerbForm=Part && Tense=Pres
   * 3. Pattern matching: -end + optional inflection
   */
  protected isPresentParticiple(token: TokenData): boolean {
    // Check POS tag
    if (token.tag === 'VVPPR') {
      return true;
    }

    // Check morphological features
    if (token.morph.VerbForm === 'Part' && token.morph.Tense === 'Pres') {
      return true;
    }

    // Pattern matching: German present participles end with -end + inflection
    // Examples: laufend, laufende, laufender, laufendes, laufenden, laufendem
    if (/end(e|er|es|en|em)?$/i.test(token.text)) {
      // Additional check: should be tagged as ADJ or VERB-related
      if (token.pos === 'ADJ' || this.isVerbOrAux(token)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if token is a passive auxiliary verb
   * 
   * German has two passive constructions:
   * - Dynamic passive: werden + past participle (Das Haus wird gebaut)
   * - Statal passive: sein + past participle (Das Haus ist gebaut)
   * 
   * @param token Token to check
   * @param type 'werden' for dynamic passive (action), 'sein' for statal passive (state)
   * @returns true if token is the specified auxiliary and properly tagged
   */
  protected isPassiveAuxiliary(token: TokenData, type: 'werden' | 'sein' = 'werden'): boolean {
    // Must be auxiliary or verb
    if (token.pos !== 'AUX' && token.pos !== 'VERB') {
      return false;
    }
    
    // Check lemma matches expected auxiliary
    return token.lemma === type;
  }

  /**
   * Find next past participle after a given index
   * Used for passive voice detection (werden/sein + participle)
   * 
   * @param tokens Token array to search
   * @param startIndex Start searching from here (exclusive)
   * @param maxDistance Maximum tokens to search ahead (default: 10)
   * @param allowSkip If true, can skip over DET/NOUN/ADJ/ADP/PRON (default: true)
   * @returns Index of past participle or -1 if not found
   * 
   * Examples:
   * - Strict mode (allowSkip=false): "wird gebaut" → finds "gebaut" immediately
   * - Flexible mode (allowSkip=true): "wird von meinem Vater gebaut" → finds "gebaut" after phrase
   */
  protected findNextParticiple(
    tokens: TokenData[],
    startIndex: number,
    maxDistance: number = 10,
    allowSkip: boolean = true
  ): number {
    const endIndex = Math.min(tokens.length, startIndex + 1 + maxDistance);
    
    for (let i = startIndex + 1; i < endIndex; i++) {
      const token = tokens[i];
      
      // Check if this is a verb (potential participle)
      if (token.pos === 'VERB') {
        // Verify it's actually a past participle
        if (this.isPastParticiple(token)) {
          return i;
        }
      }
      
      // If not allowing skips, stop at first non-participle
      if (!allowSkip) {
        break;
      }
      
      // In flexible mode, skip over common intervening elements
      const skippablePOS = ['DET', 'NOUN', 'ADJ', 'ADP', 'PRON', 'PREP', 'ART'];
      if (!skippablePOS.includes(token.pos)) {
        // Hit something unexpected (e.g., another verb, conjunction), stop searching
        break;
      }
    }
    
    return -1;
  }

  /**
   * Find next token matching a custom condition
   * Generic utility for flexible token searches
   * 
   * @param tokens Token array
   * @param startIndex Start searching from here (exclusive)
   * @param condition Predicate function to test each token
   * @param maxDistance Maximum tokens to search (default: 10)
   * @returns Index of matching token or -1 if not found
   * 
   * Example:
   * ```typescript
   * // Find next preposition "von" or "durch"
   * const index = this.findTokenByCondition(
   *   tokens, 
   *   particleIndex,
   *   (t) => t.pos === 'ADP' && (t.lemma === 'von' || t.lemma === 'durch'),
   *   5
   * );
   * ```
   */
  protected findTokenByCondition(
    tokens: TokenData[],
    startIndex: number,
    condition: (token: TokenData) => boolean,
    maxDistance: number = 10
  ): number {
    const endIndex = Math.min(tokens.length, startIndex + 1 + maxDistance);
    
    for (let i = startIndex + 1; i < endIndex; i++) {
      if (condition(tokens[i])) {
        return i;
      }
    }
    
    return -1;
  }

  /**
   * Get character position for a single token
   */
  protected getSingleTokenPosition(token: TokenData): { start: number; end: number } {
    return {
      start: token.characterStart,
      end: token.characterEnd,
    };
  }
}
