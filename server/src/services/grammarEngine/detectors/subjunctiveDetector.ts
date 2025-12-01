/**
 * Subjunctive Mood Detector
 * Identifies subjunctive mood (Konjunktiv I and II) using morphology
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { B1_GRAMMAR, B2_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import * as MorphAnalyzer from '../morphologyAnalyzer';

export class SubjunctiveDetector extends BaseGrammarDetector {
  name = 'SubjunctiveDetector';
  category: GrammarCategory = 'mood';

  // Irregular verbs with umlauts in Konjunktiv II
  private konjunktivIIVerbs = new Map([
    ['sein', ['wäre', 'wärst', 'wären']],
    ['haben', ['hätte', 'hättest', 'hätten']],
    ['werden', ['würde', 'würdest', 'würden']],
    ['können', ['könnte', 'könntest', 'könnten']],
    ['müssen', ['müsste', 'müsstest', 'müssten']],
    ['sollen', ['sollte', 'solltest', 'sollten']],
    ['wollen', ['wollte', 'wolltest', 'wollten']],
    ['mögen', ['möchte', 'möchtest', 'möchten']],
    ['dürfen', ['dürfte', 'dürftest', 'dürften']],
  ]);

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    sentence.tokens.forEach((token, index) => {
      if (token.pos !== 'VERB' && token.pos !== 'AUX') {
        return;
      }

      const mood = MorphAnalyzer.extractMood(token.morph || {});

      // Konjunktiv II - Conditional (würde) (B1)
      if (token.lemma === 'werden' && mood === 'Cond') {
        results.push(
          this.createResult(
            B1_GRAMMAR['konjunktiv-II-conditional'],
            this.calculatePosition(sentence.tokens, index, index),
            0.98,
            {
              mood: 'konjunktiv-II-conditional',
              word: token.text,
              lemma: token.lemma,
            },
          ),
        );
      }

      // Konjunktiv II - Subjunctive (umlaut verbs) (B1)
      if (mood === 'Subj' && this.isUmlautVerb(token.text)) {
        results.push(
          this.createResult(
            B1_GRAMMAR['konjunktiv-II-subjunctive'],
            this.calculatePosition(sentence.tokens, index, index),
            0.90,
            {
              mood: 'konjunktiv-II-subjunctive',
              word: token.text,
              lemma: token.lemma,
              type: 'umlaut-verb',
            },
          ),
        );
      }

      // Konjunktiv I - Indirect Speech (B2)
      // Konjunktiv I has -e endings: -e, -est, -e, -en, -et, -en
      if (mood === 'Subj' && !this.isUmlautVerb(token.text)) {
        // Check if this is in indirect speech context
        if (this.isIndirectSpeechContext(sentence.tokens, index)) {
          results.push(
            this.createResult(
              B2_GRAMMAR['konjunktiv-I-indirect-speech'],
              this.calculatePosition(sentence.tokens, index, index),
              0.85,
              {
                mood: 'konjunktiv-I',
                word: token.text,
                lemma: token.lemma,
                type: 'indirect-speech',
              },
            ),
          );
        }
      }

      // Imperative Mood (A1)
      const verbForm = MorphAnalyzer.extractVerbForm(token.morph || {});
      if (mood === 'Imp' && verbForm === 'Fin') {
        results.push(
          this.createResult(
            B1_GRAMMAR['modal-verbs'] || B1_GRAMMAR['konjunktiv-II-conditional'],
            this.calculatePosition(sentence.tokens, index, index),
            0.95,
            {
              mood: 'imperative',
              word: token.text,
              lemma: token.lemma,
            },
          ),
        );
      }
    });

    return results;
  }

  /**
   * Check if a verb form is an umlaut Konjunktiv II verb
   * Only check against known irregular verbs, not just any word with umlauts
   */
  private isUmlautVerb(word: string): boolean {
    const lowerWord = word.toLowerCase();
    for (const forms of this.konjunktivIIVerbs.values()) {
      if (forms.some((f) => f.toLowerCase() === lowerWord)) {
        return true;
      }
    }
    return false; // Remove the crude umlaut heuristic
  }

  /**
   * Check if we're in an indirect speech context
   * Look for verbs of saying/thinking in the main clause
   */
  private isIndirectSpeechContext(tokens: SentenceData['tokens'], verbIndex: number): boolean {
    const sayingVerbs = new Set(['sagen', 'erzählen', 'berichten', 'meinen', 'behaupten', 'denken', 'glauben']);

    // Look for a saying verb before this position
    for (let i = 0; i < verbIndex; i++) {
      if (sayingVerbs.has(tokens[i].lemma)) {
        return true;
      }
    }
    return false;
  }
}
