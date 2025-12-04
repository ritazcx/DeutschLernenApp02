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
    
    // Check for preposition immediately before this token or before a determiner
    // Pattern 1: "im Saal" (preposition directly before noun)
    // Pattern 2: "mit der Verkündung" (preposition + determiner + noun)
    for (let offset = 1; offset <= 2; offset++) {
      const checkIndex = tokenIndex - offset;
      if (checkIndex < 0) break;
      
      const prevToken = sentence.tokens[checkIndex];
      if (this.isPreposition(prevToken)) {
        return 'prepositional';  // Dative governed by preposition (mit, bei, von, zu, etc.)
      }
      
      // Stop if we hit something that's not a determiner or adjective
      if (offset === 1 && !['DET', 'ART', 'ADJ'].includes(prevToken.pos)) {
        break;
      }
    }
    
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
      // Skip proper nouns (PROPN) that are part of multi-word named entities
      // Strategy: Only skip if BOTH previous AND next tokens are PROPN (middle of entity)
      // OR if previous token is PROPN (end of entity)
      // This allows "Schluss" before "Rio de Janeiro" to be analyzed
      const isPropn = token.pos === 'PROPN' || token.tag === 'PROPN';
      if (isPropn) {
        const prevIsPropn = index > 0 && (sentence.tokens[index - 1].tag === 'PROPN' || sentence.tokens[index - 1].pos === 'PROPN');
        const nextIsPropn = index < sentence.tokens.length - 1 && (sentence.tokens[index + 1].tag === 'PROPN' || sentence.tokens[index + 1].pos === 'PROPN');
        
        // Skip if in middle (prev AND next are PROPN) or at end (only prev is PROPN)
        // But allow if only next is PROPN (could be coincidental adjacency like "Schluss Rio")
        if (prevIsPropn || (prevIsPropn && nextIsPropn)) {
          return;  // Skip tokens that are clearly part of multi-word entities
        }
        // Otherwise, treat as potentially mis-tagged and continue analysis
      }

      // Check nouns, articles, adjectives, pronouns (include PROPN for mis-tagged cases)
      if (!['NOUN', 'DET', 'ADJ', 'PRON'].includes(token.pos) && !isPropn) {
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
