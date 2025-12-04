/**
 * Causative Construction Detector
 * Identifies B2-level causative constructions (lassen + infinitive)
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from '../shared/baseDetector';
import { B2_GRAMMAR, GrammarCategory } from '../../cefr-taxonomy';

export class CausativeDetector extends BaseGrammarDetector {
  name = 'CausativeDetector';
  category: GrammarCategory = 'verb-form';

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Detect causative constructions (lassen + infinitive)
    this.detectCausativeConstructions(sentence, results);

    return results;
  }

  /**
   * Detect "lassen + infinitive" causative constructions
   */
  private detectCausativeConstructions(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Look for "lassen" verb
      if (token.lemma !== 'lassen' || token.pos !== 'VERB') {
        return;
      }

      // Look for infinitive verb after lassen (may have object in between)
      for (let i = index + 1; i < Math.min(sentence.tokens.length, index + 5); i++) {
        const nextToken = sentence.tokens[i];
        if (nextToken.pos === 'VERB') {
          // Check if the verb ends with -en (infinitive marker)
          const isInfinitive = nextToken.text.toLowerCase().endsWith('en');

          if (isInfinitive) {
            results.push(
              this.createResult(
                B2_GRAMMAR['causative-construction'],
                this.calculatePosition(sentence.tokens, index, i),
                0.9,
                {
                  causativeVerb: token.text,
                  infinitive: nextToken.text,
                  construction: 'lassen-infinitive',
                  lemma: nextToken.lemma,
                },
              ),
            );
          }
          break; // Only check the first verb after lassen
        }
      }
    });
  }

  /**
   * Extract verb form from morphological features
   */
  private extractVerbForm(morph: Record<string, any>): string | null {
    if (!morph) return null;

    // Look for VerbForm in morph features
    for (const [key, value] of Object.entries(morph)) {
      if (key.toLowerCase().includes('verbform') || key === 'VerbForm') {
        return value as string;
      }
    }

    return null;
  }
}