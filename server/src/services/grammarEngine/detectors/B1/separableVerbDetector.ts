/**
 * Separable Verb Detector
 * Identifies separable verbs using spaCy's PTKVZ tags and linguistic rules
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from '../shared/baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../../cefr-taxonomy';
import { SEPARABLE_PREFIXES } from '../shared/sharedConstants';

export class SeparableVerbDetector extends BaseGrammarDetector {
  name = 'SeparableVerbDetector';
  category: GrammarCategory = 'separable-verb';

  /**
   * Detect separable verbs in a sentence
   * Uses spaCy's PTKVZ tag for separated forms and linguistic rules for combined forms
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];
    const detectedVerbs = new Set<string>(); // Avoid duplicates

    // Pattern 1: Separated verbs (spaCy PTKVZ tag - high confidence)
    this.detectSeparatedVerbs(sentence, results, detectedVerbs);

    // Pattern 2: Combined verbs (prefix matching + context validation)
    this.detectCombinedVerbs(sentence, results, detectedVerbs);

    return results;
  }

  /**
   * Detect separated separable verbs using spaCy's PTKVZ tag
   * This relies on spaCy's professional NLP tagging (high accuracy ~95%)
   */
  private detectSeparatedVerbs(
    sentence: SentenceData,
    results: DetectionResult[],
    detectedVerbs: Set<string>,
  ): void {
    sentence.tokens.forEach((token) => {
      // spaCy marks separable verb prefixes with tag="PTKVZ" and dep="svp"
      if (token.tag === 'PTKVZ' && token.dep === 'svp' && token.head) {
        // Find the verb this prefix belongs to (via head dependency)
        const verb = this.findTokenByText(sentence, token.head);
        
        if (verb && this.isVerbOrAux(verb)) {
          const fullVerb = token.text.toLowerCase() + verb.lemma.toLowerCase();
          const verbKey = `${verb.index}-${token.index}`;
          
          if (!detectedVerbs.has(verbKey)) {
            detectedVerbs.add(verbKey);
            
            results.push(
              this.createResult(
                B1_GRAMMAR['separable-verbs'],
                this.calculatePosition(sentence.tokens, verb.index, token.index),
                0.95, // High confidence - spaCy tagged
                {
                  verb: verb.text,
                  prefix: token.text,
                  fullVerb: fullVerb,
                  separablePrefix: token.text,
                  pattern: 'separated',
                },
              ),
            );
          }
        }
      }
    });
  }

  /**
   * Detect combined separable verbs (infinitives, subordinate clauses, participles)
   * Uses prefix matching + grammatical context validation
   */
  private detectCombinedVerbs(
    sentence: SentenceData,
    results: DetectionResult[],
    detectedVerbs: Set<string>,
  ): void {
    sentence.tokens.forEach((token, index) => {
      if (this.isVerbOrAux(token)) {
        const prefix = this.getSeparablePrefix(token.lemma);
        
        if (prefix) {
          const context = this.getVerbContext(token, sentence);
          
          // Only detect if in appropriate grammatical context
          if (context.isInfinitive || context.isSubordinate || context.isParticiple) {
            const verbKey = `combined-${index}`;
            
            if (!detectedVerbs.has(verbKey)) {
              detectedVerbs.add(verbKey);
              
              const confidence = this.calculateConfidence(context);
              
              results.push(
                this.createResult(
                  B1_GRAMMAR['separable-verbs'],
                  this.calculatePosition(sentence.tokens, index, index),
                  confidence,
                  {
                    verb: token.text,
                    prefix: prefix,
                    fullVerb: token.lemma,
                    separablePrefix: prefix,
                    pattern: 'combined',
                  },
                ),
              );
            }
          }
        }
      }
    });
  }

  /**
   * Find a token by its text value (used to find verb from PTKVZ head reference)
   */
  private findTokenByText(sentence: SentenceData, targetText: string): TokenData | null {
    return sentence.tokens.find((t) => t.text === targetText) || null;
  }

  /**
   * Determine the grammatical context of a verb
   */
  private getVerbContext(token: TokenData, sentence: SentenceData): {
    isInfinitive: boolean;
    isSubordinate: boolean;
    isParticiple: boolean;
    hasModalVerb: boolean;
  } {
    return {
      // Infinitive forms: VVINF (infinitive) or VVIZU (infinitive with "zu")
      isInfinitive: token.tag === 'VVINF' || token.tag === 'VVIZU',
      
      // Subordinate clause: has subordinating conjunction (KOUS) before verb
      isSubordinate: this.hasSubordinator(token, sentence),
      
      // Past participle: VVPP tag
      isParticiple: token.tag === 'VVPP',
      
      // Has modal verb in sentence (for confidence calculation)
      hasModalVerb: this.hasModalVerb(sentence),
    };
  }

  /**
   * Check if token is in a subordinate clause
   */
  private hasSubordinator(token: TokenData, sentence: SentenceData): boolean {
    // Look for subordinating conjunction (KOUS) before this verb
    return sentence.tokens.some(
      (t) => t.tag === 'KOUS' && t.index < token.index,
    );
  }

  /**
   * Check if sentence has a modal verb (muss, will, kann, etc.)
   */
  private hasModalVerb(sentence: SentenceData): boolean {
    const modalVerbs = ['müssen', 'wollen', 'können', 'sollen', 'dürfen', 'mögen'];
    return sentence.tokens.some(
      (t) => this.isVerbOrAux(t) && modalVerbs.includes(t.lemma.toLowerCase()),
    );
  }

  /**
   * Calculate confidence based on grammatical context
   */
  private calculateConfidence(context: {
    isInfinitive: boolean;
    isSubordinate: boolean;
    isParticiple: boolean;
    hasModalVerb: boolean;
  }): number {
    if (context.isInfinitive) {
      return context.hasModalVerb ? 0.90 : 0.85;
    }
    if (context.isParticiple) {
      return 0.90;
    }
    if (context.isSubordinate) {
      return 0.85;
    }
    return 0.75; // Fallback
  }

  /**
   * Check if a word starts with a separable prefix
   */
  private getSeparablePrefix(word: string): string | null {
    for (const prefix of SEPARABLE_PREFIXES) {
      if (word.startsWith(prefix) && word.length > prefix.length) {
        return prefix;
      }
    }
    return null;
  }
}
