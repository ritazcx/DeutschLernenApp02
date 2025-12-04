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
      if (!this.isPassiveAuxiliary(token, 'werden')) {
        return;
      }

      // Determine tense based on the actual word form (spaCy's Tense field seems unreliable for German)
      let tense = 'Pres'; // default
      if (token.text === 'wurde') {
        tense = 'Past';
      } else if (token.text === 'wird') {
        tense = 'Pres';
      } else {
        // Fallback to morphology for other forms
        tense = MorphAnalyzer.extractTense(token.morph);
      }

      // Look for past participle after werden (may be separated by prepositional phrases)
      const participleIndex = this.findNextParticiple(sentence.tokens, index);

      if (participleIndex === -1) {
        return;
      }

      const participleToken = sentence.tokens[participleIndex];

      // Verify it's a past participle (already checked in findNextParticiple, but double-check)
      if (!this.isPastParticiple(participleToken)) {
        return;
      }

      // Present Passive (B1): Present werden + past participle
      if (tense === 'Pres') {
        results.push(
          this.createResult(
            B1_GRAMMAR['passive-voice-present'],
            this.calculatePosition(sentence.tokens, index, participleIndex),
            0.95,
            {
              passiveType: 'present',
              auxiliary: token.text,
              participle: participleToken.text,
              lemma: participleToken.lemma,
            },
          ),
        );
      }

      // Past Passive (B1): Past wurde + past participle
      if (tense === 'Past') {
        results.push(
          this.createResult(
            B1_GRAMMAR['passive-voice-past'],
            this.calculatePosition(sentence.tokens, index, participleIndex),
            0.95,
            {
              passiveType: 'past',
              auxiliary: token.text,
              participle: participleToken.text,
              lemma: participleToken.lemma,
            },
          ),
        );
      }
    });

    return results;
  }
}
