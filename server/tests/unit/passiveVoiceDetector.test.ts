/**
 * Unit Tests for Passive Voice Detector
 */

import { PassiveVoiceDetector } from '../../src/services/grammarEngine/detectors/B1/passiveVoiceDetector';
import { createMockSentence, createMockToken, testSentences } from '../testUtils';

describe('PassiveVoiceDetector', () => {
  let detector: PassiveVoiceDetector;

  beforeEach(() => {
    detector = new PassiveVoiceDetector();
  });

  describe('Basic Properties', () => {
    it('should have correct name and category', () => {
      expect(detector.name).toBe('PassiveVoiceDetector');
      expect(detector.category).toBe('passive');
    });
  });

  describe('Present Passive Detection', () => {
    it('should detect "Das Haus wird von meinem Vater gebaut"', () => {
      // Create mock tokens with proper POS tags and morphology
      const tokens = [
        createMockToken('Das', 'der', 'ART'),
        createMockToken('Haus', 'Haus', 'NOUN'),
        createMockToken('wird', 'werden', 'VERB', {
          morph: { Tense: 'Pres', Mood: 'Ind', Person: '3' }
        }),
        createMockToken('von', 'von', 'PREP'),
        createMockToken('meinem', 'mein', 'ART'),
        createMockToken('Vater', 'Vater', 'NOUN'),
        createMockToken('gebaut', 'bauen', 'VERB', {
          morph: { Tense: 'Perf', Voice: 'Pass' }
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(testSentences.passive.present, tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].grammarPoint.name).toContain('Präsens');
      expect(results[0].details.passiveType).toBe('present');
      expect(results[0].details.auxiliary).toBe('wird');
      expect(results[0].details.participle).toBe('gebaut');
    });

    it('should detect passive without agent phrase', () => {
      const tokens = [
        createMockToken('Das', 'der', 'ART'),
        createMockToken('Haus', 'Haus', 'NOUN'),
        createMockToken('wird', 'werden', 'VERB', {
          morph: { Tense: 'Pres', Mood: 'Ind', Person: '3' }
        }),
        createMockToken('gebaut', 'bauen', 'VERB', {
          morph: { Tense: 'Perf', Voice: 'Pass' }
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das Haus wird gebaut.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.passiveType).toBe('present');
    });
  });

  describe('Past Passive Detection', () => {
    it('should detect "Das Haus wurde von meinem Vater gebaut"', () => {
      const tokens = [
        createMockToken('Das', 'der', 'ART'),
        createMockToken('Haus', 'Haus', 'NOUN'),
        createMockToken('wurde', 'werden', 'VERB', {
          morph: { Tense: 'Past', Mood: 'Ind', Person: '3' }
        }),
        createMockToken('von', 'von', 'PREP'),
        createMockToken('meinem', 'mein', 'ART'),
        createMockToken('Vater', 'Vater', 'NOUN'),
        createMockToken('gebaut', 'bauen', 'VERB', {
          morph: { Tense: 'Perf', Voice: 'Pass' }
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(testSentences.passive.past, tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].grammarPoint.name).toContain('Vergangenheit');
      expect(results[0].details.passiveType).toBe('past');
      expect(results[0].details.auxiliary).toBe('wurde');
    });
  });

  describe('Edge Cases', () => {
    it('should not detect passive in active sentences', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('baue', 'bauen', 'VERB'),
        createMockToken('das', 'der', 'ART'),
        createMockToken('Haus', 'Haus', 'NOUN'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich baue das Haus.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(0);
    });

    it('should not detect passive with wrong auxiliary', () => {
      const tokens = [
        createMockToken('Das', 'der', 'ART'),
        createMockToken('Haus', 'Haus', 'NOUN'),
        createMockToken('hat', 'haben', 'AUX'), // Wrong auxiliary
        createMockToken('gebaut', 'bauen', 'VERB', {
          morph: { Tense: 'Perf', Voice: 'Pass' }
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das Haus hat gebaut.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(0);
    });

    it('should not detect passive with non-participle verb', () => {
      const tokens = [
        createMockToken('Das', 'der', 'ART'),
        createMockToken('Haus', 'Haus', 'NOUN'),
        createMockToken('wird', 'werden', 'VERB', {
          morph: { Tense: 'Pres', Mood: 'Ind', Person: '3' }
        }),
        createMockToken('bauen', 'bauen', 'VERB'), // Present tense, not participle
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das Haus wird bauen.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(0);
    });
  });

  describe('Complex Agent Phrases', () => {
    it('should handle complex prepositional phrases', () => {
      const tokens = [
        createMockToken('Der', 'der', 'ART'),
        createMockToken('Brief', 'Brief', 'NOUN'),
        createMockToken('wird', 'werden', 'VERB', {
          morph: { Tense: 'Pres', Mood: 'Ind', Person: '3' }
        }),
        createMockToken('von', 'von', 'PREP'),
        createMockToken('meiner', 'mein', 'ART'),
        createMockToken('besten', 'gut', 'ADJ'),
        createMockToken('Freundin', 'Freundin', 'NOUN'),
        createMockToken('geschrieben', 'schreiben', 'VERB', {
          morph: { Tense: 'Perf', Voice: 'Pass' }
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Der Brief wird von meiner besten Freundin geschrieben.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.passiveType).toBe('present');
    });
  });
});