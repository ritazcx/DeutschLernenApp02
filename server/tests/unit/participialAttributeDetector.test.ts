/**
 * Unit Tests for Participial Attribute Detector
 * Tests B2-level Erweiterte Partizipialattribute detection
 */

import { ParticipialAttributeDetector } from '../../src/services/grammarEngine/detectors/participialAttributeDetector';
import { createMockSentence, createMockToken } from '../testUtils';

describe('ParticipialAttributeDetector', () => {
  let detector: ParticipialAttributeDetector;

  beforeEach(() => {
    detector = new ParticipialAttributeDetector();
  });

  describe('Basic Properties', () => {
    it('should have correct name and category', () => {
      expect(detector.name).toBe('ParticipialAttributeDetector');
      expect(detector.category).toBe('participial-attribute');
    });
  });

  describe('Simple Partizip II Detection', () => {
    it('should detect "Das geschriebene Buch"', () => {
      const tokens = [
        createMockToken('Das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('geschriebene', 'geschrieben', 'ADJ', { 
          tag: 'ADJA',
          morph: { Case: 'Nom', Degree: 'Pos' }
        }),
        createMockToken('Buch', 'Buch', 'NOUN'),
        createMockToken('ist', 'sein', 'AUX'),
        createMockToken('gut', 'gut', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das geschriebene Buch ist gut.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].grammarPointId).toBe('b2-participial-attributes');
      expect(results[0].details.noun).toBe('Buch');
      expect(results[0].details.participleType).toBe('partizip-ii');
      expect(results[0].details.participleText).toBe('geschriebene');
    });

    it('should detect "Der gemalte Tisch"', () => {
      const tokens = [
        createMockToken('Der', 'der', 'DET', { pos: 'ART' }),
        createMockToken('gemalte', 'gemalt', 'ADJ', { 
          tag: 'ADJA',
          morph: { Case: 'Nom' }
        }),
        createMockToken('Tisch', 'Tisch', 'NOUN'),
        createMockToken('steht', 'stehen', 'VERB'),
        createMockToken('hier', 'hier', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Der gemalte Tisch steht hier.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.participleType).toBe('partizip-ii');
    });

    it('should detect "Die gelesenen Bücher"', () => {
      const tokens = [
        createMockToken('Die', 'der', 'DET', { pos: 'ART' }),
        createMockToken('gelesenen', 'gelesen', 'ADJ', { 
          tag: 'ADJA',
          morph: { Case: 'Nom', Number: 'Plur' }
        }),
        createMockToken('Bücher', 'Buch', 'NOUN', { morph: { Number: 'Plur' } }),
        createMockToken('sind', 'sein', 'AUX'),
        createMockToken('alt', 'alt', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Die gelesenen Bücher sind alt.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.participleType).toBe('partizip-ii');
    });
  });

  describe('Simple Partizip I Detection', () => {
    it('should detect "Der laufende Mann"', () => {
      const tokens = [
        createMockToken('Der', 'der', 'DET', { pos: 'ART' }),
        createMockToken('laufende', 'laufend', 'ADJ', { 
          tag: 'ADJA',
          morph: { Case: 'Nom' }
        }),
        createMockToken('Mann', 'Mann', 'NOUN'),
        createMockToken('ist', 'sein', 'AUX'),
        createMockToken('schnell', 'schnell', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Der laufende Mann ist schnell.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.participleType).toBe('partizip-i');
      expect(results[0].details.participleText).toBe('laufende');
    });

    it('should detect "Die schlafenden Kinder"', () => {
      const tokens = [
        createMockToken('Die', 'der', 'DET', { pos: 'ART' }),
        createMockToken('schlafenden', 'schlafend', 'ADJ', { 
          tag: 'ADJA',
          morph: { Case: 'Nom', Number: 'Plur' }
        }),
        createMockToken('Kinder', 'Kind', 'NOUN', { morph: { Number: 'Plur' } }),
        createMockToken('sind', 'sein', 'AUX'),
        createMockToken('ruhig', 'ruhig', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Die schlafenden Kinder sind ruhig.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.participleType).toBe('partizip-i');
    });
  });

  describe('Extended Participial Phrases with Adverbs', () => {
    it('should detect "Das gut geschriebene Buch"', () => {
      const tokens = [
        createMockToken('Das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('gut', 'gut', 'ADV'),
        createMockToken('geschriebene', 'geschrieben', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Buch', 'Buch', 'NOUN'),
        createMockToken('ist', 'sein', 'AUX'),
        createMockToken('interessant', 'interessant', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das gut geschriebene Buch ist interessant.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.hasAdverb).toBe(true);
      expect(results[0].details.modifiers).toContain('gut');
      expect(results[0].details.type).toBe('partizip-ii-with-modifiers');
    });

    it('should detect "Der schnell laufende Mann"', () => {
      const tokens = [
        createMockToken('Der', 'der', 'DET', { pos: 'ART' }),
        createMockToken('schnell', 'schnell', 'ADV'),
        createMockToken('laufende', 'laufend', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Mann', 'Mann', 'NOUN'),
        createMockToken('ist', 'sein', 'AUX'),
        createMockToken('fit', 'fit', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Der schnell laufende Mann ist fit.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.hasAdverb).toBe(true);
      expect(results[0].details.participleType).toBe('partizip-i');
    });
  });

  describe('Extended Participial Phrases with Prepositions', () => {
    it('should detect "Das von ihm gemalte Bild"', () => {
      const tokens = [
        createMockToken('Das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('von', 'von', 'ADP'),
        createMockToken('ihm', 'ihm', 'PRON', { morph: { Case: 'Dat' } }),
        createMockToken('gemalte', 'gemalt', 'ADJ', { 
          tag: 'ADJA',
          morph: { Case: 'Nom' }
        }),
        createMockToken('Bild', 'Bild', 'NOUN'),
        createMockToken('ist', 'sein', 'AUX'),
        createMockToken('schön', 'schön', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das von ihm gemalte Bild ist schön.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.hasPreposition).toBe(true);
      expect(results[0].details.modifiers).toContain('von');
      expect(results[0].details.type).toBe('partizip-ii-with-preposition');
    });

    it('should detect "Der von dem Künstler gemalte Tisch"', () => {
      const tokens = [
        createMockToken('Der', 'der', 'DET', { pos: 'ART' }),
        createMockToken('von', 'von', 'ADP'),
        createMockToken('dem', 'der', 'DET', { pos: 'ART', morph: { Case: 'Dat' } }),
        createMockToken('Künstler', 'Künstler', 'NOUN', { morph: { Case: 'Dat' } }),
        createMockToken('gemalte', 'gemalt', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Tisch', 'Tisch', 'NOUN'),
        createMockToken('steht', 'stehen', 'VERB'),
        createMockToken('hier', 'hier', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Der von dem Künstler gemalte Tisch steht hier.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.hasPreposition).toBe(true);
      expect(results[0].details.type).toBe('partizip-ii-with-preposition');
    });

    it('should detect "Die im Garten spielenden Kinder"', () => {
      const tokens = [
        createMockToken('Die', 'der', 'DET', { pos: 'ART' }),
        createMockToken('im', 'in', 'ADP', { tag: 'APPRART' }),
        createMockToken('Garten', 'Garten', 'NOUN', { morph: { Case: 'Dat' } }),
        createMockToken('spielenden', 'spielend', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Kinder', 'Kind', 'NOUN', { morph: { Number: 'Plur' } }),
        createMockToken('sind', 'sein', 'AUX'),
        createMockToken('glücklich', 'glücklich', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Die im Garten spielenden Kinder sind glücklich.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.hasPreposition).toBe(true);
      expect(results[0].details.participleType).toBe('partizip-i');
      expect(results[0].details.type).toBe('partizip-i-with-preposition');
    });
  });

  describe('Complex Participial Phrases', () => {
    it('should detect phrase with multiple modifiers', () => {
      const tokens = [
        createMockToken('Das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('sehr', 'sehr', 'ADV'),
        createMockToken('gut', 'gut', 'ADV'),
        createMockToken('geschriebene', 'geschrieben', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Buch', 'Buch', 'NOUN'),
        createMockToken('verkauft', 'verkaufen', 'VERB'),
        createMockToken('sich', 'sich', 'PRON'),
        createMockToken('gut', 'gut', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das sehr gut geschriebene Buch verkauft sich gut.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.hasAdverb).toBe(true);
      expect(results[0].details.modifiers.length).toBeGreaterThan(1);
    });

    it('should detect phrase with preposition and pronoun', () => {
      const tokens = [
        createMockToken('Das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('von', 'von', 'ADP'),
        createMockToken('mir', 'ich', 'PRON', { morph: { Case: 'Dat' } }),
        createMockToken('gesehene', 'gesehen', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Auto', 'Auto', 'NOUN'),
        createMockToken('war', 'sein', 'AUX'),
        createMockToken('rot', 'rot', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das von mir gesehene Auto war rot.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.hasPreposition).toBe(true);
      expect(results[0].details.modifiers).toContain('von');
    });
  });

  describe('Partizip Recognition by Tag', () => {
    it('should detect VVPP tag as Partizip II', () => {
      const tokens = [
        createMockToken('Das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('gekaufte', 'kaufen', 'VERB', { 
          tag: 'VVPP',
          morph: { VerbForm: 'Part', Tense: 'Past' }
        }),
        createMockToken('Haus', 'Haus', 'NOUN'),
        createMockToken('ist', 'sein', 'AUX'),
        createMockToken('groß', 'groß', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das gekaufte Haus ist groß.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.participleType).toBe('partizip-ii');
    });

    it('should detect VVPPR tag as Partizip I', () => {
      const tokens = [
        createMockToken('Der', 'der', 'DET', { pos: 'ART' }),
        createMockToken('kommende', 'kommen', 'VERB', { 
          tag: 'VVPPR',
          morph: { VerbForm: 'Part', Tense: 'Pres' }
        }),
        createMockToken('Zug', 'Zug', 'NOUN'),
        createMockToken('ist', 'sein', 'AUX'),
        createMockToken('pünktlich', 'pünktlich', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Der kommende Zug ist pünktlich.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.participleType).toBe('partizip-i');
    });
  });

  describe('Boundary Detection', () => {
    it('should stop at finite verb', () => {
      const tokens = [
        createMockToken('Er', 'er', 'PRON'),
        createMockToken('kaufte', 'kaufen', 'VERB', { 
          morph: { VerbForm: 'Fin', Tense: 'Past' }
        }),
        createMockToken('das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('bemalte', 'bemalt', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Bild', 'Bild', 'NOUN'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Er kaufte das bemalte Bild.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.adjectives).not.toContain('kaufte');
    });

    it('should stop at conjunction', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('sehe', 'sehen', 'VERB'),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('geschriebene', 'geschrieben', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Buch', 'Buch', 'NOUN'),
        createMockToken('liegt', 'liegen', 'VERB'),
        createMockToken('hier', 'hier', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich sehe und das geschriebene Buch liegt hier.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.adjectives).not.toContain('und');
    });
  });

  describe('Edge Cases', () => {
    it('should not detect simple adjectives without participial form', () => {
      const tokens = [
        createMockToken('Das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('große', 'groß', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Haus', 'Haus', 'NOUN'),
        createMockToken('ist', 'sein', 'AUX'),
        createMockToken('alt', 'alt', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das große Haus ist alt.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(0);
    });

    it('should handle sentences without nouns', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('laufe', 'laufen', 'VERB'),
        createMockToken('schnell', 'schnell', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich laufe schnell.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(0);
    });

    it('should handle multiple participial phrases in one sentence', () => {
      const tokens = [
        createMockToken('Das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('geschriebene', 'geschrieben', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Buch', 'Buch', 'NOUN'),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('der', 'der', 'DET', { pos: 'ART' }),
        createMockToken('gemalte', 'gemalt', 'ADJ', { tag: 'ADJA' }),
        createMockToken('Tisch', 'Tisch', 'NOUN'),
        createMockToken('sind', 'sein', 'AUX'),
        createMockToken('alt', 'alt', 'ADJ'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das geschriebene Buch und der gemalte Tisch sind alt.', tokens);
      const results = detector.detect(sentence);

      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Base Verb Extraction', () => {
    it('should extract base verb from Partizip II', () => {
      const tokens = [
        createMockToken('Das', 'der', 'DET', { pos: 'ART' }),
        createMockToken('geschriebene', 'schreiben', 'ADJ', { 
          tag: 'ADJA',
          lemma: 'schreiben'
        }),
        createMockToken('Buch', 'Buch', 'NOUN'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das geschriebene Buch.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.baseVerb).toBe('schreiben');
    });

    it('should extract base verb from Partizip I', () => {
      const tokens = [
        createMockToken('Der', 'der', 'DET', { pos: 'ART' }),
        createMockToken('laufende', 'laufen', 'ADJ', { 
          tag: 'ADJA',
          lemma: 'laufen'
        }),
        createMockToken('Mann', 'Mann', 'NOUN'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Der laufende Mann.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.baseVerb).toBe('laufen');
    });
  });
});
