/**
 * Preposition Detector
 * Identifies A2-level dative and accusative preposition usage
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { A2_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import * as MorphAnalyzer from '../morphologyAnalyzer';

export class PrepositionDetector extends BaseGrammarDetector {
  name = 'PrepositionDetector';
  category: GrammarCategory = 'preposition';

  // Dative prepositions (always require dative)
  private dativePrepositions = new Set([
    'mit', 'bei', 'von', 'zu', 'aus', 'in', 'auf', 'unter', 'über',
    'neben', 'zwischen', 'hinter', 'vor', 'nach', 'seit', 'ab'
  ]);

  // Accusative prepositions (always require accusative)
  private accusativePrepositions = new Set([
    'durch', 'für', 'gegen', 'ohne', 'um', 'bis', 'entlang'
  ]);

  // Two-way prepositions (can be dative or accusative)
  private twoWayPrepositions = new Set([
    'in', 'auf', 'unter', 'über', 'vor', 'hinter', 'neben', 'zwischen'
  ]);

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Detect dative prepositions
    this.detectDativePrepositions(sentence, results);

    // Detect accusative prepositions
    this.detectAccusativePrepositions(sentence, results);

    return results;
  }

  /**
   * Detect dative preposition + noun/pronoun constructions
   */
  private detectDativePrepositions(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Check for dative prepositions
      if (!this.dativePrepositions.has(token.lemma.toLowerCase()) || token.pos !== 'ADP') {
        return;
      }

      // Find the noun/pronoun that follows
      const objectIndex = this.findPrepositionObject(sentence.tokens, index);
      if (objectIndex === -1) {
        return;
      }

      const objectToken = sentence.tokens[objectIndex];
      const caseValue = MorphAnalyzer.extractCase(objectToken.morph);

      // Check if object is in dative case
      if (caseValue === 'Dat') {
        results.push(
          this.createResult(
            A2_GRAMMAR['dative-prepositions'],
            this.calculatePosition(sentence.tokens, index, objectIndex),
            0.9,
            {
              preposition: token.text,
              object: objectToken.text,
              requiredCase: 'dative',
              actualCase: caseValue,
              pos: objectToken.pos,
            },
          ),
        );
      }
    });
  }

  /**
   * Detect accusative preposition + noun/pronoun constructions
   */
  private detectAccusativePrepositions(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Check for accusative prepositions
      if (!this.accusativePrepositions.has(token.lemma.toLowerCase()) || token.pos !== 'ADP') {
        return;
      }

      // Find the noun/pronoun that follows
      const objectIndex = this.findPrepositionObject(sentence.tokens, index);
      if (objectIndex === -1) {
        return;
      }

      const objectToken = sentence.tokens[objectIndex];
      const caseValue = MorphAnalyzer.extractCase(objectToken.morph);

      // Check if object is in accusative case
      if (caseValue === 'Acc') {
        results.push(
          this.createResult(
            A2_GRAMMAR['accusative-prepositions'],
            this.calculatePosition(sentence.tokens, index, objectIndex),
            0.9,
            {
              preposition: token.text,
              object: objectToken.text,
              requiredCase: 'accusative',
              actualCase: caseValue,
              pos: objectToken.pos,
            },
          ),
        );
      }
    });
  }

  /**
   * Find the noun/pronoun object of a preposition
   */
  private findPrepositionObject(tokens: SentenceData['tokens'], prepositionIndex: number): number {
    // Look for noun/pronoun/determiner within next few tokens
    for (let i = prepositionIndex + 1; i < Math.min(tokens.length, prepositionIndex + 4); i++) {
      const token = tokens[i];
      if (token.pos === 'NOUN' || token.pos === 'PRON' || token.pos === 'DET') {
        return i;
      }
      // Stop at verbs or punctuation
      if (token.pos === 'VERB' || token.pos === 'AUX' || token.pos === 'PUNCT') {
        break;
      }
    }
    return -1;
  }
}