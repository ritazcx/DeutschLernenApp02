/**
 * Morphological Detector
 * Identifies morphological patterns like compound nouns, adjective endings, etc.
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from '../shared/baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../../cefr-taxonomy';

export class MorphologicalDetector extends BaseGrammarDetector {
  name = 'MorphologicalDetector';
  category: GrammarCategory = 'adjective'; // Using adjective as closest category

  // Common compound noun patterns (noun + noun)
  private compoundPatterns = [
    { pattern: /haus$/, examples: ['Kinderhaus', 'Bücherhaus'], type: 'compound-noun' },
    { pattern: /stadt$/, examples: ['Großstadt', 'Hauptstadt'], type: 'compound-noun' },
    { pattern: /zeit$/, examples: ['Sommerzeit', 'Arbeitszeit'], type: 'compound-noun' },
    { pattern: /mann$/, examples: ['Feuerwehrmann', 'Geschäftsmann'], type: 'compound-noun' },
    { pattern: /frau$/, examples: ['Hausfrau', 'Krankenschwester'], type: 'compound-noun' },
  ];

  /**
   * Detect morphological patterns in a sentence
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Check for compound nouns
    this.detectCompoundNouns(sentence, results);

    // Check for adjective agreement patterns
    this.detectAdjectiveAgreement(sentence, results);

    return results;
  }

  /**
   * Detect compound nouns (common at B1 level)
   */
  private detectCompoundNouns(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      if (token.pos === 'NOUN' && this.isCompoundNoun(token)) {
        results.push(
          this.createResult(
            {
              id: 'b1-compound-nouns',
              category: 'adjective', // Using adjective as morphological category
              level: 'B1',
              name: 'Compound Nouns (Komposita)',
              description: 'Two or more nouns combined: Haustür, Arbeitszimmer',
              examples: ['Haustür', 'Arbeitszimmer', 'Kinderbuch'],
              explanation: 'German frequently combines nouns: noun1 + noun2 = new compound noun.',
            },
            this.calculatePosition(sentence.tokens, index, index),
            0.8,
            {
              compoundNoun: token.text,
              lemma: token.lemma,
              pattern: 'compound-noun',
            },
          ),
        );
      }
    });
  }

  /**
   * Detect adjective agreement patterns
   */
  private detectAdjectiveAgreement(sentence: SentenceData, results: DetectionResult[]): void {
    const tokens = sentence.tokens;

    for (let i = 0; i < tokens.length - 1; i++) {
      const current = tokens[i];
      const next = tokens[i + 1];

      // Look for adjective + noun patterns
      if (current.pos === 'ADJ' && next.pos === 'NOUN') {
        // Check if adjective shows agreement (has morphological markers)
        if (this.hasAdjectiveAgreement(current, next)) {
          results.push(
            this.createResult(
              B1_GRAMMAR['adjective-agreement'],
              this.calculatePosition(tokens, i, i + 1),
              0.9,
              {
                adjective: current.text,
                noun: next.text,
                agreement: this.getAgreementType(current, next),
              },
            ),
          );
        }
      }
    }
  }

  /**
   * Check if a noun is a compound noun
   */
  private isCompoundNoun(token: TokenData): boolean {
    const text = token.text.toLowerCase();

    // Simple heuristic: check for common compound patterns
    // In German, compound nouns are written as one word
    if (text.length < 8) return false; // Too short for compound

    // Check if it matches compound patterns
    for (const pattern of this.compoundPatterns) {
      if (pattern.pattern.test(text)) {
        return true;
      }
    }

    // Additional check: contains common connecting elements or multiple roots
    const hasConnectingElement = /s(?=[aou])|en(?=[aou])|er(?=[aou])|es(?=[aou])/.test(text);
    if (hasConnectingElement && text.length > 10) {
      return true;
    }

    // Check for common compound structures (noun + noun)
    // Look for capital letters in the middle (indicating compound)
    const hasInternalCapital = /[a-z][A-Z]/.test(token.text);
    if (hasInternalCapital) {
      return true;
    }

    // Check for very long words that are likely compounds
    if (text.length > 12) {
      return true;
    }

    // Check for words that contain common German noun roots
    const commonRoots = ['kind', 'buch', 'haus', 'mann', 'frau', 'stadt', 'zeit', 'arbeit', 'schule', 'auto'];
    let rootCount = 0;
    for (const root of commonRoots) {
      if (text.includes(root)) {
        rootCount++;
      }
    }
    if (rootCount >= 2 && text.length > 8) {
      return true;
    }

    return false;
  }

  /**
   * Check if adjective shows agreement with noun
   */
  private hasAdjectiveAgreement(adjective: TokenData, noun: TokenData): boolean {
    // Simple check: if adjective ends with common agreement endings
    const adjText = adjective.text.toLowerCase();
    const nounText = noun.text.toLowerCase();

    // Common adjective endings showing agreement
    const agreementEndings = ['e', 'en', 'er', 'es', 'em'];

    // Check if adjective has agreement ending
    const hasEnding = agreementEndings.some(ending => adjText.endsWith(ending));

    // Additional check: adjective is not at sentence start (likely attributive)
    return hasEnding && adjText.length > 3;
  }

  /**
   * Get the type of adjective agreement
   */
  private getAgreementType(adjective: TokenData, noun: TokenData): string {
    const adjText = adjective.text.toLowerCase();

    if (adjText.endsWith('e')) return 'feminine/weak';
    if (adjText.endsWith('en')) return 'accusative/dative plural';
    if (adjText.endsWith('er')) return 'masculine/nominative';
    if (adjText.endsWith('es')) return 'neuter/nominative/accusative';
    if (adjText.endsWith('em')) return 'dative';

    return 'attributive';
  }
}