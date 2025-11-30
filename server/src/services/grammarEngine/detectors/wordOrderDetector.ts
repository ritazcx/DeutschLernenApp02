/**
 * Word Order Detector
 * Identifies German word order patterns (V2, verb-final in subordinates)
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';

export class WordOrderDetector extends BaseGrammarDetector {
  name = 'WordOrderDetector';
  category: GrammarCategory = 'word-order';

  // Subordinating conjunctions that trigger verb-final
  private subordinatingConjunctions = [
    'dass', 'weil', 'wenn', 'obwohl', 'ob', 'als', 'bevor', 'nachdem',
    'während', 'seitdem', 'bis', 'damit', 'ohne', 'statt'
  ];

  /**
   * Detect word order patterns in the sentence
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Check for subordinate clause word order
    this.detectSubordinateClauses(sentence, results);

    return results;
  }

  /**
   * Detect subordinate clauses with verb-final word order
   */
  private detectSubordinateClauses(sentence: SentenceData, results: DetectionResult[]): void {
    for (let i = 0; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];

      // Check if this is a subordinating conjunction
      if (this.isSubordinatingConjunction(token.text.toLowerCase())) {
        // Find the verb that should be at the end of this clause
        const verbIndex = this.findClauseFinalVerb(sentence.tokens, i);

        if (verbIndex !== -1 && verbIndex > i) {
          // Found a subordinate clause with verb at end
          const conjunction = token;
          const verb = sentence.tokens[verbIndex];

          results.push(
            this.createResult(
              B1_GRAMMAR['subordinate-clauses'],
              this.calculatePosition(sentence.tokens, i, verbIndex),
              0.9,
              {
                conjunction: conjunction.text,
                verb: verb.text,
                verbPosition: 'final',
                clauseType: 'subordinate',
              },
            ),
          );
        }
      }
    }
  }

  /**
   * Check if a word is a subordinating conjunction
   */
  private isSubordinatingConjunction(word: string): boolean {
    return this.subordinatingConjunctions.includes(word.toLowerCase());
  }

  /**
   * Find the verb at the end of a subordinate clause
   */
  private findClauseFinalVerb(tokens: TokenData[], startIndex: number): number {
    // Look for the last verb in the sentence (simplified - assumes one clause)
    let lastVerbIndex = -1;

    for (let i = startIndex + 1; i < tokens.length; i++) {
      if (tokens[i].pos === 'VERB' || tokens[i].pos === 'AUX') {
        lastVerbIndex = i;
      }
    }

    return lastVerbIndex;
  }
}