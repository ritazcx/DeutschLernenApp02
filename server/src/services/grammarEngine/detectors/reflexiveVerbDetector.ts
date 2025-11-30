/**
 * Reflexive Verbs Detector
 * Identifies A2-level reflexive verb constructions
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { A2_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';

export class ReflexiveVerbDetector extends BaseGrammarDetector {
  name = 'ReflexiveVerbDetector';
  category: GrammarCategory = 'reflexive-verb';

  // Common reflexive verbs at A2 level
  private reflexiveVerbs = new Set([
    'sich waschen', 'sich anziehen', 'sich fühlen', 'sich setzen',
    'sich treffen', 'sich freuen', 'sich interessieren', 'sich erinnern',
    'sich vorstellen', 'sich beeilen', 'sich ausruhen', 'sich konzentrieren',
    'sich die zähne putzen', 'sich kämmen', 'sich rasieren', 'sich duschen'
  ]);

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Detect reflexive verb constructions
    this.detectReflexiveVerbs(sentence, results);

    return results;
  }

  /**
   * Detect reflexive verb patterns (verb + sich)
   */
  private detectReflexiveVerbs(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Look for verbs
      if (token.pos !== 'VERB') {
        return;
      }

      // Check if this verb can be reflexive
      if (!this.isReflexiveVerb(token.lemma)) {
        return;
      }

      // Look for "sich" pronoun near the verb
      const sichIndex = this.findSichPronoun(sentence.tokens, index);
      if (sichIndex === -1) {
        return;
      }

      const sichToken = sentence.tokens[sichIndex];

      // Determine position relative to verb
      const verbFirst = sichIndex > index;

      results.push(
        this.createResult(
          A2_GRAMMAR['reflexive-verbs'],
          this.calculatePosition(sentence.tokens, Math.min(index, sichIndex), Math.max(index, sichIndex)),
          0.95,
          {
            verb: token.text,
            reflexivePronoun: sichToken.text,
            verbLemma: token.lemma,
            position: verbFirst ? 'verb-first' : 'pronoun-first',
          },
        ),
      );
    });
  }

  /**
   * Check if a verb lemma can be reflexive
   */
  private isReflexiveVerb(lemma: string): boolean {
    // Check against known reflexive verb phrases
    for (const reflexiveVerb of this.reflexiveVerbs) {
      if (reflexiveVerb.includes(lemma)) {
        return true;
      }
    }

    // Also check for common reflexive verb patterns
    const commonReflexiveRoots = [
      'sich', 'freuen', 'interessieren', 'erinnern', 'konzentrieren',
      'anziehen', 'ausziehen', 'waschen', 'kämmen', 'rasieren', 'putzen'
    ];

    return commonReflexiveRoots.some(root => lemma.includes(root));
  }

  /**
   * Find "sich" pronoun near a verb
   */
  private findSichPronoun(tokens: SentenceData['tokens'], verbIndex: number): number {
    // Look within a small window around the verb
    const windowSize = 3;

    for (let i = Math.max(0, verbIndex - windowSize);
         i < Math.min(tokens.length, verbIndex + windowSize + 1);
         i++) {
      const token = tokens[i];
      if (token.lemma === 'sich' && token.pos === 'PRON') {
        return i;
      }
    }

    return -1;
  }
}