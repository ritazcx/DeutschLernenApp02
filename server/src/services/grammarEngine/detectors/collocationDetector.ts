/**
 * Collocation Detector
 * Identifies important word collocations and fixed phrases at B1 level
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';

export class CollocationDetector extends BaseGrammarDetector {
  name = 'CollocationDetector';
  category: GrammarCategory = 'verb-form'; // Using verb-form as closest category

  // Common B1-level collocations (verb + preposition/object)
  private collocations = [
    // sich + verb collocations (different word orders)
    { pattern: ['freuen', 'sich', 'auf'], type: 'reflexive-prep', collocation: 'sich freuen auf' },
    { pattern: ['fürchten', 'sich', 'vor'], type: 'reflexive-prep', collocation: 'sich fürchten vor' },
    { pattern: ['interessieren', 'sich', 'für'], type: 'reflexive-prep', collocation: 'sich interessieren für' },
    { pattern: ['kümmern', 'sich', 'um'], type: 'reflexive-prep', collocation: 'sich kümmern um' },
    { pattern: ['sorgen', 'sich', 'um'], type: 'reflexive-prep', collocation: 'sich sorgen um' },
    { pattern: ['gewöhnen', 'sich', 'an'], type: 'reflexive-prep', collocation: 'sich gewöhnen an' },

    // haben + noun collocations (verb-noun order)
    { pattern: ['haben', 'Angst'], type: 'verb-noun', collocation: 'Angst haben' },
    { pattern: ['haben', 'Hunger'], type: 'verb-noun', collocation: 'Hunger haben' },
    { pattern: ['haben', 'Durst'], type: 'verb-noun', collocation: 'Durst haben' },
    { pattern: ['haben', 'Recht'], type: 'verb-noun', collocation: 'Recht haben' },
    { pattern: ['haben', 'Glück'], type: 'verb-noun', collocation: 'Glück haben' },

    // machen + noun collocations
    { pattern: ['machen', 'Urlaub'], type: 'verb-noun', collocation: 'Urlaub machen' },
    { pattern: ['machen', 'Sport'], type: 'verb-noun', collocation: 'Sport machen' },
    { pattern: ['machen', 'Fehler'], type: 'verb-noun', collocation: 'einen Fehler machen' },

    // Other common collocations
    { pattern: ['geben', 'auf'], type: 'verb-prep', collocation: 'aufgeben' },
    { pattern: ['kommen', 'auf'], type: 'verb-prep', collocation: 'aufkommen' },
    { pattern: ['halten', 'von'], type: 'verb-prep', collocation: 'halten von' },
    { pattern: ['warten', 'auf'], type: 'verb-prep', collocation: 'warten auf' },
  ];

  /**
   * Detect collocations in a sentence
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Check for multi-word collocations
    this.detectMultiWordCollocations(sentence, results);

    return results;
  }

  /**
   * Detect multi-word collocations
   */
  private detectMultiWordCollocations(sentence: SentenceData, results: DetectionResult[]): void {
    const tokens = sentence.tokens;

    for (let i = 0; i < tokens.length; i++) {
      for (const collocation of this.collocations) {
        if (this.matchesCollocation(tokens, i, collocation)) {
          const matchedTokens = tokens.slice(i, i + collocation.pattern.length);
          results.push(
            this.createResult(
              {
                id: `b1-collocation-${collocation.collocation.replace(/\s+/g, '-')}`,
                category: 'verb-form',
                level: 'B1',
                name: 'Word Collocations (Kollokationen)',
                description: 'Common word combinations that native speakers use',
                examples: [collocation.collocation],
                explanation: 'Collocations are fixed word combinations that sound natural to native speakers.',
              },
              this.calculatePosition(tokens, i, i + collocation.pattern.length - 1),
              0.85,
              {
                collocation: collocation.collocation,
                type: collocation.type,
                words: matchedTokens.map(t => t.text),
              },
            ),
          );
          break; // Found a match, move to next position
        }
      }
    }
  }

  /**
   * Check if a collocation pattern matches at the given position
   */
  private matchesCollocation(tokens: TokenData[], startIndex: number, collocation: any): boolean {
    const pattern = collocation.pattern;

    // Check if we have enough tokens
    if (startIndex + pattern.length > tokens.length) {
      return false;
    }

    // Check each pattern element
    for (let i = 0; i < pattern.length; i++) {
      const token = tokens[startIndex + i];
      const patternWord = pattern[i];

      // For reflexive pronouns, always check lemma
      if (patternWord === 'sich') {
        if (token.lemma !== 'sich') {
          return false;
        }
      } else if (this.isVerbOrAux(token)) {
        // For verbs, check lemma (to handle inflected forms)
        if (token.lemma.toLowerCase() !== patternWord.toLowerCase()) {
          return false;
        }
      } else {
        // For other words, check text (case-insensitive)
        if (token.text.toLowerCase() !== patternWord.toLowerCase()) {
          return false;
        }
      }
    }

    return true;
  }
}