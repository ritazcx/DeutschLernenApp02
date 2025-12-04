/**
 * Relative Clauses Detector
 * Identifies B1-level relative clause constructions
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from '../shared/baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../../cefr-taxonomy';

export class RelativeClauseDetector extends BaseGrammarDetector {
  name = 'RelativeClauseDetector';
  category: GrammarCategory = 'conjunction';

  // German relative pronouns
  private relativePronouns = new Set([
    'der', 'die', 'das', 'den', 'dem', 'des', 'dessen', 'deren',
    'welcher', 'welche', 'welches', 'welchen', 'welchem', 'welches',
    'was', 'wo', 'worin', 'womit', 'worauf', 'wovon'
  ]);

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Detect relative clauses with relative pronouns
    this.detectRelativeClauses(sentence, results);

    return results;
  }

  /**
   * Detect relative clauses introduced by relative pronouns
   */
  private detectRelativeClauses(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Check if token is a relative pronoun
      if (!this.isRelativePronoun(token)) {
        return;
      }

      // Find the verb in the relative clause
      const verbIndex = this.findRelativeClauseVerb(sentence.tokens, index);
      if (verbIndex === -1) {
        return;
      }

      const verb = sentence.tokens[verbIndex];

      // Determine the antecedent (noun before the relative pronoun)
      const antecedent = this.findAntecedent(sentence.tokens, index);

      results.push(
        this.createResult(
          B1_GRAMMAR['relative-clauses'],
          this.calculatePosition(sentence.tokens, index, verbIndex),
          0.9,
          {
            relativePronoun: token.text,
            verb: verb.text,
            antecedent: antecedent?.text || 'unknown',
            case: this.determineRelativePronounCase(token),
            lemma: verb.lemma,
          },
        ),
      );
    });
  }

  /**
   * Check if token is a relative pronoun
   */
  private isRelativePronoun(token: SentenceData['tokens'][0]): boolean {
    // Check by lemma and POS (relative pronouns are often tagged as DET or PRON)
    return (token.pos === 'DET' || token.pos === 'PRON') &&
           this.relativePronouns.has(token.lemma.toLowerCase());
  }

  /**
   * Find the verb in the relative clause
   */
  private findRelativeClauseVerb(tokens: SentenceData['tokens'], relativePronounIndex: number): number {
    // Look for finite verb after relative pronoun
    for (let i = relativePronounIndex + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if ((token.pos === 'VERB' || token.pos === 'AUX') &&
          token.tag !== 'VVINF' && token.tag !== 'VVPP') { // not infinitive or participle
        return i;
      }
    }
    return -1;
  }

  /**
   * Find the antecedent noun that the relative pronoun refers to
   */
  private findAntecedent(tokens: SentenceData['tokens'], relativePronounIndex: number): SentenceData['tokens'][0] | null {
    // Look backwards for the nearest noun
    for (let i = relativePronounIndex - 1; i >= 0; i--) {
      const token = tokens[i];
      if (token.pos === 'NOUN') {
        return token;
      }
      // Stop at punctuation or verbs (sentence/clause boundary)
      if (token.pos === 'PUNCT' || this.isVerbOrAux(token)) {
        break;
      }
    }
    return null;
  }

  /**
   * Determine the case of the relative pronoun
   */
  private determineRelativePronounCase(token: SentenceData['tokens'][0]): string {
    const text = token.text.toLowerCase();

    // Simple case determination based on form
    if (['der', 'die', 'das'].includes(text)) return 'nominative';
    if (['den', 'die'].includes(text)) return 'accusative';
    if (['dem', 'der'].includes(text)) return 'dative';
    if (['des', 'der'].includes(text)) return 'genitive';

    return 'unknown';
  }
}