/**
 * Base Grammar Detector
 * All grammar detectors extend this class
 */

import { GrammarPoint, CEFRLevel, GrammarCategory } from '../cefr-taxonomy';

export interface DetectionResult {
  grammarPointId: string;
  grammarPoint: GrammarPoint;
  position: { start: number; end: number }; // Legacy single range
  positions?: Array<{ start: number; end: number }>; // Multi-range support for non-contiguous highlighting
  confidence: number; // 0-1
  details: Record<string, any>;
}

export interface TokenData {
  text: string;
  lemma: string;
  pos: string;
  tag: string;
  dep: string;
  morph?: Record<string, string>;
  index: number;
  characterStart: number;
  characterEnd: number;
}

export interface SentenceData {
  text: string;
  tokens: TokenData[];
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
}
