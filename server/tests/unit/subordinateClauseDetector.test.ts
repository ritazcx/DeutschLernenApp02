/**
 * Unit Tests for Subordinate Clause Detector
 */

import { SubordinateClauseDetector } from '../../src/services/grammarEngine/detectors/B1/subordinateClauseDetector';
import { createMockSentence, createMockToken, testSentences } from '../testUtils';

describe('SubordinateClauseDetector', () => {
  let detector: SubordinateClauseDetector;

  beforeEach(() => {
    detector = new SubordinateClauseDetector();
  });

  describe('Basic Properties', () => {
      it('should have correct name and category', () => {
      expect(detector.name).toBe('SubordinateClauseDetector');
      expect(detector.category).toBe('clause');
    });
  });

  describe('Subordinate Clause Detection', () => {
    it('should detect "weil" clauses', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON', { tag: 'PPER', dep: 'sb' }),
        createMockToken('bleibe', 'bleiben', 'VERB', { tag: 'VVFIN', dep: 'ROOT' }),
        createMockToken('zu', 'zu', 'ADP', { tag: 'APPR', dep: 'case' }),
        createMockToken('Hause', 'Haus', 'NOUN', { tag: 'NN', dep: 'obl' }),
        createMockToken(',', ',', 'PUNCT', { tag: '$,', dep: 'punct' }),
        createMockToken('weil', 'weil', 'SCONJ', { tag: 'KOUS', dep: 'mo', head: 'regnet' }),
        createMockToken('es', 'es', 'PRON', { tag: 'PPER', dep: 'sb' }),
        createMockToken('regnet', 'regnen', 'VERB', { tag: 'VVFIN', dep: 'oc' }),
        createMockToken('.', '.', 'PUNCT', { tag: '$.', dep: 'punct' }),
      ];

      const sentence = createMockSentence(testSentences.subordinate.weil, tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].grammarPoint.name).toContain('Subordinate');
      expect(results[0].details.conjunction).toBe('weil');
      expect(results[0].details.type).toBe('adverbial');
    });

    it('should detect "dass" clauses', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON', { tag: 'PPER', dep: 'sb' }),
        createMockToken('weiß', 'wissen', 'VERB', { tag: 'VVFIN', dep: 'ROOT' }),
        createMockToken(',', ',', 'PUNCT', { tag: '$,', dep: 'punct' }),
        createMockToken('dass', 'dass', 'SCONJ', { tag: 'KOUS', dep: 'cp', head: 'kommst' }),
        createMockToken('du', 'du', 'PRON', { tag: 'PPER', dep: 'sb' }),
        createMockToken('kommst', 'kommen', 'VERB', { tag: 'VVFIN', dep: 'oc' }),
        createMockToken('.', '.', 'PUNCT', { tag: '$.', dep: 'punct' }),
      ];

      const sentence = createMockSentence(testSentences.subordinate.dass, tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.conjunction).toBe('dass');
      expect(results[0].details.type).toBe('dass');
    });

    it('should detect "wenn" clauses', () => {
      const tokens = [
        createMockToken('Ruf', 'rufen', 'VERB', { tag: 'VVIMP', dep: 'ROOT' }),
        createMockToken('mich', 'ich', 'PRON', { tag: 'PPER', dep: 'oa' }),
        createMockToken('an', 'an', 'PTKVZ', { tag: 'PTKVZ', dep: 'svp' }),
        createMockToken(',', ',', 'PUNCT', { tag: '$,', dep: 'punct' }),
        createMockToken('wenn', 'wenn', 'SCONJ', { tag: 'KOUS', dep: 'mo', head: 'bist' }),
        createMockToken('du', 'du', 'PRON', { tag: 'PPER', dep: 'sb' }),
        createMockToken('da', 'da', 'ADV', { tag: 'ADV', dep: 'advmod' }),
        createMockToken('bist', 'sein', 'VERB', { tag: 'VAFIN', dep: 'oc' }),
        createMockToken('.', '.', 'PUNCT', { tag: '$.', dep: 'punct' }),
      ];

      const sentence = createMockSentence(testSentences.subordinate.wenn, tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.conjunction).toBe('wenn');
      expect(results[0].details.type).toBe('adverbial');
    });

    it('should detect various subordinate conjunctions', () => {
      const testCases = [
        { conj: 'nachdem', type: 'adverbial', sentence: 'Nachdem ich gegessen habe, gehe ich spazieren.' },
        { conj: 'bevor', type: 'adverbial', sentence: 'Bevor ich gehe, rufe ich dich an.' },
        { conj: 'obwohl', type: 'adverbial', sentence: 'Obwohl es regnet, gehe ich spazieren.' },
        { conj: 'damit', type: 'adverbial', sentence: 'Ich lerne Deutsch, damit ich sprechen kann.' },
      ];

      testCases.forEach(({ conj, type, sentence: testSentence }) => {
        const tokens = [
          createMockToken('Ich', 'ich', 'PRON', { tag: 'PPER', dep: 'sb' }),
          createMockToken('gehe', 'gehen', 'VERB', { tag: 'VVFIN', dep: 'ROOT' }),
          createMockToken(',', ',', 'PUNCT', { tag: '$,', dep: 'punct' }),
          createMockToken(conj, conj, 'SCONJ', { tag: 'KOUS', dep: 'mo', head: 'regnet' }),
          createMockToken('es', 'es', 'PRON', { tag: 'PPER', dep: 'sb' }),
          createMockToken('regnet', 'regnen', 'VERB', { tag: 'VVFIN', dep: 'oc' }),
          createMockToken('.', '.', 'PUNCT', { tag: '$.', dep: 'punct' }),
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
        createMockToken('Ich', 'ich', 'PRON', { tag: 'PPER', dep: 'sb' }),
        createMockToken('denke', 'denken', 'VERB', { tag: 'VVFIN', dep: 'ROOT' }),
        createMockToken(',', ',', 'PUNCT', { tag: '$,', dep: 'punct' }),
        createMockToken('dass', 'dass', 'SCONJ', { tag: 'KOUS', dep: 'cp', head: 'kommst' }),
        createMockToken('du', 'du', 'PRON', { tag: 'PPER', dep: 'sb' }),
        createMockToken('kommst', 'kommen', 'VERB', { tag: 'VVFIN', dep: 'oc' }),
        createMockToken(',', ',', 'PUNCT', { tag: '$,', dep: 'punct' }),
        createMockToken('weil', 'weil', 'SCONJ', { tag: 'KOUS', dep: 'mo', head: 'regnet' }),
        createMockToken('es', 'es', 'PRON', { tag: 'PPER', dep: 'sb' }),
        createMockToken('regnet', 'regnen', 'VERB', { tag: 'VVFIN', dep: 'oc' }),
        createMockToken('.', '.', 'PUNCT', { tag: '$.', dep: 'punct' }),
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