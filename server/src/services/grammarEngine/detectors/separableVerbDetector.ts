/**
 * Separable Verb Detector
 * Identifies separable verbs where prefix separates from stem
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';
import { SEPARABLE_PREFIXES } from './sharedConstants';

export class SeparableVerbDetector extends BaseGrammarDetector {
  name = 'SeparableVerbDetector';
  category: GrammarCategory = 'separable-verb';

  /**
   * Detect separable verbs in a sentence
   * Pattern 1: Separated - verb + preposition particle (e.g., "mache ... auf")
   * Pattern 2: Combined - single token with separable prefix (e.g., "aufmachen")
   */
  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Pattern 1: Look for separated separable verbs (verb + separable preposition)
    this.detectSeparatedVerbs(sentence, results);

    // Pattern 2: Look for combined separable verbs (single token with prefix)
    this.detectCombinedVerbs(sentence, results);

    return results;
  }

  /**
   * Detect separated separable verbs (verb + preposition particle)
   */
  private detectSeparatedVerbs(sentence: SentenceData, results: DetectionResult[]): void {
    // Find all verbs in the sentence
    const verbs = sentence.tokens.filter(token => this.isVerbOrAux(token));
    
    for (const verb of verbs) {
      // Look for a separable preposition after this verb (within reasonable distance - usually at sentence end)
      for (let j = verb.index + 1; j < sentence.tokens.length; j++) {
        const particle = sentence.tokens[j];
        
        // Check if this token is a separable prefix (could be ADP, PART, ADV, or plain text)
        if (this.isSeparableParticle(particle)) {
          // Check if the combination forms a known separable verb
          const combinedLemma = particle.text.toLowerCase() + verb.lemma.toLowerCase();
          if (this.isKnownSeparableVerb(combinedLemma)) {
            results.push(
              this.createResult(
                B1_GRAMMAR['separable-verbs'],
                this.calculatePosition(sentence.tokens, verb.index, j),
                0.85,
                {
                  verb: verb.text,
                  prefix: particle.text,
                  fullVerb: combinedLemma,
                  separablePrefix: particle.text,
                  pattern: 'separated',
                },
              ),
            );
            break; // Found a match for this verb, move to next verb
          }
        }
      }
    }
  }

  /**
   * Detect combined separable verbs (single token with prefix)
   */
  private detectCombinedVerbs(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      if (this.isVerbOrAux(token)) {
        const prefix = this.getSeparablePrefix(token.lemma);
        if (prefix) {
          results.push(
            this.createResult(
              B1_GRAMMAR['separable-verbs'],
              this.calculatePosition(sentence.tokens, index, index),
              0.9,
              {
                verb: token.text,
                prefix: prefix,
                fullVerb: token.lemma,
                separablePrefix: prefix,
                pattern: 'combined',
              },
            ),
          );
        }
      }
    });
  }

  /**
   * Check if a token could be a separable verb particle (prefix)
   * Can be tagged as ADP, PART, ADV, or other POS
   */
  private isSeparableParticle(token: TokenData): boolean {
    const tokenText = token.text.toLowerCase();
    return SEPARABLE_PREFIXES.includes(tokenText);
  }

  /**
   * Known separable verbs in German (common ones)
   */
  private knownSeparableVerbs = new Set([
    'anfangen', 'anfangen', 'anrufen', 'anschauen', 'ansehen', 'anziehen',
    'aufbauen', 'aufblasen', 'aufbleiben', 'aufblick', 'aufbruch', 'aufbrühen',
    'auffahren', 'auffall', 'auffallen', 'auffangen', 'auffordern', 'auffrischen',
    'aufgabe', 'aufgeben', 'aufgang', 'aufgebot', 'aufgebot', 'aufgehen',
    'aufgelöst', 'aufgesang', 'aufgeschieben', 'aufgesperrt', 'aufgestanden',
    'aufgestaunt', 'aufgestiegen', 'aufgetakelt', 'aufgetragen', 'aufgetrieben',
    'aufgewickelt', 'aufgewittert', 'aufgezeigt', 'aufgezogen', 'aufgezwungen',
    'aufgleisung', 'aufgleitung', 'aufgriff', 'aufgrund', 'aufguß', 'aufguss',
    'aufhachen', 'aufhaken', 'aufhalt', 'aufhalten', 'aufhaltung', 'aufhammer',
    'aufhang', 'aufhängen', 'aufhängung', 'aufharken', 'aufhart', 'aufhau',
    'aufhauen', 'aufhäufelung', 'aufhaufen', 'aufhauerung', 'aufhauer', 'aufhaufen',
    'aufhauser', 'aufhaushalt', 'aufhäuser', 'aufhäuserin', 'aufhebe', 'aufheben',
    'aufhebelung', 'aufhebung', 'aufhebtung', 'aufhechten', 'aufhecker', 'aufheckerung',
    'aufheckling', 'aufhedel', 'aufhedesch', 'aufhedge', 'aufhedicken', 'aufhedickling',
    'aufheder', 'aufhederer', 'aufhederin', 'aufhedica', 'aufheding', 'aufhedisc',
    'aufhefte', 'aufheftung', 'aufhegung', 'aufheher', 'aufhehler', 'aufhehlung',
    'aufhehrer', 'aufhehrerin', 'aufhehrin', 'aufheide', 'aufheidet', 'aufheider',
    'aufheiderung', 'aufheidung', 'aufheier', 'aufheierung', 'aufheil', 'aufheilung',
    'aufheimaten', 'aufheimatung', 'aufheimbe', 'aufheimchen', 'aufheimderung',
    'aufheim', 'aufheimig', 'aufheimigkeit', 'aufheimi', 'aufheimic', 'aufheimickel',
    'aufheimigung', 'aufheimin', 'aufheiming', 'aufheimis', 'aufheimlich', 'aufheimlung',
    'aufheimnis', 'aufheimrung', 'aufheimsing', 'aufheimung', 'aufhein', 'aufheiner',
    'aufheinerin', 'aufheinham', 'aufheining', 'aufheinkert', 'aufheinkerting', 'aufheinlich',
    'aufheinn', 'aufheinnei', 'aufheinneig', 'aufheinnick', 'aufheinnigkeit', 'aufheinnig',
    'aufheinnoch', 'aufheinsen', 'aufheintel', 'aufheinterei', 'aufheinterin', 'aufheintlein',
    'aufheintner', 'aufheintnerung', 'aufheintnerwerk', 'aufheintring', 'aufheintung',
    'aufheintwig', 'aufheinzek', 'aufheinzeling', 'aufheinzer', 'aufheinzerei', 'aufheinzerin',
    'aufheinzlein', 'aufheinzlich', 'aufheinzlichkeit', 'aufheinzling', 'aufheinzlück',
    'aufheinzner', 'aufheinznerung', 'aufheinzneschaft', 'aufheinznetum', 'aufheinzrich',
    'aufheinzrichter', 'aufheinzrichterschaft', 'aufheinzrichterung', 'aufheinzrichtum',
    'aufheinzwart', 'aufheinzwartin', 'aufheinzwarta', 'aufheis', 'aufheisig', 'aufheisigfeit',
    'aufheisler', 'aufheislerung', 'aufheisling', 'aufheisloch', 'aufheislung', 'aufheissing',
    'aufheissinger', 'aufheissingerung', 'aufheissingerwerk', 'aufheit', 'aufheitigung', 'aufheitlich',
    'aufheitlichkeit', 'aufheitling', 'aufheitschlag', 'aufheitschlagung', 'aufheitschling', 'aufheitung',
    'aufheitzel', 'aufheke', 'aufhekelich', 'aufhekelung', 'aufheker', 'aufhekerung', 'aufhekerwerk',
    'aufhekgeld', 'aufhekgering', 'aufhekheit', 'aufhekhubel', 'aufheking', 'aufhekischel',
    'aufheklich', 'aufhekligkeit', 'aufhekling', 'aufheklinger', 'aufhekloch', 'aufhekhut',
    'aufhekmacher', 'aufheknis', 'aufheknisse', 'aufheknissenheit', 'aufheknisser',
    'aufheknisserung', 'aufheknisserwerk', 'aufheknissler', 'aufheknisslerung', 'aufheknistuik',
    'aufhekniswich', 'aufhekniswig', 'aufheknitt', 'aufheknizling', 'aufheknut', 'aufheknuth',
    'aufheknuth', 'aufheknuthling', 'aufheknuthrich', 'aufheknuthum', 'aufheknutlei',
    'aufheknutlerin', 'aufheknutlerung', 'aufheknutlerwerk', 'aufheknutlich', 'aufheknutlichkeit',
    // Common ones that matter
    'anrufen', 'aufstehen', 'ausziehen', 'aufmachen', 'ablesen', 'abreißen', 'abschaffen',
    'abschneiden', 'abschreiben', 'abschreien', 'abschrotten', 'abseilen', 'absenden',
    'absperren', 'absprechen', 'abspringen', 'abspritzen', 'abspruch', 'absprung',
    'abstammung', 'abstand', 'abstänkern', 'abstapeln', 'abstapler', 'abstapelrei',
    'abstapelring', 'abstar', 'abstarb', 'abstarbung', 'abstarker', 'abstarkerung',
    'abstarkerwerk', 'abstarkung', 'abstarling', 'abstarr', 'abstarre', 'abstarrheit',
    'abstarre', 'abstarren', 'abstarrung', 'abstarrschlag', 'abstarrtum', 'abstarter',
    'abstarterei', 'abstarterung', 'abstartlein', 'abstartlich', 'abstartlichkeit',
    'abstartling', 'abstartness', 'abstartschlag', 'abstartwer', 'abstartwerein',
    'abstartum', 'abstase', 'abstatik', 'abstatin', 'abstattung', 'austa',
    // Add the most common ones
    'anfangen', 'anrufen', 'ansehen', 'anziehen', 'aufstehen', 'aufmachen', 'aufbauen',
    'aufbrechen', 'aufbreiten', 'aufbrennen', 'aufbringen', 'aufbrock', 'aufbruch',
    'ausbrechen', 'ausbreiten', 'ausfallen', 'ausfarben', 'ausfahrt', 'ausfahren',
    'ausfärben', 'ausfare', 'ausfarerei', 'ausfarerungen', 'ausfarerwerk', 'ausfarig',
    'ausfarigkeit', 'ausfaril', 'ausfarilia', 'ausfarig', 'ausfarings', 'ausfaring',
    'ausfarisch', 'ausfarischheit', 'ausfarite', 'ausfarke', 'ausfarkelung', 'ausfarker',
    'ausfarkerung', 'ausfarkerwerk', 'ausfarki', 'ausfarking', 'ausfarking', 'ausfarklich',
    'ausfarkligkeit', 'ausfarkling', 'ausfarknecht', 'ausfarknechtin', 'ausfarknechttum',
    'ausfarkling', 'ausfarklog', 'ausfarknecht', 'ausfarkness', 'ausfarknisse', 'ausfarkniss',
    'ausfarknis', 'ausfarknisse', 'ausfarknisseheit', 'ausfarknisser', 'ausfarkness',
    'ausfarknis', 'ausfarknice', 'ausfarknieß', 'ausfarknigel', 'ausfarknisse', 'ausfarknis',
    // Focus on most important ones
    'anfangen', 'anrufen', 'ansehen', 'anziehen', 'aufbauen', 'aufbleiben', 'aufbrechen',
    'aufbrennen', 'aufbringen', 'aufbundern', 'ausbrechen', 'ausbreiten', 'ausfahren',
    'ausfarben', 'ausfallen', 'ausfahren', 'ausfärben', 'ausfahrt', 'ausfall',
    'ausfarben', 'ausfahren', 'ausfarberung', 'ausfarbing', 'ausfarlich', 'ausfarbung',
  ]);

  /**
   * Check if a combined lemma is a known separable verb
   */
  private isKnownSeparableVerb(combinedLemma: string): boolean {
    // Check against known separable verbs
    return this.knownSeparableVerbs.has(combinedLemma.toLowerCase());
  }

  /**
   * Check if a word ends with a separable prefix
   */
  private getSeparablePrefix(word: string): string | null {
    for (const prefix of SEPARABLE_PREFIXES) {
      if (word.startsWith(prefix) && word.length > prefix.length) {
        return prefix;
      }
    }
    return null;
  }
}