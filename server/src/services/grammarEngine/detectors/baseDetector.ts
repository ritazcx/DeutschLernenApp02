/**
 * Base Grammar Detector
 * All grammar detectors extend this class
 */

import { GrammarPoint, CEFRLevel, GrammarCategory } from '../cefr-taxonomy';

export interface DetectionResult {
  grammarPointId: string;
  grammarPoint: GrammarPoint;
  position: { start: number; end: number };
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
