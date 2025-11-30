/**
 * Infinitive Clauses Detector
 * Identifies B2-level infinitive clauses with zu
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { B2_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';

export class InfinitiveClauseDetector extends BaseGrammarDetector {
  name = 'InfinitiveClauseDetector';
  category: GrammarCategory = 'verb-form';

  // Common conjunctions that introduce infinitive clauses
  private infinitiveConjunctions = new Set([
    'um', 'ohne', 'statt', 'anstatt', 'außer'
  ]);

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Detect um...zu constructions
    this.detectUmZuClauses(sentence, results);

    // Detect statt/anstatt...zu constructions
    this.detectStattZuClauses(sentence, results);

    return results;
  }

  /**
   * Detect um...zu infinitive clauses
   */
  private detectUmZuClauses(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Look for "um" conjunction
      if (token.lemma !== 'um') {
        return;
      }

      // Look for "zu" particle after "um"
      const zuIndex = this.findZuParticle(sentence.tokens, index + 1);
      if (zuIndex === -1) {
        return;
      }

      // Look for infinitive verb after "zu"
      const infinitiveIndex = this.findInfinitiveAfterZu(sentence.tokens, zuIndex + 1);
      if (infinitiveIndex === -1) {
        return;
      }

      const infinitiveToken = sentence.tokens[infinitiveIndex];

      results.push(
        this.createResult(
          B2_GRAMMAR['noun-clause-with-infinitive'],
          this.calculatePosition(sentence.tokens, index, infinitiveIndex),
          0.95,
          {
            conjunction: token.text,
            particle: 'zu',
            infinitive: infinitiveToken.text,
            type: 'purpose',
            lemma: infinitiveToken.lemma,
          },
        ),
      );
    });
  }

  /**
   * Detect statt/anstatt...zu infinitive clauses
   */
  private detectStattZuClauses(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Look for "statt" or "anstatt"
      if (!['statt', 'anstatt'].includes(token.lemma)) {
        return;
      }

      // Look for "zu" particle after statt/anstatt
      const zuIndex = this.findZuParticle(sentence.tokens, index + 1);
      if (zuIndex === -1) {
        return;
      }

      // Look for infinitive verb after "zu"
      const infinitiveIndex = this.findInfinitiveAfterZu(sentence.tokens, zuIndex + 1);
      if (infinitiveIndex === -1) {
        return;
      }

      const infinitiveToken = sentence.tokens[infinitiveIndex];

      results.push(
        this.createResult(
          B2_GRAMMAR['noun-clause-with-infinitive'],
          this.calculatePosition(sentence.tokens, index, infinitiveIndex),
          0.95,
          {
            conjunction: token.text,
            particle: 'zu',
            infinitive: infinitiveToken.text,
            type: 'alternative',
            lemma: infinitiveToken.lemma,
          },
        ),
      );
    });
  }

  /**
   * Find "zu" particle within next few tokens
   */
  private findZuParticle(tokens: SentenceData['tokens'], startIndex: number): number {
    for (let i = startIndex; i < Math.min(tokens.length, startIndex + 3); i++) {
      if (tokens[i].lemma === 'zu' && tokens[i].pos === 'PART') {
        return i;
      }
    }
    return -1;
  }

  /**
   * Find infinitive verb after "zu"
   */
  private findInfinitiveAfterZu(tokens: SentenceData['tokens'], startIndex: number): number {
    for (let i = startIndex; i < Math.min(tokens.length, startIndex + 3); i++) {
      const token = tokens[i];
      if (token.pos === 'VERB' && token.tag === 'VVINF') {
        return i;
      }
    }
    return -1;
  }
}