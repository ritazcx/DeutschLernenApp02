/**
 * A2 Grammar Detector
 * Detects elementary-level German grammar patterns (A2 CEFR level)
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { A2_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import * as MorphAnalyzer from '../morphologyAnalyzer';

export class A2GrammarDetector extends BaseGrammarDetector {
  name = 'A2GrammarDetector';
  category: GrammarCategory = 'case';

  /**
   * Detect A2-level grammar patterns:
   * 1. Simple past tense (Präteritum)
   * 2. Present perfect (Perfekt)
   * 3. Dative and accusative cases
   * 4. Modal verbs (muss, kann, soll, etc.)
   * 5. Reflexive pronouns
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Detect simple past tense
    this.detectSimplePast(sentence, results);

    // Detect present perfect
    this.detectPresentPerfect(sentence, results);

    // Detect dative case usage
    this.detectDativeCase(sentence, results);

    // Detect accusative case usage
    this.detectAccusativeCase(sentence, results);

    // Detect modal verbs
    this.detectModalVerbs(sentence, results);

    // Detect reflexive pronouns
    this.detectReflexivePronouns(sentence, results);

    return results;
  }

  /**
   * Detect simple past tense
   */
  private detectSimplePast(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      if (token.pos === 'VERB' || token.pos === 'AUX') {
        const tense = MorphAnalyzer.extractTense(token.morph || {});
        const verbForm = MorphAnalyzer.extractVerbForm(token.morph || {});

        // Simple past finite verb (A2)
        if (tense === 'Past' && verbForm === 'Fin') {
          results.push(
            this.createResult(
              A2_GRAMMAR['simple-past-tense'],
              this.calculatePosition(sentence.tokens, index, index),
              0.95,
              {
                tense: 'simple-past',
                word: token.text,
                lemma: token.lemma,
                verbType: this.classifyVerb(token.lemma),
              },
            ),
          );
        }
      }
    });
  }

  /**
   * Detect present perfect (haben/sein + participle)
   */
  private detectPresentPerfect(sentence: SentenceData, results: DetectionResult[]): void {
    for (let i = 0; i < sentence.tokens.length - 1; i++) {
      const token = sentence.tokens[i];
      const nextToken = sentence.tokens[i + 1];

      // Look for auxiliary (haben/sein) in present tense
      if ((token.pos === 'AUX' && (token.lemma === 'haben' || token.lemma === 'sein'))) {
        const tense = MorphAnalyzer.extractTense(token.morph || {});

        // Find participle after the auxiliary
        for (let j = i + 1; j < Math.min(i + 5, sentence.tokens.length); j++) {
          const partToken = sentence.tokens[j];
          const partVerbForm = MorphAnalyzer.extractVerbForm(partToken.morph || {});

          if (partVerbForm === 'Part' && (partToken.pos === 'VERB' || partToken.pos === 'AUX')) {
            if (tense === 'Pres') {
              // Present perfect
              results.push(
                this.createResult(
                  A2_GRAMMAR['present-perfect-tense'],
                  this.calculatePosition(sentence.tokens, i, j),
                  0.92,
                  {
                    tense: 'present-perfect',
                    auxiliary: token.text,
                    participle: partToken.text,
                    participleBase: partToken.lemma,
                  },
                ),
              );
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Detect dative case usage
   */
  private detectDativeCase(sentence: SentenceData, results: DetectionResult[]): void {
    // Look for dative objects after dative prepositions or dative verbs
    const dativePrepositions = ['mit', 'bei', 'zu', 'von', 'aus', 'seit', 'ausser', 'außer'];

    for (let i = 0; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];

      // Check for dative preposition
      if (token.pos === 'ADP' && dativePrepositions.includes(token.lemma.toLowerCase())) {
        // Look for noun/pronoun after preposition
        for (let j = i + 1; j < Math.min(i + 4, sentence.tokens.length); j++) {
          const nounToken = sentence.tokens[j];

          if (nounToken.pos === 'NOUN' || nounToken.pos === 'PRON' || nounToken.pos === 'DET') {
            const caseVal = MorphAnalyzer.extractCase(nounToken.morph || {});

            if (caseVal === 'Dat') {
              results.push(
                this.createResult(
                  A2_GRAMMAR['dative-case'],
                  this.calculatePosition(sentence.tokens, i, j),
                  0.88,
                  {
                    case: 'dative',
                    preposition: token.text,
                    object: nounToken.text,
                    usage: 'prepositional-object',
                  },
                ),
              );
              break;
            }
          }
        }
      }

      // Check for dative object with articles
      if ((token.pos === 'DET' || token.pos === 'NOUN') && i > 0) {
        const caseVal = MorphAnalyzer.extractCase(token.morph || {});

        if (caseVal === 'Dat' && this.isLikelyDativeObject(sentence.tokens, i)) {
          results.push(
            this.createResult(
              A2_GRAMMAR['dative-case'],
              this.calculatePosition(sentence.tokens, i, i),
              0.80,
              {
                case: 'dative',
                word: token.text,
                usage: 'indirect-object',
              },
            ),
          );
        }
      }
    }
  }

  /**
   * Detect accusative case usage
   */
  private detectAccusativeCase(sentence: SentenceData, results: DetectionResult[]): void {
    // Look for accusative objects (direct objects)
    for (let i = 0; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];

      if ((token.pos === 'NOUN' || token.pos === 'DET' || token.pos === 'PRON') && i > 0) {
        const caseVal = MorphAnalyzer.extractCase(token.morph || {});

        // Accusative case
        if (caseVal === 'Acc' && this.isLikelyAccusativeObject(sentence.tokens, i)) {
          results.push(
            this.createResult(
              A2_GRAMMAR['accusative-case'],
              this.calculatePosition(sentence.tokens, i, i),
              0.82,
              {
                case: 'accusative',
                word: token.text,
                usage: 'direct-object',
              },
            ),
          );
        }
      }
    }
  }

  /**
   * Detect modal verbs (A2)
   */
  private detectModalVerbs(sentence: SentenceData, results: DetectionResult[]): void {
    const modalVerbs = ['müssen', 'können', 'sollen', 'wollen', 'dürfen', 'mögen', 'möchten'];

    sentence.tokens.forEach((token, index) => {
      if (token.pos === 'VERB' && modalVerbs.includes(token.lemma.toLowerCase())) {
        // Look for infinitive after modal
        for (let j = index + 1; j < Math.min(index + 5, sentence.tokens.length); j++) {
          const nextToken = sentence.tokens[j];
          const verbForm = MorphAnalyzer.extractVerbForm(nextToken.morph || {});

          if (verbForm === 'Inf' && (nextToken.pos === 'VERB' || nextToken.pos === 'AUX')) {
            results.push(
              this.createResult(
                A2_GRAMMAR['modal-verb'],
                this.calculatePosition(sentence.tokens, index, j),
                0.93,
                {
                  modalVerb: token.text,
                  infinitive: nextToken.text,
                  meaning: this.getModalMeaning(token.lemma),
                },
              ),
            );
            break;
          }
        }
      }
    });
  }

  /**
   * Detect reflexive pronouns
   */
  private detectReflexivePronouns(sentence: SentenceData, results: DetectionResult[]): void {
    for (let i = 0; i < sentence.tokens.length; i++) {
      const token = sentence.tokens[i];

      // Check for reflexive pronouns (sich, mich, dich, etc. when used reflexively)
      if (token.pos === 'PRON' && this.isReflexivePronoun(token.lemma)) {
        // Look for reflexive verb
        for (let j = i - 1; j < Math.min(i + 2, sentence.tokens.length); j++) {
          if (j >= 0 && (sentence.tokens[j].pos === 'VERB' || sentence.tokens[j].pos === 'AUX')) {
            // Check if it's a known reflexive verb
            if (this.isReflexiveVerb(sentence.tokens[j].lemma)) {
              results.push(
                this.createResult(
                  A2_GRAMMAR['reflexive-verb'],
                  this.calculatePosition(sentence.tokens, Math.min(i, j), Math.max(i, j)),
                  0.85,
                  {
                    reflexiveVerb: sentence.tokens[j].text,
                    reflexivePronoun: token.text,
                  },
                ),
              );
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Check if word is a reflexive pronoun
   */
  private isReflexivePronoun(lemma: string): boolean {
    const reflexivePronouns = ['sich', 'mich', 'dich', 'uns', 'euch'];
    return reflexivePronouns.includes(lemma.toLowerCase());
  }

  /**
   * Check if word is a reflexive verb
   */
  private isReflexiveVerb(lemma: string): boolean {
    const reflexiveVerbs = [
      'interessieren',
      'freuen',
      'ärgern',
      'setzen',
      'stellen',
      'legen',
      'merken',
      'vorstellen',
      'langweilen',
      'wundern',
    ];
    return reflexiveVerbs.includes(lemma.toLowerCase());
  }

  /**
   * Check if dative token looks like indirect object
   */
  private isLikelyDativeObject(tokens: TokenData[], index: number): boolean {
    // Simple heuristic: dative usually comes after verb or after accusative
    if (index > 0) {
      const prevToken = tokens[index - 1];
      return prevToken.pos === 'VERB' || prevToken.pos === 'AUX' || prevToken.pos === 'NOUN';
    }
    return false;
  }

  /**
   * Check if accusative token looks like direct object
   */
  private isLikelyAccusativeObject(tokens: TokenData[], index: number): boolean {
    // Simple heuristic: comes after verb
    if (index > 0) {
      for (let i = index - 1; i >= Math.max(0, index - 3); i--) {
        if (tokens[i].pos === 'VERB' || tokens[i].pos === 'AUX') {
          return true;
        }
      }
    }
    return false;
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
      ['gehen', 'kommen', 'sehen', 'sagen', 'sprechen', 'schreiben', 'lesen', 'hören']
        .includes(lemmaLower)
    ) {
      return 'common-verb';
    }

    return 'other-verb';
  }

  /**
   * Get meaning of modal verb
   */
  private getModalMeaning(lemma: string): string {
    const meanings: Record<string, string> = {
      müssen: 'must, have to',
      können: 'can, be able to',
      sollen: 'should, be supposed to',
      wollen: 'want to',
      dürfen: 'may, be allowed to',
      mögen: 'like to',
      möchten: 'would like to',
    };
    return meanings[lemma.toLowerCase()] || 'modal verb';
  }
}
