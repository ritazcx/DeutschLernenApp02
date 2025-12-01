/**
 * Separable Verb Detector
 * Identifies separable verbs where prefix separates from stem
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';

export class SeparableVerbDetector extends BaseGrammarDetector {
  name = 'SeparableVerbDetector';
  category: GrammarCategory = 'separable-verb';

  // Common separable prefixes
  private separablePrefixes = [
    'ab', 'an', 'auf', 'aus', 'bei', 'durch', 'ein', 'fort', 'her',
    'hin', 'los', 'mit', 'nach', 'vor', 'weg', 'weiter', 'zu', 'zurück'
  ];

  /**
   * Detect separable verbs in a sentence
   * Pattern 1: Separated - verb + preposition particle (e.g., "mache ... auf")
   * Pattern 2: Combined - single token with separable prefix (e.g., "aufmachen")
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Pattern 1: Look for separated separable verbs (verb + separable preposition)
    this.detectSeparatedVerbs(sentence, results);

    // Pattern 2: Look for combined separable verbs (single token with prefix)
    this.detectCombinedVerbs(sentence, results);

    return results;
  }

  /**
   * Detect separated separable verbs (verb + preposition particle)
   */
  private detectSeparatedVerbs(sentence: SentenceData, results: DetectionResult[]): void {
    // Find all verbs in the sentence
    const verbs = sentence.tokens.filter(token => token.pos === 'VERB');
    
    for (const verb of verbs) {
      // Look for a separable preposition after this verb (within reasonable distance)
      for (let j = verb.index + 1; j < sentence.tokens.length && j < verb.index + 5; j++) {
        const particle = sentence.tokens[j];
        
        if (this.isSeparablePreposition(particle)) {
          // Check if the combination forms a known separable verb
          const combinedLemma = particle.text + verb.lemma;
          if (this.isKnownSeparableVerb(combinedLemma)) {
            results.push(
              this.createResult(
                B1_GRAMMAR['separable-verbs'],
                this.calculatePosition(sentence.tokens, verb.index, j),
                0.95,
                {
                  verb: verb.text,
                  prefix: particle.text,
                  fullVerb: combinedLemma,
                  separablePrefix: particle.text,
                  pattern: 'separated',
                },
              ),
            );
            break; // Found a match for this verb, move to next verb
          }
        }
      }
    }
  }

  /**
   * Detect combined separable verbs (single token with prefix)
   */
  private detectCombinedVerbs(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      if (token.pos === 'VERB') {
        const prefix = this.getSeparablePrefix(token.lemma);
        if (prefix) {
          results.push(
            this.createResult(
              B1_GRAMMAR['separable-verbs'],
              this.calculatePosition(sentence.tokens, index, index),
              0.9,
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
    });
  }

  /**
   * Check if a preposition could be a separable verb prefix
   */
  private isSeparablePreposition(token: TokenData): boolean {
    return (token.pos === 'PREP' || token.pos === 'PART') && this.separablePrefixes.includes(token.text.toLowerCase());
  }

  /**
   * Check if a combined lemma is a known separable verb
   */
  private isKnownSeparableVerb(combinedLemma: string): boolean {
    // Since we already verified the prefix is separable, just return true
    // In a full implementation, this would check against a comprehensive dictionary
    // For now, we assume any verb + separable prefix forms a valid separable verb
    return true;
  }

  /**
   * Check if a word ends with a separable prefix
   */
  private getSeparablePrefix(word: string): string | null {
    for (const prefix of this.separablePrefixes) {
      if (word.startsWith(prefix) && word.length > prefix.length) {
        return prefix;
      }
    }
    return null;
  }
}