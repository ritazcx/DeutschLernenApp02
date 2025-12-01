/**
 * Unit Tests for Extended Adjective Detector
 * Using B2-level article sentences for comprehensive testing
 */

import { ExtendedAdjectiveDetector } from '../../src/services/grammarEngine/detectors/extendedAdjectiveDetector';
import { createMockSentence, createMockToken } from '../testUtils';

// B2 Article Sentences (parsed using backend sentence splitting logic)
const b2Sentences = {
  1: "Olympische Sommerspiele 2016", // Extended adjective: Olympische
  2: "Die Olympischen Sommerspiele 2016 (offiziell Spiele der XXXI. Olympiade genannt) werden zwischen dem 5. und 21. August 2016 in Rio de Janeiro stattfinden.", // Olympischen, Internationale Olympische
  3: "Rio de Janeiro ist damit die erste Stadt in Südamerika, die Gastgeber der Veranstaltung wird.", // erste, Südamerika (prepositional)
  4: "Wahl des Austragungsortes", // No extended adjectives
  5: "Für die Olympischen Sommerspiele 2016 läutete das Internationale Olympische Komitee (IOC) am 16. Mai 2007 die Bewerbungsphase ein.", // Olympischen, Internationale Olympische
  6: "Alle 203 Nationalen Olympischen Komitees wurden eingeladen, eine Kandidatur einzureichen.", // Nationalen Olympischen
  7: "Bis zum Ende der Bewerbungsfrist am 13. September 2007 reichten sieben Städte ihre vollständigen Unterlagen beim IOC ein.", // vollständigen
  8: "Auf dieser Basis erklärte das Executive Board des IOC am 4. Juni 2008 die Städte Chicago, Tokio, Rio de Janeiro und Madrid zu offiziellen Kandidaten.", // Executive, offiziellen
  9: "Die Mitglieder des IOC entschieden am 2. Oktober 2009 in Kopenhagen, dass Rio de Janeiro der Austragungsort der Olympischen Sommerspiele 2016 sein wird.", // Olympischen
  10: "In den ersten beiden Wahlgängen schieden die Bewerbungen aus Chicago und Tokio mit den jeweils wenigsten Stimmen aus.", // ersten beiden, jeweils wenigsten
  11: "Als Austragungsort stand am Schluss Rio de Janeiro, mit der Verkündung im Saal, offiziell fest." // No extended adjectives
};

describe('ExtendedAdjectiveDetector - B2 Article Testing', () => {
  let detector: ExtendedAdjectiveDetector;

  beforeEach(() => {
    detector = new ExtendedAdjectiveDetector();
  });

  describe('Basic Properties', () => {
    it('should have correct name and category', () => {
      expect(detector.name).toBe('ExtendedAdjectiveDetector');
      expect(detector.category).toBe('adjective');
    });
  });

  describe('Extended Adjective Detection', () => {
    it('should detect extended adjective "Olympische" in sentence 1', () => {
      const tokens = [
        createMockToken('Olympische', 'olympisch', 'ADJ'),
        createMockToken('Sommerspiele', 'sommerspiel', 'NOUN'),
        createMockToken('2016', '2016', 'NUM'),
      ];

      const sentence = createMockSentence(b2Sentences[1], tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.noun).toBe('Sommerspiele');
      expect(results[0].details.adjectives).toContain('Olympische');
      expect(results[0].details.phraseLength).toBe(1);
      expect(results[0].details.type).toBe('multiple-adjectives');
    });

    it('should detect extended adjective "Olympischen" in sentence 2', () => {
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
        createMockToken('dem', 'der', 'DET'),
        createMockToken('5.', '5.', 'ADJ'),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('21.', '21.', 'ADJ'),
        createMockToken('August', 'august', 'NOUN'),
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

      expect(results.length).toBeGreaterThan(0);
      const olympischenResult = results.find(r => r.details.noun === 'Sommerspiele');
      expect(olympischenResult).toBeDefined();
      expect(olympischenResult!.details.adjectives).toContain('Olympischen');
    });

    it('should detect "Internationale Olympische" as extended adjective in sentence 5', () => {
      const tokens = [
        createMockToken('Für', 'für', 'ADP'),
        createMockToken('die', 'die', 'DET'),
        createMockToken('Olympischen', 'olympisch', 'ADJ'),
        createMockToken('Sommerspiele', 'sommerspiel', 'NOUN'),
        createMockToken('2016', '2016', 'NUM'),
        createMockToken('läutete', 'läuten', 'VERB'),
        createMockToken('das', 'der', 'DET'),
        createMockToken('Internationale', 'international', 'ADJ'),
        createMockToken('Olympische', 'olympisch', 'ADJ'),
        createMockToken('Komitee', 'komitee', 'NOUN'),
        createMockToken('(', '(', 'PUNCT'),
        createMockToken('IOC', 'ioc', 'PROPN'),
        createMockToken(')', ')', 'PUNCT'),
        createMockToken('am', 'an', 'ADP'),
        createMockToken('16.', '16.', 'ADJ'),
        createMockToken('Mai', 'mai', 'NOUN'),
        createMockToken('2007', '2007', 'NUM'),
        createMockToken('die', 'die', 'DET'),
        createMockToken('Bewerbungsphase', 'bewerbungsphase', 'NOUN'),
        createMockToken('ein', 'ein', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[5], tokens);
      const results = detector.detect(sentence);

      const komiteeResult = results.find(r => r.details.noun === 'Komitee');
      expect(komiteeResult).toBeDefined();
      expect(komiteeResult!.details.adjectives).toContain('Internationale');
      expect(komiteeResult!.details.adjectives).toContain('Olympische');
      expect(komiteeResult!.details.phraseLength).toBe(2);
      expect(komiteeResult!.details.type).toBe('multiple-adjectives');
    });

    it('should detect "Nationalen Olympischen" as extended adjective in sentence 6', () => {
      const tokens = [
        createMockToken('Alle', 'all', 'DET'),
        createMockToken('203', '203', 'NUM'),
        createMockToken('Nationalen', 'national', 'ADJ'),
        createMockToken('Olympischen', 'olympisch', 'ADJ'),
        createMockToken('Komitees', 'komitee', 'NOUN'),
        createMockToken('wurden', 'werden', 'AUX'),
        createMockToken('eingeladen', 'einladen', 'VERB'),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('eine', 'ein', 'DET'),
        createMockToken('Kandidatur', 'kandidatur', 'NOUN'),
        createMockToken('einzureichen', 'einreichen', 'VERB'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[6], tokens);
      const results = detector.detect(sentence);

      const komiteesResult = results.find(r => r.details.noun === 'Komitees');
      expect(komiteesResult).toBeDefined();
      expect(komiteesResult!.details.adjectives).toContain('Nationalen');
      expect(komiteesResult!.details.adjectives).toContain('Olympischen');
      expect(komiteesResult!.details.phraseLength).toBe(2);
    });

    it('should detect "vollständigen" as extended adjective in sentence 7', () => {
      const tokens = [
        createMockToken('Bis', 'bis', 'ADP'),
        createMockToken('zum', 'zu', 'ADP'),
        createMockToken('Ende', 'ende', 'NOUN'),
        createMockToken('der', 'der', 'DET'),
        createMockToken('Bewerbungsfrist', 'bewerbungsfrist', 'NOUN'),
        createMockToken('am', 'an', 'ADP'),
        createMockToken('13.', '13.', 'ADJ'),
        createMockToken('September', 'september', 'NOUN'),
        createMockToken('2007', '2007', 'NUM'),
        createMockToken('reichten', 'reichen', 'VERB'),
        createMockToken('sieben', 'sieben', 'NUM'),
        createMockToken('Städte', 'stadt', 'NOUN'),
        createMockToken('ihre', 'ihr', 'DET'),
        createMockToken('vollständigen', 'vollständig', 'ADJ'),
        createMockToken('Unterlagen', 'unterlage', 'NOUN'),
        createMockToken('beim', 'bei', 'ADP'),
        createMockToken('IOC', 'ioc', 'PROPN'),
        createMockToken('ein', 'ein', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[7], tokens);
      const results = detector.detect(sentence);

      const unterlagenResult = results.find(r => r.details.noun === 'Unterlagen');
      expect(unterlagenResult).toBeDefined();
      expect(unterlagenResult!.details.adjectives).toContain('vollständigen');
    });

    it('should detect "offiziellen" as extended adjective in sentence 8', () => {
      const tokens = [
        createMockToken('Auf', 'auf', 'ADP'),
        createMockToken('dieser', 'dies', 'DET'),
        createMockToken('Basis', 'basis', 'NOUN'),
        createMockToken('erklärte', 'erklären', 'VERB'),
        createMockToken('das', 'der', 'DET'),
        createMockToken('Executive', 'executive', 'ADJ'),
        createMockToken('Board', 'board', 'NOUN'),
        createMockToken('des', 'der', 'DET'),
        createMockToken('IOC', 'ioc', 'PROPN'),
        createMockToken('am', 'an', 'ADP'),
        createMockToken('4.', '4.', 'ADJ'),
        createMockToken('Juni', 'juni', 'NOUN'),
        createMockToken('2008', '2008', 'NUM'),
        createMockToken('die', 'die', 'DET'),
        createMockToken('Städte', 'stadt', 'NOUN'),
        createMockToken('Chicago', 'chicago', 'PROPN'),
        createMockToken('Tokio', 'tokio', 'PROPN'),
        createMockToken('Rio', 'rio', 'PROPN'),
        createMockToken('de', 'de', 'PROPN'),
        createMockToken('Janeiro', 'janeiro', 'PROPN'),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('Madrid', 'madrid', 'PROPN'),
        createMockToken('zu', 'zu', 'ADP'),
        createMockToken('offiziellen', 'offiziell', 'ADJ'),
        createMockToken('Kandidaten', 'kandidat', 'NOUN'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[8], tokens);
      const results = detector.detect(sentence);

      const kandidatenResult = results.find(r => r.details.noun === 'Kandidaten');
      expect(kandidatenResult).toBeDefined();
      expect(kandidatenResult!.details.adjectives).toContain('offiziellen');
    });

    it('should detect "ersten beiden" as extended adjective in sentence 10', () => {
      const tokens = [
        createMockToken('In', 'in', 'ADP'),
        createMockToken('den', 'der', 'DET'),
        createMockToken('ersten', 'erst', 'ADJ'),
        createMockToken('beiden', 'beide', 'PRON'),
        createMockToken('Wahlgängen', 'wahlgang', 'NOUN'),
        createMockToken('schieden', 'scheiden', 'VERB'),
        createMockToken('die', 'die', 'DET'),
        createMockToken('Bewerbungen', 'bewerbung', 'NOUN'),
        createMockToken('aus', 'aus', 'ADP'),
        createMockToken('Chicago', 'chicago', 'PROPN'),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('Tokio', 'tokio', 'PROPN'),
        createMockToken('mit', 'mit', 'ADP'),
        createMockToken('den', 'der', 'DET'),
        createMockToken('jeweils', 'jeweils', 'ADV'),
        createMockToken('wenigsten', 'wenig', 'ADJ'),
        createMockToken('Stimmen', 'stimme', 'NOUN'),
        createMockToken('aus', 'aus', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[10], tokens);
      const results = detector.detect(sentence);

      const wahlgängenResult = results.find(r => r.details.noun === 'Wahlgängen');
      expect(wahlgängenResult).toBeDefined();
      expect(wahlgängenResult!.details.adjectives).toContain('ersten');
      expect(wahlgängenResult!.details.adjectives).toContain('beiden');
      expect(wahlgängenResult!.details.phraseLength).toBe(2);
    });

    it('should detect "jeweils wenigsten" as extended adjective in sentence 10', () => {
      const tokens = [
        createMockToken('In', 'in', 'ADP'),
        createMockToken('den', 'der', 'DET'),
        createMockToken('ersten', 'erst', 'ADJ'),
        createMockToken('beiden', 'beide', 'PRON'),
        createMockToken('Wahlgängen', 'wahlgang', 'NOUN'),
        createMockToken('schieden', 'scheiden', 'VERB'),
        createMockToken('die', 'die', 'DET'),
        createMockToken('Bewerbungen', 'bewerbung', 'NOUN'),
        createMockToken('aus', 'aus', 'ADP'),
        createMockToken('Chicago', 'chicago', 'PROPN'),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('Tokio', 'tokio', 'PROPN'),
        createMockToken('mit', 'mit', 'ADP'),
        createMockToken('den', 'der', 'DET'),
        createMockToken('jeweils', 'jeweils', 'ADV'),
        createMockToken('wenigsten', 'wenig', 'ADJ'),
        createMockToken('Stimmen', 'stimme', 'NOUN'),
        createMockToken('aus', 'aus', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(b2Sentences[10], tokens);
      const results = detector.detect(sentence);

      const stimmenResult = results.find(r => r.details.noun === 'Stimmen');
      expect(stimmenResult).toBeDefined();
      expect(stimmenResult!.details.adjectives).toContain('wenigsten');
      expect(stimmenResult!.details.phraseLength).toBe(1);
    });
  });

  describe('Date and Number Handling', () => {
    it('should not include dates in extended adjective phrases', () => {
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
        createMockToken('dem', 'der', 'DET'),
        createMockToken('5.', '5.', 'ADJ'),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('21.', '21.', 'ADJ'),
        createMockToken('August', 'august', 'NOUN'),
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

      // Should not include "5." or "21." or "2016" in adjective phrases
      results.forEach(result => {
        expect(result.details.adjectives).not.toContain('5.');
        expect(result.details.adjectives).not.toContain('21.');
        expect(result.details.adjectives).not.toContain('2016');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle sentences with no extended adjectives (sentence 4)', () => {
      const tokens = [
        createMockToken('Wahl', 'wahl', 'NOUN'),
        createMockToken('des', 'der', 'DET'),
        createMockToken('Austragungsortes', 'austragungsort', 'NOUN'),
      ];

      const sentence = createMockSentence(b2Sentences[4], tokens);
      const results = detector.detect(sentence);

      // Should have minimal or no extended adjective detections
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should handle complex sentences with multiple extended adjectives', () => {
      const tokens = [
        createMockToken('Das', 'der', 'DET'),
        createMockToken('Internationale', 'international', 'ADJ'),
        createMockToken('Olympische', 'olympisch', 'ADJ'),
        createMockToken('Komitee', 'komitee', 'NOUN'),
        createMockToken('erklärte', 'erklären', 'VERB'),
        createMockToken('die', 'die', 'DET'),
        createMockToken('offiziellen', 'offiziell', 'ADJ'),
        createMockToken('Kandidaten', 'kandidat', 'NOUN'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das Internationale Olympische Komitee erklärte die offiziellen Kandidaten.', tokens);
      const results = detector.detect(sentence);

      expect(results.length).toBeGreaterThan(1);
      const komiteeResult = results.find(r => r.details.noun === 'Komitee');
      const kandidatenResult = results.find(r => r.details.noun === 'Kandidaten');

      expect(komiteeResult).toBeDefined();
      expect(kandidatenResult).toBeDefined();
      expect(komiteeResult!.details.phraseLength).toBe(2);
      expect(kandidatenResult!.details.phraseLength).toBe(1);
    });
  });
});