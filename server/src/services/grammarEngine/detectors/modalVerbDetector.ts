/**
 * Modal Verb Detector
 * Identifies modal verb constructions (können, müssen, wollen, sollen, dürfen, mögen)
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { A2_GRAMMAR, B1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import { SEPARABLE_PREFIXES } from './sharedConstants';

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
    'können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen',
    // Also check for lemmas that might be returned as conjugated forms
    'muss', 'kann', 'will', 'soll', 'darf', 'mag'
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
      const infinitiveIndex = this.findInfinitive(sentence.tokens, index);
      if (infinitiveIndex !== -1) {
        const infinitiveToken = sentence.tokens[infinitiveIndex];
        const infinitiveText = this.getFullInfinitiveText(sentence.tokens, infinitiveIndex);

        results.push(
          this.createResult(
            B1_GRAMMAR['modal-verbs'],
            this.calculatePosition(sentence.tokens, Math.min(index, infinitiveIndex), Math.max(index, infinitiveIndex)),
            0.95,
            {
              modalVerb: token.text,
              infinitive: infinitiveText,
              modalLemma: token.lemma,
              infinitiveLemma: infinitiveToken.lemma,
            },
          ),
        );
      } else if (this.isLikelyStandaloneModal(token, sentence.tokens, index)) {
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
   * Find the infinitive associated with a modal verb
   * Can be before or after the modal verb depending on clause structure
   */
  private findInfinitive(tokens: TokenData[], modalIndex: number): number {
    // First try to find infinitive after the modal (main clause)
    let infinitiveIndex = this.findInfinitiveAfter(tokens, modalIndex);
    if (infinitiveIndex !== -1) return infinitiveIndex;

    // Then try to find infinitive before the modal (subordinate clause)
    infinitiveIndex = this.findInfinitiveBefore(tokens, modalIndex);
    if (infinitiveIndex !== -1) return infinitiveIndex;

    return -1;
  }

  /**
   * Find infinitive after modal verb
   */
  private findInfinitiveAfter(tokens: TokenData[], modalIndex: number): number {
    for (let i = modalIndex + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (this.isInfinitive(token)) {
        return i;
      }
      // Stop if we hit another finite verb (end of clause)
      if (this.isVerbOrAux(token) && !this.isInfinitive(token)) {
        break;
      }
    }
    return -1;
  }

  /**
   * Find infinitive before modal verb
   */
  private findInfinitiveBefore(tokens: TokenData[], modalIndex: number): number {
    for (let i = modalIndex - 1; i >= 0; i--) {
      const token = tokens[i];
      if (this.isInfinitive(token)) {
        return i;
      }
      // Stop if we hit another finite verb
      if (this.isVerbOrAux(token) && !this.isInfinitive(token)) {
        break;
      }
    }
    return -1;
  }



  /**
   * Get the full infinitive text, including separable prefixes
   */
  private getFullInfinitiveText(tokens: TokenData[], infinitiveIndex: number): string {
    const infinitiveToken = tokens[infinitiveIndex];
    
    // Check if there's a separable prefix before the infinitive
    if (infinitiveIndex > 0) {
      const prevToken = tokens[infinitiveIndex - 1];
      if (prevToken.pos === 'PART' && this.isSeparablePrefix(prevToken)) {
        return prevToken.text + infinitiveToken.text;
      }
    }
    
    return infinitiveToken.text;
  }

  /**
   * Check if a token is a separable verb prefix
   */
  private isSeparablePrefix(token: TokenData): boolean {
    return SEPARABLE_PREFIXES.includes(token.lemma.toLowerCase());
  }

  /**
   * Check if a modal verb is likely standalone (not part of modal + infinitive construction)
   */
  private isLikelyStandaloneModal(token: TokenData, tokens: TokenData[], index: number): boolean {
    // Only consider standalone if it's clearly not part of a modal + infinitive
    // For example, in questions: "Muss ich das machen?" - here "muss" is standalone
    // But in statements like "Ich muss das machen" - this should have an infinitive
    
    // If there's no infinitive nearby, it might be standalone
    const hasNearbyInfinitive = this.findInfinitive(tokens, index) !== -1;
    if (hasNearbyInfinitive) return false;
    
    // Check if it's in a question context
    const isInQuestion = this.isInQuestionContext(tokens, index);
    
    // For now, be conservative - only detect standalone modals in clear cases
    return isInQuestion;
  }

  /**
   * Check if modal verb is in a question context
   */
  private isInQuestionContext(tokens: TokenData[], modalIndex: number): boolean {
    // Look for question marks or inverted word order
    const hasQuestionMark = tokens.some(t => t.text === '?');
    if (hasQuestionMark) return true;
    
    // Check for V2 word order (verb second) which is common in questions
    // This is a simplified check
    return false;
  }
}