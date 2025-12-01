/**
 * Conditional Sentences Detector
 * Identifies B2-level conditional sentence structures
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { B2_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import * as MorphAnalyzer from '../morphologyAnalyzer';

export class ConditionalDetector extends BaseGrammarDetector {
  name = 'ConditionalDetector';
  category: GrammarCategory = 'conjunction';

  // Conditional conjunctions
  private conditionalConjunctions = new Set([
    'wenn', 'falls', 'sofern', 'vorausgesetzt', 'gesetzt', 'angenommen'
  ]);

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Detect wenn-clauses with subjunctive
    this.detectWennConditional(sentence, results);

    // Detect mixed conditionals (different tenses)
    this.detectMixedConditional(sentence, results);

    return results;
  }

  /**
   * Detect wenn + subjunctive conditionals
   */
  private detectWennConditional(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Look for conditional conjunction
      if (!this.conditionalConjunctions.has(token.lemma.toLowerCase())) {
        return;
      }

      // Find the verb in the conditional clause
      const verbIndex = this.findConditionalVerb(sentence.tokens, index);
      if (verbIndex === -1) {
        return;
      }

      const verb = sentence.tokens[verbIndex];
      const mood = MorphAnalyzer.extractMood(verb.morph || {});
      const tense = MorphAnalyzer.extractTense(verb.morph || {});

      // Determine conditional type
      let conditionalType = 'real'; // default
      if (mood === 'Subj') {
        conditionalType = 'unreal';
      } else if (tense === 'Past') {
        conditionalType = 'past-unreal';
      }

      results.push(
        this.createResult(
          B2_GRAMMAR['conditional-sentences'],
          this.calculatePosition(sentence.tokens, index, verbIndex),
          0.9,
          {
            conjunction: token.text,
            verb: verb.text,
            conditionalType: conditionalType,
            mood: mood,
            tense: tense,
          },
        ),
      );
    });
  }

  /**
   * Detect mixed conditionals (different tenses in if/then clauses)
   */
  private detectMixedConditional(sentence: SentenceData, results: DetectionResult[]): void {
    // Look for sentences with both present and past subjunctive
    let hasPresentSubjunctive = false;
    let hasPastSubjunctive = false;

    sentence.tokens.forEach((token) => {
      if (token.pos === 'VERB' || token.pos === 'AUX') {
        const mood = MorphAnalyzer.extractMood(token.morph || {});
        const tense = MorphAnalyzer.extractTense(token.morph || {});

        if (mood === 'Subj') {
          if (tense === 'Pres') {
            hasPresentSubjunctive = true;
          } else if (tense === 'Past') {
            hasPastSubjunctive = true;
          }
        }
      }
    });

    // If we have both present and past subjunctive, it's likely a mixed conditional
    if (hasPresentSubjunctive && hasPastSubjunctive) {
      results.push(
        this.createResult(
          B2_GRAMMAR['conditional-sentences'],
          this.calculatePosition(sentence.tokens, 0, sentence.tokens.length - 1),
          0.85,
          {
            conditionalType: 'mixed',
            hasPresentSubjunctive: true,
            hasPastSubjunctive: true,
          },
        ),
      );
    }
  }

  /**
   * Find the verb in the conditional clause
   */
  private findConditionalVerb(tokens: SentenceData['tokens'], conjunctionIndex: number): number {
    // Look for finite verb after conjunction
    for (let i = conjunctionIndex + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if ((token.pos === 'VERB' || token.pos === 'AUX') &&
          MorphAnalyzer.extractVerbForm(token.morph || {}) === 'Fin') {
        return i;
      }
    }
    return -1;
  }
}