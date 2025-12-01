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
      // Check for "werden" (passive auxiliary) - can be tagged as AUX or VERB
      if (token.lemma !== 'werden' || (token.pos !== 'AUX' && token.pos !== 'VERB')) {
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
        tense = MorphAnalyzer.extractTense(token.morph || {});
      }

      // Look for past participle after werden (may be separated by prepositional phrases)
      let participleIndex = -1;
      for (let i = index + 1; i < sentence.tokens.length; i++) {
        const candidate = sentence.tokens[i];
        if (candidate.pos === 'VERB') {
          participleIndex = i;
          break;
        }
        // Skip over determiners, nouns, adjectives, adpositions, pronouns, prepositions, articles that might be part of agent phrase
        if (!['DET', 'NOUN', 'ADJ', 'ADP', 'PRON', 'PREP', 'ART'].includes(candidate.pos)) {
          break; // Stop if we hit something unexpected
        }
      }

      if (participleIndex === -1) {
        return;
      }

      const participleToken = sentence.tokens[participleIndex];

      const participleTense = MorphAnalyzer.extractTense(participleToken.morph || {});
      const verbForm = MorphAnalyzer.extractVerbForm(participleToken.morph || {});

      // Check if it's a past participle (VerbForm="Part" or Tense="Perf" for German)
      const isParticiple = verbForm === 'Part' || participleTense === 'Perf';

      if (!isParticiple) {
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
