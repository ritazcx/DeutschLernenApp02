/**
 * Unit Tests for Modal Verb Detector
 */

import { ModalVerbDetector } from '../../src/services/grammarEngine/detectors/modalVerbDetector';
import { createMockSentence, createMockToken, testSentences } from '../testUtils';

describe('ModalVerbDetector', () => {
  let detector: ModalVerbDetector;

  beforeEach(() => {
    detector = new ModalVerbDetector();
  });

  describe('Basic Properties', () => {
    it('should have correct name and category', () => {
      expect(detector.name).toBe('ModalVerbDetector');
      expect(detector.category).toBe('modal-verb');
    });
  });

  describe('Modal Verb Detection', () => {
    it('should detect "Ich muss arbeiten"', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('muss', 'müssen', 'VERB', {
          morph: { Tense: 'Pres', Mood: 'Ind', Person: '1' }
        }),
        createMockToken('arbeiten', 'arbeiten', 'VERB', {
          morph: { VerbForm: 'Inf' }
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(testSentences.modal.present, tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].grammarPoint.name).toContain('Modal');
      expect(results[0].details.modalVerb).toBe('muss');
      expect(results[0].details.infinitive).toBe('arbeiten');
    });

    it('should detect "Ich musste arbeiten"', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('musste', 'müssen', 'VERB', {
          morph: { Tense: 'Past', Mood: 'Ind', Person: '1' }
        }),
        createMockToken('arbeiten', 'arbeiten', 'VERB', {
          morph: { VerbForm: 'Inf' }
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence(testSentences.modal.past, tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.modalVerb).toBe('musste');
      expect(results[0].details.infinitive).toBe('arbeiten');
    });

    it('should detect different modal verbs', () => {
      const testCases = [
        { modal: 'kann', infinitive: 'kommen', sentence: 'Ich kann kommen.' },
        { modal: 'will', infinitive: 'gehen', sentence: 'Er will gehen.' },
        { modal: 'soll', infinitive: 'warten', sentence: 'Du sollst warten.' },
        { modal: 'darf', infinitive: 'spielen', sentence: 'Sie darf spielen.' },
      ];

      testCases.forEach(({ modal, infinitive, sentence: testSentence }) => {
        const tokens = [
          createMockToken('Ich', 'ich', 'PRON'),
          createMockToken(modal, modal, 'VERB'),
          createMockToken(infinitive, infinitive, 'VERB', {
            morph: { VerbForm: 'Inf' }
          }),
          createMockToken('.', '.', 'PUNCT'),
        ];

        const sentence = createMockSentence(testSentence, tokens);
        const results = detector.detect(sentence);

        expect(results).toHaveLength(1);
        expect(results[0].details.modalVerb).toBe(modal);
        expect(results[0].details.infinitive).toBe(infinitive);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not detect modal verbs without infinitive', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('muss', 'müssen', 'VERB'),
        createMockToken('nach', 'nach', 'ADP'), // No infinitive
        createMockToken('Hause', 'Haus', 'NOUN'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich muss nach Hause.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(0);
    });

    it('should not detect non-modal verbs', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('gehe', 'gehen', 'VERB'), // Not a modal verb
        createMockToken('arbeiten', 'arbeiten', 'VERB', {
          morph: { VerbForm: 'Inf' }
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich gehe arbeiten.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(0);
    });

    it('should handle separable verbs correctly', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('muss', 'müssen', 'VERB'),
        createMockToken('auf', 'auf', 'PART'),
        createMockToken('stehen', 'stehen', 'VERB', {
          morph: { VerbForm: 'Inf' }
        }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich muss aufstehen.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.infinitive).toBe('aufstehen');
    });
  });

  describe('Complex Sentences', () => {
    it('should detect modal verbs in subordinate clauses', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('denke', 'denken', 'VERB'),
        createMockToken(',', ',', 'PUNCT'),
        createMockToken('dass', 'dass', 'SCONJ'),
        createMockToken('du', 'du', 'PRON'),
        createMockToken('kommen', 'kommen', 'VERB', {
          morph: { VerbForm: 'Inf' }
        }),
        createMockToken('kannst', 'können', 'VERB'),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich denke, dass du kommen kannst.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.modalVerb).toBe('kannst');
      expect(results[0].details.infinitive).toBe('kommen');
    });
  });
});