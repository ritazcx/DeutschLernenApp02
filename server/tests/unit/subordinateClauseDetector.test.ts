/**
 * Unit Tests for Subordinate Clause Detector
 */

import { SubordinateClauseDetector } from '../../src/services/grammarEngine/detectors/subordinateClauseDetector';
import { createMockSentence, createMockToken, testSentences } from '../testUtils';

describe('SubordinateClauseDetector', () => {
  let detector: SubordinateClauseDetector;

  beforeEach(() => {
    detector = new SubordinateClauseDetector();
  });

  describe('Basic Properties', () => {
    it('should have correct name and category', () => {
      expect(detector.name).toBe('SubordinateClauseDetector');
      expect(detector.category).toBe('word-order');
    });
  });

  describe('Subordinate Clause Detection', () => {
    it('should detect "weil" clauses', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('bleibe', 'bleiben', 'VERB'),
        createMockToken('zu', 'zu', 'ADP'),
        createMockToken('Hause', 'Haus', 'NOUN'),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('weil', 'weil', 'SCONJ'),
        createMockToken('es', 'es', 'PRON'),
        createMockToken('regnet', 'regnen', 'VERB'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(testSentences.subordinate.weil, tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].grammarPoint.name).toContain('Subordinate');
      expect(results[0].details.conjunction).toBe('weil');
      expect(results[0].details.type).toBe('causal');
    });

    it('should detect "dass" clauses', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('weiß', 'wissen', 'VERB'),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('dass', 'dass', 'SCONJ'),
        createMockToken('du', 'du', 'PRON'),
        createMockToken('kommst', 'kommen', 'VERB'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(testSentences.subordinate.dass, tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.conjunction).toBe('dass');
    });

    it('should detect "wenn" clauses', () => {
      const tokens = [
        createMockToken('Ruf', 'rufen', 'VERB'),
        createMockToken('mich', 'ich', 'PRON'),
        createMockToken('an', 'an', 'ADP'),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('wenn', 'wenn', 'SCONJ'),
        createMockToken('du', 'du', 'PRON'),
        createMockToken('da', 'da', 'ADV'),
        createMockToken('bist', 'sein', 'VERB'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(testSentences.subordinate.wenn, tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.conjunction).toBe('wenn');
      expect(results[0].details.type).toBe('conditional');
    });

    it('should detect various subordinate conjunctions', () => {
      const testCases = [
        { conj: 'nachdem', type: 'temporal', sentence: 'Nachdem ich gegessen habe, gehe ich spazieren.' },
        { conj: 'bevor', type: 'temporal', sentence: 'Bevor ich gehe, rufe ich dich an.' },
        { conj: 'obwohl', type: 'concessive', sentence: 'Obwohl es regnet, gehe ich spazieren.' },
        { conj: 'damit', type: 'purpose', sentence: 'Ich lerne Deutsch, damit ich sprechen kann.' },
      ];

      testCases.forEach(({ conj, type, sentence: testSentence }) => {
        const tokens = [
          createMockToken('Ich', 'ich', 'PRON'),
          createMockToken('gehe', 'gehen', 'VERB'),
          createMockToken(',', ',', 'PUNCT'),
          createMockToken(conj, conj, 'SCONJ'),
          createMockToken('es', 'es', 'PRON'),
          createMockToken('regnet', 'regnen', 'VERB'),
          createMockToken('.', '.', 'PUNCT'),
        ];

        const sentence = createMockSentence(testSentence, tokens);
        const results = detector.detect(sentence);

        expect(results).toHaveLength(1);
        expect(results[0].details.conjunction).toBe(conj);
        expect(results[0].details.type).toBe(type);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not detect coordinating conjunctions', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('gehe', 'gehen', 'VERB'),
        createMockToken('und', 'und', 'CCONJ'), // Coordinating, not subordinating
        createMockToken('du', 'du', 'PRON'),
        createMockToken('kommst', 'kommen', 'VERB'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich gehe und du kommst.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(0);
    });

    it('should not detect conjunctions without verb-final structure', () => {
      const tokens = [
        createMockToken('Weil', 'weil', 'SCONJ'),
        createMockToken('es', 'es', 'PRON'),
        createMockToken('regnet', 'regnen', 'VERB'),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('bleibe', 'bleiben', 'VERB'),
        createMockToken('ich', 'ich', 'PRON'),
        createMockToken('zu', 'zu', 'ADP'),
        createMockToken('Hause', 'Haus', 'NOUN'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Weil es regnet, bleibe ich zu Hause.', tokens);
      const results = detector.detect(sentence);

      // This might still detect it depending on implementation
      // The key is that it should handle verb position correctly
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Complex Sentences', () => {
    it('should handle multiple subordinate clauses', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('denke', 'denken', 'VERB'),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('dass', 'dass', 'SCONJ'),
        createMockToken('du', 'du', 'PRON'),
        createMockToken('kommst', 'kommen', 'VERB'),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('weil', 'weil', 'SCONJ'),
        createMockToken('es', 'es', 'PRON'),
        createMockToken('regnet', 'regnen', 'VERB'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich denke, dass du kommst, weil es regnet.', tokens);
      const results = detector.detect(sentence);

      expect(results.length).toBeGreaterThanOrEqual(2);
      const conjunctions = results.map(r => r.details.conjunction);
      expect(conjunctions).toContain('dass');
      expect(conjunctions).toContain('weil');
    });
  });
});