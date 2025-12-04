/**
 * Unit Tests for Functional Verb Detector
 * Tests B2-level Funktionsverbgefüge detection
 */

import { FunctionalVerbDetector } from '../../src/services/grammarEngine/detectors/B2/functionalVerbDetector';
import { createMockSentence, createMockToken } from '../testUtils';

describe('FunctionalVerbDetector', () => {
  let detector: FunctionalVerbDetector;

  beforeEach(() => {
    detector = new FunctionalVerbDetector();
  });

  describe('Basic Properties', () => {
    it('should have correct name and category', () => {
      expect(detector.name).toBe('FunctionalVerbDetector');
      expect(detector.category).toBe('functional-verb');
    });
  });

  describe('Simple Accusative Patterns (no preposition)', () => {
    it('should detect "Antwort geben" (give answer)', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('gebe', 'geben', 'VERB'),
        createMockToken('Antwort', 'Antwort', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich gebe Antwort.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].grammarPointId).toBe('b2-functional-verb');
      expect(results[0].details.verb.text).toBe('gebe');
      expect(results[0].details.noun.text).toBe('Antwort');
      expect(results[0].details.simpleVerb).toBe('antworten');
    });

    it('should detect "Bescheid geben" (notify)', () => {
      const tokens = [
        createMockToken('Er', 'er', 'PRON'),
        createMockToken('gibt', 'geben', 'VERB'),
        createMockToken('Bescheid', 'Bescheid', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Er gibt Bescheid.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('benachrichtigen');
    });

    it('should detect "Abschied nehmen" (say goodbye)', () => {
      const tokens = [
        createMockToken('Wir', 'wir', 'PRON'),
        createMockToken('nehmen', 'nehmen', 'VERB'),
        createMockToken('Abschied', 'Abschied', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Wir nehmen Abschied.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('sich verabschieden');
    });

    it('should detect "Entscheidung treffen" (make decision)', () => {
      const tokens = [
        createMockToken('Sie', 'sie', 'PRON'),
        createMockToken('trifft', 'treffen', 'VERB'),
        createMockToken('Entscheidung', 'Entscheidung', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Sie trifft Entscheidung.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('entscheiden');
    });
  });

  describe('Prepositional Patterns with "zu"', () => {
    it('should detect "zur Verfügung stellen" (make available)', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('stelle', 'stellen', 'VERB'),
        createMockToken('es', 'es', 'PRON'),
        createMockToken('zur', 'zu', 'ADP', { tag: 'APPRART' }),
        createMockToken('Verfügung', 'Verfügung', 'NOUN', { morph: { Case: 'Dat' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich stelle es zur Verfügung.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.verb.text).toBe('stelle');
      expect(results[0].details.preposition.text).toBe('zur');
      expect(results[0].details.noun.text).toBe('Verfügung');
      expect(results[0].details.simpleVerb).toBe('verfügbar machen');
    });

    it('should detect "zur Verfügung stehen" (be available)', () => {
      const tokens = [
        createMockToken('Es', 'es', 'PRON'),
        createMockToken('steht', 'stehen', 'VERB'),
        createMockToken('zur', 'zu', 'ADP', { tag: 'APPRART' }),
        createMockToken('Verfügung', 'Verfügung', 'NOUN', { morph: { Case: 'Dat' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Es steht zur Verfügung.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('verfügbar sein');
    });

    it('should detect "zum Ausdruck bringen" (express)', () => {
      const tokens = [
        createMockToken('Er', 'er', 'PRON'),
        createMockToken('bringt', 'bringen', 'VERB'),
        createMockToken('es', 'es', 'PRON'),
        createMockToken('zum', 'zu', 'ADP', { tag: 'APPRART' }),
        createMockToken('Ausdruck', 'Ausdruck', 'NOUN', { morph: { Case: 'Dat' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Er bringt es zum Ausdruck.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('ausdrücken');
    });
  });

  describe('Prepositional Patterns with "in"', () => {
    it('should detect "in Frage stellen" (question/doubt)', () => {
      const tokens = [
        createMockToken('Wir', 'wir', 'PRON'),
        createMockToken('stellen', 'stellen', 'VERB'),
        createMockToken('das', 'das', 'PRON'),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Frage', 'Frage', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Wir stellen das in Frage.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('bezweifeln');
    });

    it('should detect "in Frage kommen" (be possible)', () => {
      const tokens = [
        createMockToken('Das', 'das', 'PRON'),
        createMockToken('kommt', 'kommen', 'VERB'),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Frage', 'Frage', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das kommt in Frage.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('möglich sein');
    });

    it('should detect "in Anspruch nehmen" (claim/utilize)', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('nehme', 'nehmen', 'VERB'),
        createMockToken('es', 'es', 'PRON'),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Anspruch', 'Anspruch', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich nehme es in Anspruch.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('beanspruchen');
    });

    it('should detect "in Ordnung bringen" (put in order)', () => {
      const tokens = [
        createMockToken('Er', 'er', 'PRON'),
        createMockToken('bringt', 'bringen', 'VERB'),
        createMockToken('alles', 'alles', 'PRON'),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Ordnung', 'Ordnung', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Er bringt alles in Ordnung.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('ordnen');
    });
  });

  describe('Synonym Support', () => {
    it('should detect "zur Disposition stellen" (synonym of Verfügung)', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('stelle', 'stellen', 'VERB'),
        createMockToken('es', 'es', 'PRON'),
        createMockToken('zur', 'zu', 'ADP', { tag: 'APPRART' }),
        createMockToken('Disposition', 'Disposition', 'NOUN', { morph: { Case: 'Dat' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich stelle es zur Disposition.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('verfügbar machen');
    });

    it('should detect "in Zweifel stellen" (synonym of Frage)', () => {
      const tokens = [
        createMockToken('Das', 'das', 'PRON'),
        createMockToken('stellt', 'stellen', 'VERB'),
        createMockToken('es', 'es', 'PRON'),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Zweifel', 'Zweifel', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Das stellt es in Zweifel.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].details.simpleVerb).toBe('bezweifeln');
    });
  });

  describe('Article Rejection Logic', () => {
    it('should reject when plain preposition has separate article', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('stelle', 'stellen', 'VERB'),
        createMockToken('es', 'es', 'PRON'),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('die', 'der', 'DET', { pos: 'ART' }),
        createMockToken('Frage', 'Frage', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich stelle es in die Frage.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(0);
    });

    it('should accept accusative patterns with article', () => {
      const tokens = [
        createMockToken('Sie', 'sie', 'PRON'),
        createMockToken('trifft', 'treffen', 'VERB'),
        createMockToken('eine', 'ein', 'DET', { pos: 'ART' }),
        createMockToken('Entscheidung', 'Entscheidung', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Sie trifft eine Entscheidung.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
    });
  });

  describe('Multi-range Position Support', () => {
    it('should provide multiple position ranges for non-contiguous components', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('stelle', 'stellen', 'VERB'),
        createMockToken('das', 'das', 'PRON'),
        createMockToken('in', 'in', 'ADP'),
        createMockToken('Frage', 'Frage', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich stelle das in Frage.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].positions).toBeDefined();
      expect(results[0].positions!.length).toBeGreaterThan(1);
      expect(results[0].details.compactForm).toBe('stelle ... in Frage');
    });
  });

  describe('Edge Cases', () => {
    it('should not detect non-functional verb usage', () => {
      const tokens = [
        createMockToken('Ich', 'ich', 'PRON'),
        createMockToken('gebe', 'geben', 'VERB'),
        createMockToken('dir', 'dir', 'PRON'),
        createMockToken('Geld', 'Geld', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Ich gebe dir Geld.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(0);
    });

    it('should handle multiple functional verbs in one sentence', () => {
      const tokens = [
        createMockToken('Er', 'er', 'PRON'),
        createMockToken('gibt', 'geben', 'VERB'),
        createMockToken('Antwort', 'Antwort', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('und', 'und', 'CCONJ'),
        createMockToken('trifft', 'treffen', 'VERB'),
        createMockToken('Entscheidung', 'Entscheidung', 'NOUN', { morph: { Case: 'Acc' } }),
        createMockToken('.', '.', 'PUNCT'),
      ];

      const sentence = createMockSentence('Er gibt Antwort und trifft Entscheidung.', tokens);
      const results = detector.detect(sentence);

      expect(results).toHaveLength(2);
    });

    it('should return empty array for sentences without functional verbs', () => {
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
  });
});
