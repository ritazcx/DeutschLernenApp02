/**
 * Case Detector
 * Identifies grammatical cases using spaCy morphology
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { A1_GRAMMAR, A2_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import * as MorphAnalyzer from '../morphologyAnalyzer';

export class CaseDetector extends BaseGrammarDetector {
  name = 'CaseDetector';
  category: GrammarCategory = 'case';

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    sentence.tokens.forEach((token, index) => {
      // Check nouns, articles, adjectives, pronouns
      if (!['NOUN', 'DET', 'ADJ', 'PRON'].includes(token.pos)) {
        return;
      }

      const caseValue = MorphAnalyzer.extractCase(token.morph || {});

      // Nominative (A1)
      if (caseValue === 'Nom') {
        results.push(
          this.createResult(
            A1_GRAMMAR['nominative-case'],
            this.calculatePosition(sentence.tokens, index, index),
            0.95,
            {
              case: 'nominative',
              word: token.text,
              pos: token.pos,
            },
          ),
        );
      }

      // Accusative (A1)
      if (caseValue === 'Acc') {
        results.push(
          this.createResult(
            A1_GRAMMAR['accusative-case'],
            this.calculatePosition(sentence.tokens, index, index),
            0.95,
            {
              case: 'accusative',
              word: token.text,
              pos: token.pos,
            },
          ),
        );
      }

      // Dative (A2)
      if (caseValue === 'Dat') {
        results.push(
          this.createResult(
            A2_GRAMMAR['dative-case'],
            this.calculatePosition(sentence.tokens, index, index),
            0.95,
            {
              case: 'dative',
              word: token.text,
              pos: token.pos,
            },
          ),
        );
      }

      // Genitive (A2)
      if (caseValue === 'Gen') {
        results.push(
          this.createResult(
            A2_GRAMMAR['genitive-case'],
            this.calculatePosition(sentence.tokens, index, index),
            0.90,
            {
              case: 'genitive',
              word: token.text,
              pos: token.pos,
            },
          ),
        );
      }
    });

    return results;
  }
}
