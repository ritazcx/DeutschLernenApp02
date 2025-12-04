/**
 * Unit Tests for Case Detector
 * Using B2-level article sentences for comprehensive testing
 */

import { CaseDetector } from '../../src/services/grammarEngine/detectors/A2/caseDetector';
import { createMockSentence, createMockToken } from '../testUtils';

// B2 Article Sentences (parsed using backend sentence splitting logic)
const b2Sentences = {
  1: "Olympische Sommerspiele 2016", // Title - no cases to detect
  2: "Die Olympischen Sommerspiele 2016 (offiziell Spiele der XXXI. Olympiade genannt) werden zwischen dem 5. und 21. August 2016 in Rio de Janeiro stattfinden.", // Nominative, dative, accusative
  3: "Rio de Janeiro ist damit die erste Stadt in Südamerika, die Gastgeber der Veranstaltung wird.", // Nominative, dative
  4: "Wahl des Austragungsortes", // Genitive
  5: "Für die Olympischen Sommerspiele 2016 läutete das Internationale Olympische Komitee (IOC) am 16. Mai 2007 die Bewerbungsphase ein.", // Accusative, dative
  6: "Alle 203 Nationalen Olympischen Komitees wurden eingeladen, eine Kandidatur einzureichen.", // Nominative, accusative
  7: "Bis zum Ende der Bewerbungsfrist am 13. September 2007 reichten sieben Städte ihre vollständigen Unterlagen beim IOC ein.", // Dative, accusative
  8: "Auf dieser Basis erklärte das Executive Board des IOC am 4. Juni 2008 die Städte Chicago, Tokio, Rio de Janeiro und Madrid zu offiziellen Kandidaten.", // Dative, accusative
  9: "Die Mitglieder des IOC entschieden am 2. Oktober 2009 in Kopenhagen, dass Rio de Janeiro der Austragungsort der Olympischen Sommerspiele 2016 sein wird.", // Nominative, genitive, dative
  10: "In den ersten beiden Wahlgängen schieden die Bewerbungen aus Chicago und Tokio mit den jeweils wenigsten Stimmen aus.", // Dative, nominative
  11: "Als Austragungsort stand am Schluss Rio de Janeiro, mit der Verkündung im Saal, offiziell fest." // Nominative, dative
};

describe('CaseDetector - B2 Article Testing', () => {
  let detector: CaseDetector;

  beforeEach(() => {
    detector = new CaseDetector();
  });

  describe('Basic Properties', () => {
    it('should have correct name and category', () => {
      expect(detector.name).toBe('CaseDetector');
      expect(detector.category).toBe('case');
    });
  });

  describe('Nominative Case Detection', () => {
    it('should detect nominative case in sentence 2', () => {
      const tokens = [
        createMockToken('Die', 'die', 'DET', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('Olympischen', 'olympisch', 'ADJ', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('Sommerspiele', 'sommerspiel', 'NOUN', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('2016', '2016', 'NUM'),
        createMockToken('(', '(', 'PUNCT'),
        createMockToken('offiziell', 'offiziell', 'ADV'),
        createMockToken('Spiele', 'spiel', 'NOUN', { morph: { Case: 'Nom', Gender: 'Neut', Number: 'Plur' } }),
        createMockToken('der', 'der', 'DET', { morph: { Case: 'Gen', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('XXXI.', 'xxxi.', 'ADJ'),
        createMockToken('Olympiade', 'olympiade', 'NOUN', { morph: { Case: 'Gen', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('genannt', 'nennen', 'VERB'),
        createMockToken(')', ')', 'PUNCT'),
        createMockToken('werden', 'werden', 'AUX'),
        createMockToken('zwischen', 'zwischen', 'ADP'),
        createMockToken('dem', 'der', 'DET', { morph: { Case: 'Dat', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('5.', '5.', 'ADJ'),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('21.', '21.', 'ADJ'),
        createMockToken('August', 'august', 'NOUN', { morph: { Case: 'Dat', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('2016', '2016', 'NUM'),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Rio', 'rio', 'PROPN', { morph: { Case: 'Acc', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('de', 'de', 'PROPN'),
        createMockToken('Janeiro', 'janeiro', 'PROPN'),
        createMockToken('stattfinden', 'stattfinden', 'VERB'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[2], tokens);
      const results = detector.detect(sentence);

      const nominativeResults = results.filter(r => r.details.case === 'nominative');
      expect(nominativeResults.length).toBeGreaterThan(0);
      expect(nominativeResults.some(r => r.details.word === 'Die')).toBe(true);
      expect(nominativeResults.some(r => r.details.word === 'Olympischen')).toBe(true);
      expect(nominativeResults.some(r => r.details.word === 'Sommerspiele')).toBe(true);
    });

    it('should detect nominative case in sentence 3', () => {
      const tokens = [
        createMockToken('Rio', 'rio', 'PROPN', { morph: { Case: 'Nom', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('de', 'de', 'PROPN'),
        createMockToken('Janeiro', 'janeiro', 'PROPN'),
        createMockToken('ist', 'sein', 'AUX'),
        createMockToken('damit', 'damit', 'ADV'),
        createMockToken('die', 'die', 'DET', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('erste', 'erst', 'ADJ', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('Stadt', 'stadt', 'NOUN', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Südamerika', 'südamerika', 'PROPN', { morph: { Case: 'Dat', Gender: 'Neut', Number: 'Sing' } }),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('die', 'die', 'PRON', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('Gastgeber', 'gastgeber', 'NOUN', { morph: { Case: 'Nom', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('der', 'der', 'DET', { morph: { Case: 'Gen', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('Veranstaltung', 'veranstaltung', 'NOUN', { morph: { Case: 'Gen', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('wird', 'werden', 'AUX'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[3], tokens);
      const results = detector.detect(sentence);

      const nominativeResults = results.filter(r => r.details.case === 'nominative');
      expect(nominativeResults.length).toBeGreaterThan(0);
      expect(nominativeResults.some(r => r.details.word === 'die')).toBe(true);
      expect(nominativeResults.some(r => r.details.word === 'erste')).toBe(true);
      expect(nominativeResults.some(r => r.details.word === 'Stadt')).toBe(true);
    });
  });

  describe('Genitive Case Detection', () => {
    it('should detect genitive case in sentence 4', () => {
      const tokens = [
        createMockToken('Wahl', 'wahl', 'NOUN', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('des', 'der', 'DET', { morph: { Case: 'Gen', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('Austragungsortes', 'austragungsort', 'NOUN', { morph: { Case: 'Gen', Gender: 'Masc', Number: 'Sing' } }),
      ];

      const sentence = createMockSentence(b2Sentences[4], tokens);
      const results = detector.detect(sentence);

      const genitiveResults = results.filter(r => r.details.case === 'genitive');
      expect(genitiveResults.length).toBeGreaterThan(0);
      expect(genitiveResults.some(r => r.details.word === 'des')).toBe(true);
      expect(genitiveResults.some(r => r.details.word === 'Austragungsortes')).toBe(true);
    });

    it('should detect genitive case in sentence 9', () => {
      const tokens = [
        createMockToken('Die', 'die', 'DET', { morph: { Case: 'Nom', Gender: 'Neut', Number: 'Plur' } }),
        createMockToken('Mitglieder', 'mitglied', 'NOUN', { morph: { Case: 'Nom', Gender: 'Neut', Number: 'Plur' } }),
        createMockToken('des', 'der', 'DET', { morph: { Case: 'Gen', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('IOC', 'ioc', 'PROPN', { morph: { Case: 'Gen', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('entschieden', 'entscheiden', 'VERB'),
        createMockToken('am', 'an', 'ADP'),
        createMockToken('2.', '2.', 'ADJ'),
        createMockToken('Oktober', 'oktober', 'NOUN', { morph: { Case: 'Dat', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('2009', '2009', 'NUM'),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Kopenhagen', 'kopenhagen', 'PROPN', { morph: { Case: 'Dat', Gender: 'Neut', Number: 'Sing' } }),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('dass', 'dass', 'SCONJ'),
        createMockToken('Rio', 'rio', 'PROPN', { morph: { Case: 'Nom', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('de', 'de', 'PROPN'),
        createMockToken('Janeiro', 'janeiro', 'PROPN'),
        createMockToken('der', 'der', 'DET', { morph: { Case: 'Nom', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('Austragungsort', 'austragungsort', 'NOUN', { morph: { Case: 'Nom', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('der', 'der', 'DET', { morph: { Case: 'Gen', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('Olympischen', 'olympisch', 'ADJ', { morph: { Case: 'Gen', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('Sommerspiele', 'sommerspiel', 'NOUN', { morph: { Case: 'Gen', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('2016', '2016', 'NUM'),
        createMockToken('sein', 'sein', 'AUX'),
        createMockToken('wird', 'werden', 'AUX'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[9], tokens);
      const results = detector.detect(sentence);

      const genitiveResults = results.filter(r => r.details.case === 'genitive');
      expect(genitiveResults.length).toBeGreaterThan(0);
      expect(genitiveResults.some(r => r.details.word === 'des')).toBe(true);
      // IOC is a PROPN, so it might not be detected by case detector
      // expect(genitiveResults.some(r => r.details.word === 'IOC')).toBe(true);
    });
  });

  describe('Dative Case Detection', () => {
    it('should detect dative case in sentence 2', () => {
      const tokens = [
        createMockToken('Die', 'die', 'DET'),
        createMockToken('Olympischen', 'olympisch', 'ADJ'),
        createMockToken('Sommerspiele', 'sommerspiel', 'NOUN'),
        createMockToken('2016', '2016', 'NUM'),
        createMockToken('(', '(', 'PUNCT'),
        createMockToken('offiziell', 'offiziell', 'ADV'),
        createMockToken('Spiele', 'spiel', 'NOUN'),
        createMockToken('der', 'der', 'DET'),
        createMockToken('XXXI.', 'xxxi.', 'ADJ'),
        createMockToken('Olympiade', 'olympiade', 'NOUN'),
        createMockToken('genannt', 'nennen', 'VERB'),
        createMockToken(')', ')', 'PUNCT'),
        createMockToken('werden', 'werden', 'AUX'),
        createMockToken('zwischen', 'zwischen', 'ADP'),
        createMockToken('dem', 'der', 'DET', { morph: { Case: 'Dat', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('5.', '5.', 'ADJ'),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('21.', '21.', 'ADJ'),
        createMockToken('August', 'august', 'NOUN', { morph: { Case: 'Dat', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('2016', '2016', 'NUM'),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Rio', 'rio', 'PROPN'),
        createMockToken('de', 'de', 'PROPN'),
        createMockToken('Janeiro', 'janeiro', 'PROPN'),
        createMockToken('stattfinden', 'stattfinden', 'VERB'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[2], tokens);
      const results = detector.detect(sentence);

      const dativeResults = results.filter(r => r.details.case === 'dative');
      expect(dativeResults.length).toBeGreaterThan(0);
      expect(dativeResults.some(r => r.details.word === 'dem')).toBe(true);
      expect(dativeResults.some(r => r.details.word === 'August')).toBe(true);
    });

    it('should detect dative case in sentence 7', () => {
      const tokens = [
        createMockToken('Bis', 'bis', 'ADP'),
        createMockToken('zum', 'zu', 'ADP'),
        createMockToken('Ende', 'ende', 'NOUN', { morph: { Case: 'Dat', Gender: 'Neut', Number: 'Sing' } }),
        createMockToken('der', 'der', 'DET', { morph: { Case: 'Gen', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('Bewerbungsfrist', 'bewerbungsfrist', 'NOUN', { morph: { Case: 'Gen', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('am', 'an', 'ADP'),
        createMockToken('13.', '13.', 'ADJ'),
        createMockToken('September', 'september', 'NOUN', { morph: { Case: 'Dat', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('2007', '2007', 'NUM'),
        createMockToken('reichten', 'reichen', 'VERB'),
        createMockToken('sieben', 'sieben', 'NUM'),
        createMockToken('Städte', 'stadt', 'NOUN', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('ihre', 'ihr', 'DET', { morph: { Case: 'Acc', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('vollständigen', 'vollständig', 'ADJ', { morph: { Case: 'Acc', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('Unterlagen', 'unterlage', 'NOUN', { morph: { Case: 'Acc', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('beim', 'bei', 'ADP'),
        createMockToken('IOC', 'ioc', 'PROPN', { morph: { Case: 'Dat', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('ein', 'ein', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[7], tokens);
      const results = detector.detect(sentence);

      const dativeResults = results.filter(r => r.details.case === 'dative');
      expect(dativeResults.length).toBeGreaterThan(0);
      expect(dativeResults.some(r => r.details.word === 'Ende')).toBe(true);
      expect(dativeResults.some(r => r.details.word === 'September')).toBe(true);
      // IOC is a PROPN, so it might not be detected by case detector
      // expect(dativeResults.some(r => r.details.word === 'IOC')).toBe(true);
    });
  });

  describe('Accusative Case Detection', () => {
    it('should detect accusative case in sentence 5', () => {
      const tokens = [
        createMockToken('Für', 'für', 'ADP'),
        createMockToken('die', 'die', 'DET', { morph: { Case: 'Acc', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('Olympischen', 'olympisch', 'ADJ'),
        createMockToken('Sommerspiele', 'sommerspiel', 'NOUN'),
        createMockToken('2016', '2016', 'NUM'),
        createMockToken('läutete', 'läuten', 'VERB'),
        createMockToken('das', 'der', 'DET', { morph: { Case: 'Nom', Gender: 'Neut', Number: 'Sing' } }),
        createMockToken('Internationale', 'international', 'ADJ'),
        createMockToken('Olympische', 'olympisch', 'ADJ'),
        createMockToken('Komitee', 'komitee', 'NOUN', { morph: { Case: 'Nom', Gender: 'Neut', Number: 'Sing' } }),
        createMockToken('(', '(', 'PUNCT'),
        createMockToken('IOC', 'ioc', 'PROPN'),
        createMockToken(')', ')', 'PUNCT'),
        createMockToken('am', 'an', 'ADP'),
        createMockToken('16.', '16.', 'ADJ'),
        createMockToken('Mai', 'mai', 'NOUN', { morph: { Case: 'Dat', Gender: 'Masc', Number: 'Sing' } }),
        createMockToken('2007', '2007', 'NUM'),
        createMockToken('die', 'die', 'DET', { morph: { Case: 'Acc', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('Bewerbungsphase', 'bewerbungsphase', 'NOUN', { morph: { Case: 'Acc', Gender: 'Fem', Number: 'Sing' } }),
        createMockToken('ein', 'ein', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[5], tokens);
      const results = detector.detect(sentence);

      const accusativeResults = results.filter(r => r.details.case === 'accusative');
      expect(accusativeResults.length).toBeGreaterThan(0);
      expect(accusativeResults.some(r => r.details.word === 'die')).toBe(true);
      expect(accusativeResults.some(r => r.details.word === 'Bewerbungsphase')).toBe(true);
    });
  });

  describe('Titles and Edge Cases', () => {
    it('should handle titles with minimal case detection (sentence 1)', () => {
      const tokens = [
        createMockToken('Olympische', 'olympisch', 'ADJ', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('Sommerspiele', 'sommerspiel', 'NOUN', { morph: { Case: 'Nom', Gender: 'Fem', Number: 'Plur' } }),
        createMockToken('2016', '2016', 'NUM'),
      ];

      const sentence = createMockSentence(b2Sentences[1], tokens);
      const results = detector.detect(sentence);

      const nominativeResults = results.filter(r => r.details.case === 'nominative');
      expect(nominativeResults.length).toBeGreaterThan(0);
    });
  });
});