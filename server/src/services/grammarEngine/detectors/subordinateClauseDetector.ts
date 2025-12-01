/**
 * Subordinate Clause Detector
 * Identifies subordinate clauses using spaCy dependencies
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';

export class SubordinateClauseDetector extends BaseGrammarDetector {
  name = 'SubordinateClauseDetector';
  category: GrammarCategory = 'word-order';

  // Common subordinate conjunctions in German
  private subordinateConjunctions = new Set([
    'dass',
    'weil',
    'wenn',
    'obwohl',
    'während',
    'bis',
    'nachdem',
    'bevor',
    'seit',
    'sobald',
    'sooft',
    'sofern',
    'indem',
    'falls',
    'insofern',
    'darin',
    'dazu',
    'dessen',
    'ob',
    'damit',
  ]);

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    sentence.tokens.forEach((token, index) => {
      // Check for subordinate conjunctions
      if (token.pos !== 'SCONJ' && !this.subordinateConjunctions.has(token.lemma.toLowerCase())) {
        return;
      }

      // Find the verb in the subordinate clause
      // In German subordinate clauses, the verb is usually at the end
      const clauseVerb = this.findClauseVerb(sentence.tokens, index);
      if (clauseVerb === null) {
        return;
      }

      // Calculate span from conjunction to verb
      const position = this.calculatePosition(sentence.tokens, index, clauseVerb);

      results.push(
        this.createResult(
          B1_GRAMMAR['subordinate-clauses'],
          position,
          0.92,
          {
            conjunction: token.text,
            verb: sentence.tokens[clauseVerb].text,
            verbLemma: sentence.tokens[clauseVerb].lemma,
            type: this.getClauseType(token.lemma.toLowerCase()),
          },
        ),
      );
    });

    return results;
  }

  /**
   * Find the main verb of the subordinate clause
   * Starts looking after the conjunction
   */
  private findClauseVerb(tokens: SentenceData['tokens'], conjunctionIndex: number): number | null {
    for (let i = conjunctionIndex + 1; i < tokens.length; i++) {
      const token = tokens[i];
      // Look for finite verbs or auxiliaries
      if ((token.pos === 'VERB' || token.pos === 'AUX') && token.dep !== 'acl') {
        return i;
      }
    }
    return null;
  }

  /**
   * Determine the type of subordinate clause
   */
  private getClauseType(conjunction: string): string {
    const types: Record<string, string> = {
      dass: 'completive',
      ob: 'interrogative',
      weil: 'causal',
      wenn: 'conditional',
      obwohl: 'concessive',
      während: 'temporal',
      nachdem: 'temporal',
      bevor: 'temporal',
      sobald: 'temporal',
      bis: 'temporal',
      seit: 'temporal',
      indem: 'modal',
      damit: 'purpose',
    };
    return types[conjunction] || 'subordinate';
  }
}
