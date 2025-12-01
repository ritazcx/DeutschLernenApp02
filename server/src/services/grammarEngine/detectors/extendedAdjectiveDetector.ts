/**
 * Extended Adjective Attribution Detector
 * Identifies B2-level extended adjective phrases before nouns
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { B2_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';

export class ExtendedAdjectiveDetector extends BaseGrammarDetector {
  name = 'ExtendedAdjectiveDetector';
  category: GrammarCategory = 'adjective';

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Look for extended adjective phrases before nouns
    this.detectExtendedAdjectives(sentence, results);

    return results;
  }

  /**
   * Detect extended adjective attribution patterns
   */
  private detectExtendedAdjectives(sentence: SentenceData, results: DetectionResult[]): void {
    for (let i = 0; i < sentence.tokens.length - 1; i++) {
      const token = sentence.tokens[i];

      // Look for nouns
      if (token.pos !== 'NOUN') {
        continue;
      }

      // Look backwards for extended adjective phrase
      const adjectivePhrase = this.findExtendedAdjectivePhrase(sentence.tokens, i);
      if (adjectivePhrase.length > 1) { // Only flag if there are multiple modifiers (truly extended)
        const startIndex = i - adjectivePhrase.length;
        const endIndex = i;

        results.push(
          this.createResult(
            B2_GRAMMAR['extended-adjective-attribution'],
            this.calculatePosition(sentence.tokens, startIndex, endIndex),
            0.9,
            {
              noun: token.text,
              adjectives: adjectivePhrase.map(t => t.text),
              phraseLength: adjectivePhrase.length,
              type: this.classifyAdjectivePhrase(adjectivePhrase),
            },
          ),
        );
      }
    }
  }

  /**
   * Find extended adjective phrase before a noun
   */
  private findExtendedAdjectivePhrase(tokens: SentenceData['tokens'], nounIndex: number): SentenceData['tokens'] {
    const phrase: SentenceData['tokens'] = [];
    let currentIndex = nounIndex - 1;

    // Go backwards from noun, collecting adjectives and modifiers
    while (currentIndex >= 0) {
      const token = tokens[currentIndex];

      // Stop at verbs, punctuation, or sentence boundaries
      if (token.pos === 'VERB' || token.pos === 'AUX' || token.pos === 'PUNCT') {
        break;
      }

      // Skip dates and numbers - they shouldn't be part of adjective phrases
      if (this.isDateOrNumber(token)) {
        currentIndex--;
        continue;
      }

      // Include adjectives, participles, prepositions in extended phrases
      if (token.pos === 'ADJ' ||
          (token.pos === 'VERB' && token.tag === 'VVPP') || // past participle
          (token.pos === 'ADP' && this.isAttributivePreposition(token))) {
        phrase.unshift(token);
        currentIndex--;
      } else {
        // Stop if we hit something that's not part of the extended phrase
        break;
      }
    }

    return phrase;
  }

  /**
   * Check if preposition is part of attributive phrase
   */
  private isAttributivePreposition(token: SentenceData['tokens'][0]): boolean {
    const attributivePreps = ['von', 'mit', 'für', 'aus', 'in', 'auf', 'über', 'unter', 'vor', 'nach'];
    return attributivePreps.includes(token.lemma);
  }

  /**
   * Check if token is a date or number that shouldn't be part of adjective phrases
   */
  private isDateOrNumber(token: SentenceData['tokens'][0]): boolean {
    // Check for date patterns like "4.", "21.", etc.
    if (/^\d+\.$/.test(token.text)) {
      return true;
    }
    // Check for numbers
    if (token.pos === 'NUM') {
      return true;
    }
    return false;
  }

  /**
   * Classify the type of extended adjective phrase
   */
  private classifyAdjectivePhrase(phrase: SentenceData['tokens']): string {
    if (phrase.length === 0) return 'simple';

    const hasParticiple = phrase.some(t => t.pos === 'VERB' && t.tag === 'VVPP');
    const hasPreposition = phrase.some(t => t.pos === 'ADP');

    if (hasParticiple && hasPreposition) {
      return 'participle-with-preposition';
    } else if (hasParticiple) {
      return 'participle';
    } else if (hasPreposition) {
      return 'prepositional';
    } else {
      return 'multiple-adjectives';
    }
  }
}