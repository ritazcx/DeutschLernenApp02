/**
 * Word Order Detector (A2 Level)
 * Detects V2 (Verb-Second) word order patterns in German main clauses.
 * 
 * In German main clauses, the finite verb must occupy the second position,
 * regardless of what comes first (subject, adverb, object, etc.).
 * 
 * Examples:
 * - "Ich gehe ins Kino." (Subject-Verb-Object)
 * - "Heute gehe ich ins Kino." (Adverb-Verb-Subject-Object)
 * - "Ins Kino gehe ich heute." (Object-Verb-Subject-Adverb)
 * 
 * Note: Subordinate clause word order (verb-final) is handled by 
 * SubordinateClauseDetector (B1 level).
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from '../shared/baseDetector';
import { A2_GRAMMAR, GrammarCategory } from '../../cefr-taxonomy';
import * as MorphAnalyzer from '../../morphologyAnalyzer';

export class WordOrderDetector extends BaseGrammarDetector {
  name = 'WordOrderDetector';
  category: GrammarCategory = 'word-order';

  /**
   * Detect V2 word order patterns in main clauses
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Check for V2 word order in main clauses
    this.detectV2WordOrder(sentence, results);

    return results;
  }

  /**
   * Detect V2 word order in main clauses (verb second position)
   */
  private detectV2WordOrder(sentence: SentenceData, results: DetectionResult[]): void {
    const tokens = sentence.tokens;

    // Find the finite verb
    let finiteVerbIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const morph = MorphAnalyzer.parseMorphFeatures(token.morph);
      if (this.isVerbOrAux(token) &&
          morph.verbForm === 'Fin') {
        finiteVerbIndex = i;
        break;
      }
    }

    if (finiteVerbIndex === -1) return;

    // Check if verb is in second position (after first constituent)
    // In German V2, the verb should be in position 2
    if (finiteVerbIndex === 1) {
      // This is a simple V2 structure: first element + verb + rest
      results.push(
        this.createResult(
          A2_GRAMMAR['word-order-subject-verb-object'],
          this.calculatePosition(tokens, 0, finiteVerbIndex),
          0.8,
          {
            verbPosition: 'second',
            pattern: 'V2',
            clauseType: 'main',
          },
        ),
      );
    } else if (finiteVerbIndex > 1) {
      // Verb is later - could still be V2 if there's a fronted element
      // Check if the first token is an adverb, pronoun, or noun phrase
      const firstToken = tokens[0];
      if (firstToken.pos === 'ADV' || firstToken.pos === 'PRON' ||
          firstToken.pos === 'NOUN' || firstToken.pos === 'DET') {
        results.push(
          this.createResult(
            A2_GRAMMAR['word-order-subject-verb-object'],
            this.calculatePosition(tokens, 0, finiteVerbIndex),
            0.7,
            {
              verbPosition: 'second',
              pattern: 'V2',
              clauseType: 'main',
              frontedElement: firstToken.text,
            },
          ),
        );
      }
    }
  }
}