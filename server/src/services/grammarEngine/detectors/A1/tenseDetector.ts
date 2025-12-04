/**
 * Tense Detector
 * Identifies verb tenses using spaCy morphology
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from '../shared/baseDetector';
import { A1_GRAMMAR, A2_GRAMMAR, B1_GRAMMAR, GrammarCategory } from '../../cefr-taxonomy';
import * as MorphAnalyzer from '../../morphologyAnalyzer';

export class TenseDetector extends BaseGrammarDetector {
  name = 'TenseDetector';
  category: GrammarCategory = 'tense';

  /**
   * Detect verb tenses in a sentence
   * Present: Pres
   * Simple Past: Past + VerbForm=Fin (aber nicht haben/sein)
   * Present Perfect: haben/sein + past participle
   * Past Perfect: hatte/war + past participle
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    sentence.tokens.forEach((token, index) => {
      // Only check verbs
      if (token.pos !== 'VERB' && token.pos !== 'AUX') {
        return;
      }

      const tense = MorphAnalyzer.extractTense(token.morph);
      const verbForm = MorphAnalyzer.extractVerbForm(token.morph);

      // Present tense (A1)
      if (tense === 'Pres' && verbForm === 'Fin') {
        results.push(
          this.createResult(
            A1_GRAMMAR['present-tense'],
            this.calculatePosition(sentence.tokens, index, index),
            0.98,
            {
              tense: 'present',
              word: token.text,
              lemma: token.lemma,
            },
          ),
        );
      }

      // Simple Past (A2)
      if (tense === 'Past' && verbForm === 'Fin') {
        results.push(
          this.createResult(
            A2_GRAMMAR['simple-past-tense'],
            this.calculatePosition(sentence.tokens, index, index),
            0.98,
            {
              tense: 'simple-past',
              word: token.text,
              lemma: token.lemma,
            },
          ),
        );
      }

      // Past Participle (A2) - part of present perfect/past perfect
      if (verbForm === 'Part') {
        // Check if it's preceded by haben or sein
        const auxIndex = this.findAdjacentTokenWithPos(sentence.tokens, index, 'AUX', 'left');
        if (auxIndex !== null) {
          const auxToken = sentence.tokens[auxIndex];
          if (auxToken.lemma === 'haben' || auxToken.lemma === 'sein') {
            const auxTense = MorphAnalyzer.extractTense(auxToken.morph);

            // Present Perfect (A2): Present haben/sein + past participle
            if (auxTense === 'Pres') {
              results.push(
                this.createResult(
                  A2_GRAMMAR['present-perfect-tense'],
                  this.calculatePosition(sentence.tokens, auxIndex, index),
                  0.95,
                  {
                    tense: 'present-perfect',
                    auxiliary: auxToken.text,
                    participle: token.text,
                    lemma: token.lemma,
                  },
                ),
              );
            }

            // Past Perfect (B1): Past hatte/war + past participle
            if (auxTense === 'Past') {
              results.push(
                this.createResult(
                  B1_GRAMMAR['past-perfect'] || A2_GRAMMAR['simple-past-tense'],
                  this.calculatePosition(sentence.tokens, auxIndex, index),
                  0.90,
                  {
                    tense: 'past-perfect',
                    auxiliary: auxToken.text,
                    participle: token.text,
                    lemma: token.lemma,
                  },
                ),
              );
            }
          }
        }
      }
    });

    return results;
  }
}
