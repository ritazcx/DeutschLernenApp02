/**
 * A1 Grammar Detector
 * Detects beginner-level German grammar patterns (A1 CEFR level)
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { A1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import * as MorphAnalyzer from '../morphologyAnalyzer';

export class A1GrammarDetector extends BaseGrammarDetector {
  name = 'A1GrammarDetector';
  category: GrammarCategory = 'case';

  /**
   * Detect A1-level grammar patterns:
   * 1. Present tense (Präsens)
   * 2. Nominative case (subject)
   * 3. Simple sentence structure
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Detect present tense verbs
    this.detectPresentTense(sentence, results);

    // Detect nominative case usage
    this.detectNominativeCase(sentence, results);

    return results;
  }

  /**
   * Detect present tense (A1 basic)
   * Includes fallback pattern matching for incomplete morphological data
   */
  private detectPresentTense(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Check for verbs in present tense
      if (token.pos === 'VERB' || token.pos === 'AUX') {
        const tense = MorphAnalyzer.extractTense(token.morph || {});
        const verbForm = MorphAnalyzer.extractVerbForm(token.morph || {});

        // Present finite verb (basic A1)
        // Primary detection: if morphology is complete
        if (tense === 'Pres' && verbForm === 'Fin') {
          const confidenceBoost = this.isCommonA1Verb(token.lemma) ? 0.95 : 0.85;

          results.push(
            this.createResult(
              A1_GRAMMAR['present-tense'],
              this.calculatePosition(sentence.tokens, index, index),
              confidenceBoost,
              {
                tense: 'present',
                word: token.text,
                lemma: token.lemma,
                verbType: this.classifyVerb(token.lemma),
                method: 'morphology',
              },
            ),
          );
        }
        // Fallback detection: if morphology is incomplete, use pattern matching
        else if (!tense || (tense === 'Pres' && !verbForm)) {
          // Try pattern matching for common A1 verbs
          if (this.looksLikePresentTense(token.text, token.lemma)) {
            const patternConfidence = this.isCommonA1Verb(token.lemma) ? 0.80 : 0.65;

            results.push(
              this.createResult(
                A1_GRAMMAR['present-tense'],
                this.calculatePosition(sentence.tokens, index, index),
                patternConfidence,
                {
                  tense: 'present',
                  word: token.text,
                  lemma: token.lemma,
                  verbType: this.classifyVerb(token.lemma),
                  method: 'pattern-matching (incomplete morphology)',
                },
              ),
            );
          }
        }
      }
    });
  }

  /**
   * Check if a word looks like present tense based on verb conjugation patterns
   * Fallback for when morphological analysis is incomplete
   */
  private looksLikePresentTense(word: string, lemma: string): boolean {
    const wordLower = word.toLowerCase();
    const lemmaLower = lemma.toLowerCase();

    // Common A1 verbs with their present tense conjugations
    const presentConjugations: Record<string, string[]> = {
      'sein': ['bin', 'bist', 'ist', 'sind', 'seid'],
      'haben': ['habe', 'hast', 'hat', 'haben', 'habt'],
      'werden': ['werde', 'wirst', 'wird', 'werden', 'werdet'],
      'machen': ['mache', 'machst', 'macht', 'machen', 'macht'],
      'gehen': ['gehe', 'gehst', 'geht', 'gehen', 'geht'],
      'kommen': ['komme', 'kommst', 'kommt', 'kommen', 'kommt'],
      'sehen': ['sehe', 'siehst', 'sieht', 'sehen', 'seht'],
      'sagen': ['sage', 'sagst', 'sagt', 'sagen', 'sagt'],
      'sprechen': ['spreche', 'sprichst', 'spricht', 'sprechen', 'sprecht'],
      'schreiben': ['schreibe', 'schreibst', 'schreibt', 'schreiben', 'schreibt'],
      'lesen': ['lese', 'liest', 'liest', 'lesen', 'lest'],
      'hören': ['höre', 'hörst', 'hört', 'hören', 'hört'],
      'lernen': ['lerne', 'lernst', 'lernt', 'lernen', 'lernt'],
      'arbeiten': ['arbeite', 'arbeitest', 'arbeitet', 'arbeiten', 'arbeitet'],
      'essen': ['esse', 'isst', 'isst', 'essen', 'esst'],
      'trinken': ['trinke', 'trinkst', 'trinkt', 'trinken', 'trinkt'],
      'fahren': ['fahre', 'fährst', 'fährt', 'fahren', 'fahrt'],
      'tragen': ['trage', 'trägst', 'trägt', 'tragen', 'tragt'],
      'laufen': ['laufe', 'läufst', 'läuft', 'laufen', 'lauft'],
      'fallen': ['falle', 'fällst', 'fällt', 'fallen', 'fallt'],
      'halten': ['halte', 'hältst', 'hält', 'halten', 'haltet'],
      'schlafen': ['schlafe', 'schläfst', 'schläft', 'schlafen', 'schlaft'],
      'geben': ['gebe', 'gibst', 'gibt', 'geben', 'gebt'],
      'denken': ['denke', 'denkst', 'denkt', 'denken', 'denkt'],
      'wissen': ['weiß', 'weißt', 'weiß', 'wissen', 'wisst'],
    };

    if (presentConjugations[lemmaLower]) {
      return presentConjugations[lemmaLower].includes(wordLower);
    }

    return false;
  }

  /**
   * Detect nominative case (subjects at A1 level)
   */
  private detectNominativeCase(sentence: SentenceData, results: DetectionResult[]): void {
    // Find subject (typically first noun or after verb in questions)
    for (let i = 0; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];

      // Look for nouns with nominative case
      if (token.pos === 'NOUN' || token.pos === 'PROPN') {
        const caseVal = MorphAnalyzer.extractCase(token.morph || {});

        // If it's a nominative noun and looks like a subject
        if (caseVal === 'Nom' && this.looksLikeSubject(sentence.tokens, i)) {
          results.push(
            this.createResult(
              A1_GRAMMAR['nominative-case'],
              this.calculatePosition(sentence.tokens, i, i),
              0.85,
              {
                case: 'nominative',
                word: token.text,
                lemma: token.lemma,
                role: 'subject',
              },
            ),
          );
        }
      }
    }
  }

  /**
   * Detect basic subject-verb agreement
   */
  private detectSubjectVerbAgreement(sentence: SentenceData, results: DetectionResult[]): void {
    // Find main verb first
    let verbIndex = -1;
    for (let i = 0; i < sentence.tokens.length; i++) {
      if (sentence.tokens[i].pos === 'VERB' && sentence.tokens[i].morph?.['VerbForm'] === 'Fin') {
        verbIndex = i;
        break;
      }
    }

    if (verbIndex === -1) return;

    const verb = sentence.tokens[verbIndex];
    const verbPerson = MorphAnalyzer.extractPerson(verb.morph || {});

    // Look for subject (nominative noun/pronoun before verb)
    for (let i = 0; i < verbIndex; i++) {
      const token = sentence.tokens[i];
      const tokenCase = MorphAnalyzer.extractCase(token.morph || {});
      const tokenPerson = this.extractPersonFromPronoun(token.lemma, token.morph || {});

      if (
        token.pos === 'NOUN' &&
        tokenCase === 'Nom' &&
        this.looksLikeSubject(sentence.tokens, i)
      ) {
        // Found subject-verb pair
        results.push(
          this.createResult(
            A1_GRAMMAR['subject-verb-agreement'],
            this.calculatePosition(sentence.tokens, i, verbIndex),
            0.8,
            {
              subject: token.text,
              verb: verb.text,
              number: MorphAnalyzer.extractNumber(token.morph || {}),
              person: verbPerson,
            },
          ),
        );
      }

      // Also check pronouns
      if (token.pos === 'PRON' && tokenPerson && tokenPerson === verbPerson) {
        results.push(
          this.createResult(
            A1_GRAMMAR['subject-verb-agreement'],
            this.calculatePosition(sentence.tokens, i, verbIndex),
            0.85,
            {
              subject: token.text,
              verb: verb.text,
              person: tokenPerson,
            },
          ),
        );
      }
    }
  }

  /**
   * Check if a noun looks like the subject
   * Uses both dependency parsing and positional heuristics
   */
  private looksLikeSubject(tokens: TokenData[], index: number): boolean {
    const token = tokens[index];

    // Priority 1: Use dependency parsing if available
    if (token.dep === 'nsubj' || token.dep === 'nsubj:pass') {
      return true;  // This is explicitly marked as subject
    }

    // Priority 2: If not marked as subject but has other indicators, check position
    // Look ahead for a verb
    for (let i = index + 1; i < Math.min(index + 8, tokens.length); i++) {
      if ((tokens[i].pos === 'VERB' || tokens[i].pos === 'AUX') && 
          tokens[i].morph?.['VerbForm'] === 'Fin') {
        // Found finite verb after noun
        return true;
      }
      // If we encounter another noun or pronoun marked as subject, this isn't the main one
      if ((tokens[i].pos === 'NOUN' || tokens[i].pos === 'PRON') &&
          (tokens[i].dep === 'nsubj' || tokens[i].dep === 'nsubj:pass')) {
        return false;
      }
    }

    return false;
  }

  /**
   * Classify verb as common A1 verb
   */
  private isCommonA1Verb(lemma: string): boolean {
    const a1Verbs = ['sein', 'haben', 'machen', 'gehen', 'kommen', 'sehen', 'sagen', 'sprechen'];
    return a1Verbs.includes(lemma.toLowerCase());
  }

  /**
   * Classify verb type
   */
  private classifyVerb(lemma: string): string {
    const lemmaLower = lemma.toLowerCase();

    if (['sein', 'haben', 'werden'].includes(lemmaLower)) {
      return 'auxiliary';
    }

    if (
      ['machen', 'gehen', 'kommen', 'sehen', 'sagen', 'sprechen', 'schreiben', 'lesen', 'hören']
        .includes(lemmaLower)
    ) {
      return 'common-verb';
    }

    return 'other-verb';
  }

  /**
   * Extract person from pronoun
   */
  private extractPersonFromPronoun(lemma: string, morph: Record<string, string>): string | null {
    const person = MorphAnalyzer.extractPerson(morph);
    if (person) return person;

    // Fallback based on pronoun lemma
    const lemmaLower = lemma.toLowerCase();
    if (['ich', 'mir', 'mich'].includes(lemmaLower)) return '1sg';
    if (['du', 'dir', 'dich'].includes(lemmaLower)) return '2sg';
    if (['er', 'sie', 'es', 'ihn', 'ihm', 'sich'].includes(lemmaLower)) return '3sg';
    if (['wir', 'uns'].includes(lemmaLower)) return '1pl';
    if (['ihr', 'euch'].includes(lemmaLower)) return '2pl';
    if (['sie', 'Sie', 'ihnen', 'Ihnen'].includes(lemma)) return '3pl';

    return null;
  }
}
