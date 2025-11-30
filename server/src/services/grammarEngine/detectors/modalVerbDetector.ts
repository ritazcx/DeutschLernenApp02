/**
 * Modal Verb Detector
 * Identifies modal verb constructions (können, müssen, wollen, sollen, dürfen, mögen)
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';

export class ModalVerbDetector extends BaseGrammarDetector {
  name = 'ModalVerbDetector';
  category: GrammarCategory = 'modal-verb';

  // German modal verbs
  private modalVerbs = [
    'können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen',
    'kann', 'muss', 'will', 'soll', 'darf', 'mag',  // conjugated forms
    'kannst', 'musst', 'willst', 'sollst', 'darfst', 'magst',
    'kann', 'muss', 'will', 'soll', 'darf', 'mag',
    'können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen',
    'könnt', 'müsst', 'wollt', 'sollt', 'dürft', 'mögt',
    'können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen'
  ];

  /**
   * Detect modal verb constructions
   * Pattern: modal verb + infinitive (at end of clause)
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    sentence.tokens.forEach((token, index) => {
      // Check if this token is a modal verb
      if (!this.isModalVerb(token.lemma.toLowerCase())) {
        return;
      }

      // Look for the infinitive that follows (typically at end of clause)
      const infinitiveIndex = this.findFollowingInfinitive(sentence.tokens, index);
      if (infinitiveIndex !== -1) {
        const infinitiveToken = sentence.tokens[infinitiveIndex];

        results.push(
          this.createResult(
            B1_GRAMMAR['modal-verbs'],
            this.calculatePosition(sentence.tokens, index, infinitiveIndex),
            0.95,
            {
              modalVerb: token.text,
              infinitive: infinitiveToken.text,
              modalLemma: token.lemma,
              infinitiveLemma: infinitiveToken.lemma,
            },
          ),
        );
      } else if (token.pos === 'VERB' || token.pos === 'AUX') {
        // Modal verb without infinitive (e.g., in questions or standalone)
        results.push(
          this.createResult(
            B1_GRAMMAR['modal-verbs'],
            this.calculatePosition(sentence.tokens, index, index),
            0.8,
            {
              modalVerb: token.text,
              modalLemma: token.lemma,
              standalone: true,
            },
          ),
        );
      }
    });

    return results;
  }

  /**
   * Check if a lemma is a modal verb
   */
  private isModalVerb(lemma: string): boolean {
    return this.modalVerbs.includes(lemma.toLowerCase());
  }

  /**
   * Find the infinitive that follows a modal verb
   */
  private findFollowingInfinitive(tokens: TokenData[], modalIndex: number): number {
    // Look for the next verb that is an infinitive
    for (let i = modalIndex + 1; i < tokens.length; i++) {
      const token = tokens[i];
      // Check for infinitive forms - could be VERB with INF tag or just the next verb
      if (token.pos === 'VERB' && (token.tag === 'INF' || token.tag === 'VVINF')) {
        return i;
      }
      // Also check for separable verbs that might be combined
      if (token.pos === 'VERB' && this.couldBeInfinitiveAfterModal(token, tokens, i)) {
        return i;
      }
      // Stop if we hit another finite verb (end of clause)
      if (token.pos === 'VERB' && token.tag !== 'INF' && token.tag !== 'VVINF') {
        break;
      }
    }
    return -1;
  }

  /**
   * Check if a verb could be an infinitive following a modal
   */
  private couldBeInfinitiveAfterModal(token: TokenData, tokens: TokenData[], index: number): boolean {
    // For now, accept any verb that follows a modal
    // In German, modal + infinitive is common
    return true;
  }
}