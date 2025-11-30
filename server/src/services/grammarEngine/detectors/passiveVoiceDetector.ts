/**
 * Passive Voice Detector
 * Identifies passive voice constructions using spaCy dependencies
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import * as MorphAnalyzer from '../morphologyAnalyzer';

export class PassiveVoiceDetector extends BaseGrammarDetector {
  name = 'PassiveVoiceDetector';
  category: GrammarCategory = 'passive';

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    sentence.tokens.forEach((token, index) => {
      // Check for "werden" (passive auxiliary)
      if (token.lemma !== 'werden' || token.pos !== 'AUX') {
        return;
      }

      const tense = MorphAnalyzer.extractTense(token.morph || {});

      // Look for past participle after werden
      const nextToken = sentence.tokens[index + 1];
      if (!nextToken || nextToken.pos !== 'VERB') {
        return;
      }

      const participleTense = MorphAnalyzer.extractTense(nextToken.morph || {});
      const verbForm = MorphAnalyzer.extractVerbForm(nextToken.morph || {});

      if (verbForm !== 'Part') {
        return;
      }

      // Present Passive (B1): Present werden + past participle
      if (tense === 'Pres') {
        results.push(
          this.createResult(
            B1_GRAMMAR['passive-voice-present'],
            this.calculatePosition(sentence.tokens, index, index + 1),
            0.95,
            {
              passiveType: 'present',
              auxiliary: token.text,
              participle: nextToken.text,
              lemma: nextToken.lemma,
            },
          ),
        );
      }

      // Past Passive (B1): Past wurde + past participle
      if (tense === 'Past') {
        results.push(
          this.createResult(
            B1_GRAMMAR['passive-voice-past'],
            this.calculatePosition(sentence.tokens, index, index + 1),
            0.95,
            {
              passiveType: 'past',
              auxiliary: token.text,
              participle: nextToken.text,
              lemma: nextToken.lemma,
            },
          ),
        );
      }
    });

    return results;
  }
}
