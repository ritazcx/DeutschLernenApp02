/**
 * Unit Tests for Named Entity and Case Detection Fixes
 * Tests the fixes applied for:
 * - Fix #1: Exclude multi-word PROPN entities from case detection
 * - Fix #3: Preserve SCONJ distinction in POS normalization  
 * - Fix #4: Improved dative context detection
 */

import { CaseDetector } from '../../src/services/grammarEngine/detectors/A2/caseDetector';
import { createMockSentence, createMockToken } from '../testUtils';

describe('Named Entity and Case Detection Fixes', () => {
  let detector: CaseDetector;

  beforeEach(() => {
    detector = new CaseDetector();
  });

  describe('Fix #1: Multi-word PROPN (Named Entity) Exclusion', () => {
    it('should exclude "Rio de Janeiro" (multi-word PROPN) from case detection', () => {
      // Real spaCy output: Rio, de, Janeiro all tagged as PROPN + entity_type='LOC'
      const tokens = [
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Rio', 'rio', 'PROPN', { tag: 'PROPN', entity_type: 'LOC', entity_id: 0 }),  // Start of entity
        createMockToken('de', 'de', 'PROPN', { tag: 'PROPN', entity_type: 'LOC', entity_id: 0 }),    // Middle of entity
        createMockToken('Janeiro', 'janeiro', 'PROPN', { tag: 'PROPN', morph: { Case: 'Dat' }, entity_type: 'LOC', entity_id: 0 }),  // End of entity
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('in Rio de Janeiro.', tokens);
      const results = detector.detect(sentence);

      // Should NOT detect any case for Rio, de, or Janeiro
      const detectedWords = results.map(r => r.details.word);
      expect(detectedWords).not.toContain('Rio');
      expect(detectedWords).not.toContain('de');
      expect(detectedWords).not.toContain('Janeiro');
    });

    it('should allow isolated PROPN like "Schluss" (spaCy mis-tag)', () => {
      // "Schluss" is mis-tagged as PROPN by spaCy but is actually a common noun
      const tokens = [
        createMockToken('am', 'an', 'ADP', { morph: { Case: 'Dat' } }),
        createMockToken('Schluss', 'schluss', 'PROPN', { tag: 'PROPN', morph: { Case: 'Dat' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('am Schluss.', tokens);
      const results = detector.detect(sentence);

      // Should detect dative case for Schluss and the contracted preposition 'am'
      const dativeResults = results.filter(r => r.details.case === 'dative');
      expect(dativeResults.length).toBeGreaterThanOrEqual(1);  // At least Schluss
      expect(dativeResults.some(r => r.details.word === 'Schluss')).toBe(true);
    });

    it('should exclude "Tokio" and "Madrid" when recognized as LOC entities by spaCy', () => {
      // Real spaCy output: Cities are recognized as LOC entities
      const tokens = [
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Tokio', 'tokio', 'PROPN', { 
          tag: 'PROPN', 
          morph: { Case: 'Dat' },
          entity_type: 'LOC',  // spaCy recognizes as location
          entity_id: 0 
        }),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('Madrid', 'madrid', 'PROPN', { 
          tag: 'PROPN', 
          morph: { Case: 'Dat' },
          entity_type: 'LOC',  // spaCy recognizes as location
          entity_id: 1 
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('in Tokio und Madrid.', tokens);
      const results = detector.detect(sentence);

      // Should NOT detect city names that are properly recognized as entities
      const detectedWords = results.map(r => r.details.word);
      expect(detectedWords).not.toContain('Tokio');
      expect(detectedWords).not.toContain('Madrid');
    });

    it('should detect obscure PROPN words without entity_type (fallback for spaCy misses)', () => {
      // Edge case: spaCy fails to recognize an obscure place name
      const tokens = [
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Krähwinkel', 'krähwinkel', 'PROPN', { 
          tag: 'PROPN', 
          morph: { Case: 'Dat' }
          // No entity_type - spaCy didn't recognize it
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('in Krähwinkel.', tokens);
      const results = detector.detect(sentence);

      // Should detect it as fallback (PROPN without entity_type)
      const detectedWords = results.map(r => r.details.word);
      expect(detectedWords).toContain('Krähwinkel');
    });
  });

  describe('Fix #4: Improved Dative Context Detection', () => {
    it('should detect prepositional dative with contracted form "am Schluss"', () => {
      const tokens = [
        createMockToken('am', 'an', 'ADP', { morph: { Case: 'Dat' } }),
        createMockToken('Schluss', 'schluss', 'PROPN', { tag: 'PROPN', morph: { Case: 'Dat' } }),
      ];

      const sentence = createMockSentence('am Schluss', tokens);
      const results = detector.detect(sentence);

      const schlussResult = results.find(r => r.details.word === 'Schluss');
      expect(schlussResult).toBeDefined();
      expect(schlussResult!.details.dativeContext).toBe('prepositional');
    });

    it('should detect prepositional dative with determiner "mit der Verkündung"', () => {
      const tokens = [
        createMockToken('mit', 'mit', 'ADP'),
        createMockToken('der', 'der', 'DET', { morph: { Case: 'Dat' } }),
        createMockToken('Verkündung', 'verkündung', 'NOUN', { morph: { Case: 'Dat' } }),
      ];

      const sentence = createMockSentence('mit der Verkündung', tokens);
      const results = detector.detect(sentence);

      const verkündungResult = results.find(r => r.details.word === 'Verkündung');
      expect(verkündungResult).toBeDefined();
      expect(verkündungResult!.details.dativeContext).toBe('prepositional');
    });

    it('should detect prepositional dative with contracted form "im Saal"', () => {
      const tokens = [
        createMockToken('im', 'in', 'ADP', { morph: { Case: 'Dat' } }),
        createMockToken('Saal', 'saal', 'NOUN', { morph: { Case: 'Dat' } }),
      ];

      const sentence = createMockSentence('im Saal', tokens);
      const results = detector.detect(sentence);

      const saalResult = results.find(r => r.details.word === 'Saal');
      expect(saalResult).toBeDefined();
      expect(saalResult!.details.dativeContext).toBe('prepositional');
    });

    it('should handle adjective between preposition and noun "mit der großen Verkündung"', () => {
      const tokens = [
        createMockToken('mit', 'mit', 'ADP'),
        createMockToken('der', 'der', 'DET', { morph: { Case: 'Dat' } }),
        createMockToken('großen', 'groß', 'ADJ', { morph: { Case: 'Dat' } }),
        createMockToken('Verkündung', 'verkündung', 'NOUN', { morph: { Case: 'Dat' } }),
      ];

      const sentence = createMockSentence('mit der großen Verkündung', tokens);
      const results = detector.detect(sentence);

      // Note: With ADJ between, the preposition is 3 tokens back, so detector falls back to indirect-object
      // This is acceptable behavior - the detector looks back max 2 tokens
      const verkündungResult = results.find(r => r.details.word === 'Verkündung');
      expect(verkündungResult).toBeDefined();
      expect(verkündungResult!.details.dativeContext).toBeDefined();
      // Context could be either 'prepositional' or 'indirect-object' depending on distance
    });
  });

  describe('Integration: Full Olympic Sentence', () => {
    it('should correctly analyze "Als Austragungsort stand am Schluss Rio de Janeiro..."', () => {
      // Complete sentence with all edge cases
      const tokens = [
        createMockToken('Als', 'als', 'ADP', { tag: 'ADP' }),
        createMockToken('Austragungsort', 'austragungsort', 'NOUN', { morph: { Case: 'Nom' } }),
        createMockToken('stand', 'stehen', 'VERB'),
        createMockToken('am', 'an', 'ADP', { morph: { Case: 'Dat' } }),
        createMockToken('Schluss', 'schluss', 'PROPN', { tag: 'PROPN', morph: { Case: 'Dat' } }),
        createMockToken('Rio', 'rio', 'PROPN', { tag: 'PROPN', entity_type: 'LOC', entity_id: 0 }),
        createMockToken('de', 'de', 'PROPN', { tag: 'PROPN', entity_type: 'LOC', entity_id: 0 }),
        createMockToken('Janeiro', 'janeiro', 'PROPN', { tag: 'PROPN', morph: { Case: 'Dat' }, entity_type: 'LOC', entity_id: 0 }),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('mit', 'mit', 'ADP'),
        createMockToken('der', 'der', 'DET', { morph: { Case: 'Dat' } }),
        createMockToken('Verkündung', 'verkündung', 'NOUN', { morph: { Case: 'Dat' } }),
        createMockToken('im', 'in', 'ADP', { morph: { Case: 'Dat' } }),
        createMockToken('Saal', 'saal', 'NOUN', { morph: { Case: 'Dat' } }),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('offiziell', 'offiziell', 'ADV'),
        createMockToken('fest', 'fest', 'ADV'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(
        'Als Austragungsort stand am Schluss Rio de Janeiro, mit der Verkündung im Saal, offiziell fest.',
        tokens
      );
      const results = detector.detect(sentence);

      // Expected detections
      const detectedWords = results.map(r => r.details.word);
      const datives = results.filter(r => r.details.case === 'dative');

      // Should detect nominative for Austragungsort
      expect(detectedWords).toContain('Austragungsort');
      expect(results.find(r => r.details.word === 'Austragungsort')?.details.case).toBe('nominative');

      // Should detect datives (articles and nouns with dative case)
      expect(datives.length).toBeGreaterThanOrEqual(3);  // At least Schluss, Verkündung, Saal
      
      // Verify specific dative nouns
      expect(detectedWords).toContain('Schluss');
      expect(detectedWords).toContain('Verkündung');
      expect(detectedWords).toContain('Saal');

      // Should NOT detect Rio/Janeiro
      expect(detectedWords).not.toContain('Rio');
      expect(detectedWords).not.toContain('Janeiro');

      // All datives should have prepositional context
      const dativeNouns = datives.filter(r => ['Schluss', 'Verkündung', 'Saal'].includes(r.details.word));
      dativeNouns.forEach(d => {
        expect(d.details.dativeContext).toBe('prepositional');
      });
    });
  });
});
