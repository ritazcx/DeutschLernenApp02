/**
 * Case Detector
 * Identifies grammatical cases using spaCy morphology
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from '../shared/baseDetector';
import { A1_GRAMMAR, A2_GRAMMAR, GrammarCategory } from '../../cefr-taxonomy';
import * as MorphAnalyzer from '../../morphologyAnalyzer';

export class CaseDetector extends BaseGrammarDetector {
  name = 'CaseDetector';
  category: GrammarCategory = 'case';

  // Verbs that commonly take dative indirect objects
  private dativeVerbsIndirectObject = new Set([
    'geben', 'helfen', 'zeigen', 'antworten', 'sagen', 'erzählen', 'danken',
    'glauben', 'erlauben', 'verbieten', 'befehlen', 'befestigen', 'empfehlen',
    'folgen', 'gefallen', 'gelingen', 'gelten', 'geschehen', 'gleichen',
    'glücken', 'kämpfen', 'langen', 'liegen', 'mißlingen', 'passen',
    'rauben', 'retten', 'ringen', 'schaden', 'schaffen', 'scheinen',
    'schicken', 'schieben', 'schielen', 'schießen', 'schreiben', 'schreien',
    'schuh', 'schwächeln', 'schwindeln', 'schwinden', 'schwingen', 'schwitzen',
    'leihen', 'leiden', 'leisten', 'leiten', 'leuchten', 'liebenlernen'
  ]);

  /**
   * Detect dative context: is it likely indirect object, temporal, or other?
   */
  private detectDativeContext(sentence: SentenceData, tokenIndex: number): string {
    const token = sentence.tokens[tokenIndex];
    
    // Check if this is a numeric/temporal token (dates, ordinals)
    if (token.pos === 'NUM' || token.pos === 'ADJ') {
      // Numbers and ordinals in dates: "5.", "21.", "4. Juni", "dem Sommer"
      const text = token.text.toLowerCase();
      // Match numbers, ordinals, and numeric-like tokens
      if (/^\d+\.?$/.test(text) || /^[ivxl]+\.?$/i.test(text)) {
        return 'temporal'; // Numeric date (regular or Roman numerals)
      }
      if (token.pos === 'ADJ' && /^(erst|zweit|dritt|viert|fünft|sechst|siebt|acht|neunt|zehnt)/.test(text)) {
        return 'temporal'; // Ordinal number (erste, zweite, etc.)
      }
    }

    // Check for season/month nouns (temporal context)
    if (token.pos === 'NOUN') {
      const lemma = token.lemma.toLowerCase();
      const temporalNouns = [
        'sommer', 'herbst', 'winter', 'frühling', 'frühjar',
        'monat', 'juni', 'juli', 'mai', 'märz', 'april', 'oktober', 'november', 'dezember', 
        'januar', 'februar', 'august',  // Added August explicitly
        'saison', 'jahr', 'zeit', 'woche', 'tag', 'stunde', 'minute', 'sekunde', 
        'morgen', 'mittag', 'abend', 'nacht'
      ];
      if (temporalNouns.includes(lemma)) {
        return 'temporal'; // Temporal noun
      }
    }

    // Check if there's a verb before this token (likely indirect object)
    for (let i = tokenIndex - 1; i >= Math.max(0, tokenIndex - 3); i--) {
      const prevToken = sentence.tokens[i];
      if (this.isVerbOrAux(prevToken) && this.dativeVerbsIndirectObject.has(prevToken.lemma.toLowerCase())) {
        return 'indirect-object'; // After a dative verb
      }
      if (this.isVerbOrAux(prevToken)) {
        // Found a verb but not a typical dative verb - could still be indirect object but less certain
        return 'indirect-object';
      }
    }

    // Default to indirect-object if no clear temporal indicator
    return 'indirect-object';
  }

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    sentence.tokens.forEach((token, index) => {
      // Check nouns, articles, adjectives, pronouns
      if (!['NOUN', 'DET', 'ADJ', 'PRON'].includes(token.pos)) {
        return;
      }

      const caseValue = MorphAnalyzer.extractCase(token.morph);

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

      // Dative (A2) with context detection
      if (caseValue === 'Dat') {
        const context = this.detectDativeContext(sentence, index);
        results.push(
          this.createResult(
            A2_GRAMMAR['dative-case'],
            this.calculatePosition(sentence.tokens, index, index),
            0.95,
            {
              case: 'dative',
              word: token.text,
              pos: token.pos,
              dativeContext: context, // 'indirect-object', 'temporal', or 'prepositional'
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
