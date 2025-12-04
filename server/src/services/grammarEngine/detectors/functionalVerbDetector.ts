/**
 * Functional Verb Detector
 * Identifies B2-level functional verb constructions (Funktionsverbgefüge)
 * Examples: in Frage stellen, zur Verfügung stellen, in Anspruch nehmen
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from './baseDetector';
import { B2_GRAMMAR, GrammarCategory } from '../cefr-taxonomy';

interface FunctionalVerbConstruction {
  verb: string; // Lemma of functional verb
  pattern: string; // Full pattern (e.g., "in Frage stellen")
  prep?: string; // Preposition (if any)
  article?: string; // Article (if any) - "zur" = "zu" + "der"
  noun: string | string[]; // Required noun(s) - can be single noun or array of synonyms
  simpleVerb: string; // Simple equivalent verb
  caseRequired?: string; // Some constructions require specific case
}

interface FunctionalVerbMatch {
  verbIndex: number;
  verbText: string;
  prepIndex?: number;
  prepText?: string;
  nounIndex: number;
  nounText: string;
  construction: FunctionalVerbConstruction;
}

export class FunctionalVerbDetector extends BaseGrammarDetector {
  name = 'FunctionalVerbDetector';
  category: GrammarCategory = 'functional-verb';

  // Database of functional verb constructions from grammar book
  private constructions: FunctionalVerbConstruction[] = [
    // Chapter 4 - mit Akkusativ (with accusative)
    { verb: 'geben', noun: 'Antwort', simpleVerb: 'antworten', pattern: 'Antwort geben' },
    { verb: 'geben', noun: 'Bescheid', simpleVerb: 'benachrichtigen', pattern: 'Bescheid geben' },
    { verb: 'nehmen', noun: 'Abschied', simpleVerb: 'sich verabschieden', pattern: 'Abschied nehmen' },
    { verb: 'leisten', noun: 'Hilfe', simpleVerb: 'helfen', pattern: 'Hilfe leisten' },
    { verb: 'finden', noun: 'Anwendung', simpleVerb: 'angewendet werden', pattern: 'Anwendung finden' },
    { verb: 'finden', noun: 'Beachtung', simpleVerb: 'beachtet werden', pattern: 'Beachtung finden' },
    { verb: 'treffen', noun: 'Entscheidung', simpleVerb: 'entscheiden', pattern: 'Entscheidung treffen' },
    { verb: 'treffen', noun: 'Maßnahme', simpleVerb: 'Maßnahme ergreifen', pattern: 'Maßnahme treffen' },
    
    // Chapter 4 - mit Präpositionalphrase (with prepositional phrase)
    // Note: Use base preposition lemmas (zu, not zur/zum) for matching
    // Note: noun can be string or array for synonym groups
    { verb: 'stellen', prep: 'zu', noun: ['Verfügung', 'Disposition'], simpleVerb: 'verfügbar machen', pattern: 'zur Verfügung stellen' },
    { verb: 'stehen', prep: 'zu', noun: ['Verfügung', 'Disposition'], simpleVerb: 'verfügbar sein', pattern: 'zur Verfügung stehen' },
    { verb: 'stellen', prep: 'in', noun: ['Frage', 'Zweifel'], simpleVerb: 'bezweifeln', pattern: 'in Frage stellen' },
    { verb: 'kommen', prep: 'in', noun: ['Frage', 'Betracht'], simpleVerb: 'möglich sein', pattern: 'in Frage kommen' },
    { verb: 'nehmen', prep: 'in', noun: 'Anspruch', simpleVerb: 'beanspruchen', pattern: 'in Anspruch nehmen' },
    { verb: 'nehmen', prep: 'in', noun: 'Kauf', simpleVerb: 'akzeptieren', pattern: 'in Kauf nehmen' },
    { verb: 'bringen', prep: 'zu', noun: 'Ausdruck', simpleVerb: 'ausdrücken', pattern: 'zum Ausdruck bringen' },
    { verb: 'kommen', prep: 'zu', noun: 'Ausdruck', simpleVerb: 'ausgedrückt werden', pattern: 'zum Ausdruck kommen' },
    { verb: 'bringen', prep: 'in', noun: 'Ordnung', simpleVerb: 'ordnen', pattern: 'in Ordnung bringen' },
    { verb: 'sein', prep: 'in', noun: 'Ordnung', simpleVerb: 'geordnet sein', pattern: 'in Ordnung sein' },
    { verb: 'halten', prep: 'in', noun: 'Ordnung', simpleVerb: 'ordentlich halten', pattern: 'in Ordnung halten' },
    { verb: 'kommen', prep: 'in', noun: 'Gang', simpleVerb: 'anfangen', pattern: 'in Gang kommen' },
    { verb: 'bringen', prep: 'in', noun: 'Gang', simpleVerb: 'starten', pattern: 'in Gang bringen' },
    { verb: 'halten', prep: 'in', noun: 'Gang', simpleVerb: 'weiterlaufen lassen', pattern: 'in Gang halten' },
    { verb: 'nehmen', prep: 'in', noun: 'Betrieb', simpleVerb: 'starten', pattern: 'in Betrieb nehmen' },
    { verb: 'sein', prep: 'in', noun: 'Betrieb', simpleVerb: 'laufen', pattern: 'in Betrieb sein' },
    { verb: 'stellen', prep: 'zu', noun: ['Diskussion', 'Debatte', 'Disposition'], simpleVerb: 'diskutieren', pattern: 'zur Diskussion stellen' },
    { verb: 'stehen', prep: 'zu', noun: ['Diskussion', 'Debatte', 'Wahl', 'Disposition'], simpleVerb: 'diskutiert werden', pattern: 'zur Diskussion stehen' },
    { verb: 'ziehen', prep: 'in', noun: ['Betracht', 'Erwägung'], simpleVerb: 'berücksichtigen', pattern: 'in Betracht ziehen' },
    { verb: 'setzen', prep: 'in', noun: 'Bewegung', simpleVerb: 'bewegen', pattern: 'in Bewegung setzen' },
    { verb: 'nehmen', prep: 'auf', noun: 'Rücksicht', simpleVerb: 'berücksichtigen', pattern: 'auf Rücksicht nehmen' },
    { verb: 'legen', prep: 'auf', noun: 'Wert', simpleVerb: 'wichtig finden', pattern: 'auf Wert legen' },
    
    // Additional common functional verb constructions
    { verb: 'kommen', prep: 'zu', noun: 'Einsatz', simpleVerb: 'eingesetzt werden', pattern: 'zum Einsatz kommen' },
    { verb: 'bringen', prep: 'zu', noun: 'Einsatz', simpleVerb: 'einsetzen', pattern: 'zum Einsatz bringen' },
    { verb: 'treten', prep: 'in', noun: 'Kraft', simpleVerb: 'wirksam werden', pattern: 'in Kraft treten' },
    { verb: 'setzen', prep: 'in', noun: 'Kraft', simpleVerb: 'wirksam machen', pattern: 'in Kraft setzen' },
    { verb: 'setzen', prep: 'außer', noun: 'Kraft', simpleVerb: 'unwirksam machen', pattern: 'außer Kraft setzen' },
    { verb: 'kommen', prep: 'zu', noun: ['Abschluss', 'Ende', 'Schluss'], simpleVerb: 'abgeschlossen werden', pattern: 'zum Abschluss kommen' },
    { verb: 'bringen', prep: 'zu', noun: ['Abschluss', 'Ende'], simpleVerb: 'abschließen', pattern: 'zum Abschluss bringen' },
    { verb: 'nehmen', prep: 'in', noun: 'Empfang', simpleVerb: 'empfangen', pattern: 'in Empfang nehmen' },
    { verb: 'stellen', prep: 'unter', noun: 'Beweis', simpleVerb: 'beweisen', pattern: 'unter Beweis stellen' },
    { verb: 'kommen', prep: 'zu', noun: 'Wort', simpleVerb: 'sprechen dürfen', pattern: 'zu Wort kommen' },
    { verb: 'lassen', prep: 'zu', noun: 'Wort', simpleVerb: 'sprechen lassen', pattern: 'zu Wort kommen lassen' },
    { verb: 'nehmen', prep: 'in', noun: 'Schutz', simpleVerb: 'schützen', pattern: 'in Schutz nehmen' },
    { verb: 'stellen', prep: 'in', noun: 'Aussicht', simpleVerb: 'versprechen', pattern: 'in Aussicht stellen' },
    { verb: 'bringen', prep: 'in', noun: 'Gefahr', simpleVerb: 'gefährden', pattern: 'in Gefahr bringen' },
    { verb: 'geraten', prep: 'in', noun: 'Gefahr', simpleVerb: 'gefährdet werden', pattern: 'in Gefahr geraten' },
    { verb: 'bringen', prep: 'in', noun: ['Verbindung', 'Zusammenhang'], simpleVerb: 'verbinden', pattern: 'in Verbindung bringen' },
    { verb: 'stehen', prep: 'in', noun: ['Verbindung', 'Zusammenhang', 'Kontakt'], simpleVerb: 'verbunden sein', pattern: 'in Verbindung stehen' },
    { verb: 'stellen', prep: 'in', noun: 'Abrede', simpleVerb: 'bestreiten', pattern: 'in Abrede stellen' },
    { verb: 'ausüben', prep: 'auf', noun: 'Einfluss', simpleVerb: 'beeinflussen', pattern: 'Einfluss ausüben' },
    { verb: 'nehmen', prep: 'auf', noun: 'Einfluss', simpleVerb: 'beeinflussen', pattern: 'Einfluss nehmen' },
    // Accusative versions (auf phrase is separate/optional)
    { verb: 'ausüben', noun: 'Einfluss', simpleVerb: 'beeinflussen', pattern: 'Einfluss ausüben' },
    { verb: 'nehmen', noun: 'Einfluss', simpleVerb: 'beeinflussen', pattern: 'Einfluss nehmen' },
    { verb: 'legen', noun: 'Wert', simpleVerb: 'wichtig finden', pattern: 'Wert legen' },
    { verb: 'führen', noun: 'Krieg', simpleVerb: 'kämpfen', pattern: 'Krieg führen' },
    { verb: 'führen', noun: 'Gespräch', simpleVerb: 'sprechen', pattern: 'Gespräch führen' },
    { verb: 'erstatten', noun: 'Bericht', simpleVerb: 'berichten', pattern: 'Bericht erstatten' },
    { verb: 'leisten', noun: 'Beitrag', simpleVerb: 'beitragen', pattern: 'Beitrag leisten' },
    { verb: 'erheben', noun: 'Einspruch', simpleVerb: 'widersprechen', pattern: 'Einspruch erheben' },
    { verb: 'erheben', noun: 'Anklage', simpleVerb: 'anklagen', pattern: 'Anklage erheben' },
    { verb: 'erheben', noun: 'Vorwurf', simpleVerb: 'vorwerfen', pattern: 'Vorwurf erheben' },
    { verb: 'stellen', noun: 'Antrag', simpleVerb: 'beantragen', pattern: 'Antrag stellen' },
    { verb: 'stellen', noun: 'Forderung', simpleVerb: 'fordern', pattern: 'Forderung stellen' },
    { verb: 'üben', noun: 'Kritik', simpleVerb: 'kritisieren', pattern: 'Kritik üben' },
    
    // High-frequency patterns - finden (find/receive)
    { verb: 'finden', noun: 'Anerkennung', simpleVerb: 'anerkannt werden', pattern: 'Anerkennung finden' },
    { verb: 'finden', noun: 'Zustimmung', simpleVerb: 'zugestimmt werden', pattern: 'Zustimmung finden' },
    { verb: 'finden', noun: 'Unterstützung', simpleVerb: 'unterstützt werden', pattern: 'Unterstützung finden' },
    { verb: 'finden', noun: 'Verwendung', simpleVerb: 'verwendet werden', pattern: 'Verwendung finden' },
    { verb: 'finden', noun: 'Berücksichtigung', simpleVerb: 'berücksichtigt werden', pattern: 'Berücksichtigung finden' },
    
    // High-frequency patterns - nehmen (take)
    { verb: 'nehmen', noun: 'Aufschwung', simpleVerb: 'florieren', pattern: 'Aufschwung nehmen' },
    { verb: 'nehmen', noun: 'Bezug', simpleVerb: 'sich beziehen', pattern: 'Bezug nehmen' },
    { verb: 'nehmen', noun: 'Stellung', simpleVerb: 'sich äußern', pattern: 'Stellung nehmen' },
    { verb: 'nehmen', noun: 'Kontakt', simpleVerb: 'kontaktieren', pattern: 'Kontakt nehmen' },
    { verb: 'nehmen', noun: 'Platz', simpleVerb: 'sich setzen', pattern: 'Platz nehmen' },
    { verb: 'nehmen', noun: 'Teil', simpleVerb: 'teilnehmen', pattern: 'Teil nehmen' },
    { verb: 'nehmen', noun: 'Notiz', simpleVerb: 'bemerken', pattern: 'Notiz nehmen' },
    
    // High-frequency patterns - geben (give)
    { verb: 'geben', noun: 'Auskunft', simpleVerb: 'informieren', pattern: 'Auskunft geben' },
    { verb: 'geben', noun: 'Unterricht', simpleVerb: 'unterrichten', pattern: 'Unterricht geben' },
    { verb: 'geben', noun: 'Erlaubnis', simpleVerb: 'erlauben', pattern: 'Erlaubnis geben' },
    { verb: 'geben', noun: 'Rat', simpleVerb: 'raten', pattern: 'Rat geben' },
    { verb: 'geben', noun: 'Versprechen', simpleVerb: 'versprechen', pattern: 'Versprechen geben' },
    
    // High-frequency patterns - machen (make)
    { verb: 'machen', noun: 'Fortschritt', simpleVerb: 'fortschreiten', pattern: 'Fortschritt machen' },
    { verb: 'machen', noun: 'Schluss', simpleVerb: 'beenden', pattern: 'Schluss machen' },
    { verb: 'machen', noun: 'Eindruck', simpleVerb: 'beeindrucken', pattern: 'Eindruck machen' },
    { verb: 'machen', noun: 'Vorschlag', simpleVerb: 'vorschlagen', pattern: 'Vorschlag machen' },
    { verb: 'machen', noun: 'Gebrauch', simpleVerb: 'gebrauchen', pattern: 'Gebrauch machen' },
    { verb: 'machen', noun: 'Bemerkung', simpleVerb: 'bemerken', pattern: 'Bemerkung machen' },
    
    // High-frequency patterns - kommen with zu
    { verb: 'kommen', prep: 'zu', noun: 'Wirkung', simpleVerb: 'wirken', pattern: 'zur Wirkung kommen' },
    { verb: 'kommen', prep: 'zu', noun: 'Anwendung', simpleVerb: 'angewendet werden', pattern: 'zur Anwendung kommen' },
    { verb: 'kommen', prep: 'zu', noun: 'Durchführung', simpleVerb: 'durchgeführt werden', pattern: 'zur Durchführung kommen' },
    { verb: 'kommen', prep: 'zu', noun: 'Aufführung', simpleVerb: 'aufgeführt werden', pattern: 'zur Aufführung kommen' },
    { verb: 'kommen', prep: 'zu', noun: 'Sprache', simpleVerb: 'erwähnt werden', pattern: 'zur Sprache kommen' },
    { verb: 'kommen', prep: 'zu', noun: 'Ruhe', simpleVerb: 'ruhig werden', pattern: 'zur Ruhe kommen' },
    { verb: 'kommen', prep: 'zu', noun: 'Stillstand', simpleVerb: 'stillstehen', pattern: 'zum Stillstand kommen' },
    { verb: 'kommen', prep: 'zu', noun: 'Ergebnis', simpleVerb: 'resultieren', pattern: 'zum Ergebnis kommen' },
    { verb: 'kommen', prep: 'zu', noun: 'Entschluss', simpleVerb: 'sich entschließen', pattern: 'zum Entschluss kommen' },
    { verb: 'kommen', prep: 'zu', noun: 'Gründung', simpleVerb: 'gegründet werden', pattern: 'zur Gründung kommen' },
    
    // High-frequency patterns - bringen with zu
    { verb: 'bringen', prep: 'zu', noun: 'Aufführung', simpleVerb: 'aufführen', pattern: 'zur Aufführung bringen' },
    { verb: 'bringen', prep: 'zu', noun: 'Durchführung', simpleVerb: 'durchführen', pattern: 'zur Durchführung bringen' },
    { verb: 'bringen', prep: 'zu', noun: 'Anwendung', simpleVerb: 'anwenden', pattern: 'zur Anwendung bringen' },
    { verb: 'bringen', prep: 'zu', noun: 'Sprache', simpleVerb: 'erwähnen', pattern: 'zur Sprache bringen' },
    { verb: 'bringen', prep: 'zu', noun: 'Ruhe', simpleVerb: 'beruhigen', pattern: 'zur Ruhe bringen' },
    { verb: 'bringen', prep: 'zu', noun: 'Stillstand', simpleVerb: 'stoppen', pattern: 'zum Stillstand bringen' },
    
    // High-frequency patterns - stellen with zu
    { verb: 'stellen', prep: 'zu', noun: 'Rede', simpleVerb: 'konfrontieren', pattern: 'zur Rede stellen' },
    { verb: 'stellen', prep: 'zu', noun: 'Schau', simpleVerb: 'zeigen', pattern: 'zur Schau stellen' },
    
    // High-frequency patterns - with in
    { verb: 'setzen', prep: 'in', noun: 'Kenntnis', simpleVerb: 'informieren', pattern: 'in Kenntnis setzen' },
    { verb: 'nehmen', prep: 'in', noun: 'Besitz', simpleVerb: 'übernehmen', pattern: 'in Besitz nehmen' },
    { verb: 'bringen', prep: 'in', noun: 'Erfahrung', simpleVerb: 'erfahren', pattern: 'in Erfahrung bringen' },
    { verb: 'kommen', prep: 'in', noun: 'Konflikt', simpleVerb: 'konfligieren', pattern: 'in Konflikt kommen' },
    { verb: 'geraten', prep: 'in', noun: 'Konflikt', simpleVerb: 'konfligieren', pattern: 'in Konflikt geraten' },
    { verb: 'geraten', prep: 'in', noun: 'Not', simpleVerb: 'verarmen', pattern: 'in Not geraten' },
    { verb: 'geraten', prep: 'in', noun: 'Vergessenheit', simpleVerb: 'vergessen werden', pattern: 'in Vergessenheit geraten' },
    { verb: 'geraten', prep: 'in', noun: 'Panik', simpleVerb: 'panisch werden', pattern: 'in Panik geraten' },
    { verb: 'halten', prep: 'in', noun: 'Schach', simpleVerb: 'kontrollieren', pattern: 'in Schach halten' },
    
    // High-frequency patterns - aufnehmen (take up)
    { verb: 'aufnehmen', noun: 'Kontakt', simpleVerb: 'kontaktieren', pattern: 'Kontakt aufnehmen' },
    { verb: 'aufnehmen', noun: 'Beziehung', simpleVerb: 'Beziehung beginnen', pattern: 'Beziehung aufnehmen' },
    { verb: 'aufnehmen', noun: 'Verhandlung', simpleVerb: 'verhandeln', pattern: 'Verhandlung aufnehmen' },
    { verb: 'aufnehmen', noun: 'Arbeit', simpleVerb: 'arbeiten beginnen', pattern: 'Arbeit aufnehmen' },
    { verb: 'aufnehmen', noun: 'Tätigkeit', simpleVerb: 'tätig werden', pattern: 'Tätigkeit aufnehmen' },
    
    // High-frequency patterns - leisten (provide/perform)
    { verb: 'leisten', noun: 'Widerstand', simpleVerb: 'widerstehen', pattern: 'Widerstand leisten' },
    { verb: 'leisten', noun: 'Arbeit', simpleVerb: 'arbeiten', pattern: 'Arbeit leisten' },
    { verb: 'leisten', noun: 'Dienst', simpleVerb: 'dienen', pattern: 'Dienst leisten' },
    
    // High-frequency patterns - haben (have)
    { verb: 'haben', noun: 'Einfluss', simpleVerb: 'beeinflussen', pattern: 'Einfluss haben' },
    { verb: 'haben', noun: 'Auswirkung', simpleVerb: 'auswirken', pattern: 'Auswirkung haben' },
    { verb: 'haben', noun: 'Bedeutung', simpleVerb: 'bedeuten', pattern: 'Bedeutung haben' },
    { verb: 'haben', noun: 'Gültigkeit', simpleVerb: 'gelten', pattern: 'Gültigkeit haben' },
    
    // High-frequency patterns - setzen (set/put)
    { verb: 'setzen', noun: 'Vertrauen', simpleVerb: 'vertrauen', pattern: 'Vertrauen setzen' },
    { verb: 'setzen', noun: 'Hoffnung', simpleVerb: 'hoffen', pattern: 'Hoffnung setzen' },
    { verb: 'setzen', noun: 'Priorität', simpleVerb: 'priorisieren', pattern: 'Priorität setzen' },
    
    // High-frequency patterns - with auf
    { verb: 'stoßen', prep: 'auf', noun: 'Widerstand', simpleVerb: 'behindert werden', pattern: 'auf Widerstand stoßen' },
    { verb: 'stoßen', prep: 'auf', noun: 'Ablehnung', simpleVerb: 'abgelehnt werden', pattern: 'auf Ablehnung stoßen' },
    { verb: 'stoßen', prep: 'auf', noun: 'Schwierigkeit', simpleVerb: 'Schwierigkeiten haben', pattern: 'auf Schwierigkeit stoßen' },
    { verb: 'treffen', prep: 'auf', noun: 'Widerstand', simpleVerb: 'behindert werden', pattern: 'auf Widerstand treffen' },
    
    // High-frequency patterns - with unter
    { verb: 'stehen', prep: 'unter', noun: 'Druck', simpleVerb: 'unter Druck sein', pattern: 'unter Druck stehen' },
    { verb: 'stehen', prep: 'unter', noun: 'Einfluss', simpleVerb: 'beeinflusst werden', pattern: 'unter Einfluss stehen' },
    { verb: 'stellen', prep: 'unter', noun: 'Druck', simpleVerb: 'bedrängen', pattern: 'unter Druck stellen' },
    
    // High-frequency patterns - with außer
    { verb: 'stellen', prep: 'außer', noun: 'Frage', simpleVerb: 'ausschließen', pattern: 'außer Frage stellen' },
    { verb: 'stehen', prep: 'außer', noun: 'Frage', simpleVerb: 'unbestritten sein', pattern: 'außer Frage stehen' },
    
    // High-frequency patterns - with von
    { verb: 'nehmen', prep: 'von', noun: 'Kenntnis', simpleVerb: 'zur Kenntnis nehmen', pattern: 'Kenntnis nehmen' },
    { verb: 'machen', prep: 'von', noun: 'Gebrauch', simpleVerb: 'gebrauchen', pattern: 'Gebrauch machen' },
  ];

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Find all potential functional verbs in sentence
    sentence.tokens.forEach((token, index) => {
      
      if (token.pos !== 'VERB' && token.pos !== 'AUX') {
        return;
      }

      const match = this.findFunctionalConstruction(sentence.tokens, index);
      if (match) {
        results.push(this.createFunctionalVerbResult(sentence, match));
      }
    });

    return results;
  }

  /**
   * Find functional verb construction for a verb
   */
  private findFunctionalConstruction(
    tokens: TokenData[],
    verbIndex: number
  ): FunctionalVerbMatch | null {
    const verb = tokens[verbIndex];
    const clauseStart = this.findClauseStart(tokens, verbIndex);
    const clauseEnd = this.findClauseEnd(tokens, verbIndex);

    // Get all constructions for this verb lemma
    const verbConstructions = this.constructions.filter(
      (c) => c.verb === verb.lemma.toLowerCase()
    );

    if (verbConstructions.length === 0) {
      return null;
    }

    // Search for matching construction in clause
    for (const construction of verbConstructions) {
      const match = this.matchConstructionInClause(
        tokens,
        clauseStart,
        clauseEnd,
        verbIndex,
        construction
      );

      if (match) {
        return match;
      }
    }

    return null;
  }

  /**
   * Try to match a construction pattern within clause boundaries
   */
  private matchConstructionInClause(
    tokens: TokenData[],
    clauseStart: number,
    clauseEnd: number,
    verbIndex: number,
    construction: FunctionalVerbConstruction
  ): FunctionalVerbMatch | null {
    const verb = tokens[verbIndex];

    // Search for noun within clause
    for (let i = clauseStart; i <= clauseEnd; i++) {
      if (i === verbIndex) continue;

      const token = tokens[i];

      // Check if this is the required noun (handle both single noun and noun array)
      const nounMatches = Array.isArray(construction.noun)
        ? construction.noun.some(n => token.lemma.toLowerCase() === n.toLowerCase())
        : token.lemma.toLowerCase() === construction.noun.toLowerCase();
      
      if (token.pos === 'NOUN' && nounMatches) {
        // Found the noun - now check for preposition if required
        if (construction.prep) {
          const prepMatch = this.findPrepositionBeforeNoun(
            tokens,
            i,
            construction.prep
          );
          
          if (prepMatch !== null) {
            // Validate article usage
            if (this.shouldRejectDueToArticle(tokens, i, true, prepMatch)) {
              continue;
            }

            return {
              verbIndex,
              verbText: verb.text,
              prepIndex: prepMatch,
              prepText: tokens[prepMatch].text,
              nounIndex: i,
              nounText: token.text,
              construction,
            };
          }
        } else {
          // No preposition required - just verb + noun
          // Validate: noun should not have article
          if (this.shouldRejectDueToArticle(tokens, i, false)) {
            continue;
          }

          return {
            verbIndex,
            verbText: verb.text,
            nounIndex: i,
            nounText: token.text,
            construction,
          };
        }
      }
    }

    return null;
  }

  /**
   * Check if noun should be rejected based on article presence
   * For accusative functional verbs (no preposition), articles are allowed
   * For prepositional functional verbs, articles may be part of the construction
   */
  private shouldRejectDueToArticle(
    tokens: TokenData[],
    nounIndex: number,
    hasPreposition: boolean,
    prepIndex?: number
  ): boolean {
    // For accusative patterns (no preposition), allow articles
    // Examples: "eine Entscheidung treffen", "ein Gespräch führen" are grammatically correct
    if (!hasPreposition) {
      return false;
    }

    // For prepositional constructions:
    // - If preposition is contracted (APPRART like zur/zum), article is built-in - accept it
    // - If preposition is plain (ADP), check if there's a separate article between prep and noun
    if (prepIndex !== undefined) {
      const prepToken = tokens[prepIndex];
      
      // Contracted preposition (zur/zum/am/im) - article is part of construction, accept it
      if (this.isContractedPreposition(prepToken)) {
        return false;
      }

      // Plain preposition - check for separate article between prep and noun
      for (let i = prepIndex + 1; i < nounIndex; i++) {
        const token = tokens[i];
        // spaCy German uses 'ART' for articles, not 'DET'
        if ((token.pos === 'DET' || token.pos === 'ART') && ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'eines'].includes(token.text.toLowerCase())) {
          return true; // Has separate article - not functional verb
        }
      }
    }

    return false;
  }

  /**
   * Create detection result with multi-range positions
   */
  private createFunctionalVerbResult(
    sentence: SentenceData,
    match: FunctionalVerbMatch
  ): DetectionResult {
    // Build array of indices for multi-range highlighting
    const indices = [match.verbIndex];
    if (match.prepIndex !== undefined) {
      indices.push(match.prepIndex);
    }
    indices.push(match.nounIndex);

    // Format compact display string
    const compactForm = match.prepText
      ? `${match.verbText} ... ${match.prepText} ${match.nounText}`
      : `${match.verbText} ... ${match.nounText}`;

    return {
      grammarPointId: 'b2-functional-verb',
      grammarPoint: B2_GRAMMAR['functional-verb-construction'],

      // Multi-range positions for precise highlighting
      positions: this.calculateMultiplePositions(sentence.tokens, indices),

      // Legacy single range (full span for backward compatibility)
      position: this.calculatePosition(
        sentence.tokens,
        Math.min(...indices),
        Math.max(...indices)
      ),

      confidence: 0.95,

      details: {
        // Component positions and text
        verb: {
          text: match.verbText,
          position: sentence.tokens[match.verbIndex].characterStart,
        },
        preposition: match.prepText
          ? {
              text: match.prepText,
              position: sentence.tokens[match.prepIndex!].characterStart,
            }
          : undefined,
        noun: {
          text: match.nounText,
          position: sentence.tokens[match.nounIndex].characterStart,
        },

        // Display strings
        compactForm, // "stellt ... in Frage"
        fullConstruction: match.construction.pattern, // "in Frage stellen"
        simpleVerb: match.construction.simpleVerb, // "bezweifeln"
        register: 'formal',
      },
    };
  }
}
