/**
 * Word Order Detector
 * Identifies German word order patterns (V2, verb-final in subordinates)
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { A2_GRAMMAR, B1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import * as MorphAnalyzer from '../morphologyAnalyzer';

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

    // Check for V2 word order in main clauses
    this.detectV2WordOrder(sentence, results);

    // Check for subordinate clause word order
    this.detectSubordinateClauses(sentence, results);

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