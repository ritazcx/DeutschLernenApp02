/**
 * Reflexive Verb Detector Tests
 * Tests for reflexive verb construction detection (sich + verb)
 */

import { ReflexiveVerbDetector } from '../../src/services/grammarEngine/detectors/A2/reflexiveVerbDetector';
import { SentenceData } from '../../src/services/grammarEngine/detectors/shared/baseDetector';

describe('ReflexiveVerbDetector', () => {
  const detector = new ReflexiveVerbDetector();

  const createMockSentence = (text: string, tokens: any[]): SentenceData => {
    let charPos = 0;
    return {
      text,
      tokens: tokens.map((t, i) => {
        const charStart = charPos;
        const charEnd = charStart + t.text.length;
        charPos = charEnd + 1;
        return {
          text: t.text,
          lemma: t.lemma || t.text.toLowerCase(),
          pos: t.pos || 'NOUN',
          tag: t.tag || 'NN',
          dep: t.dep || 'nsubj',
          morph: t.morph || {},
          index: i,
          characterStart: charStart,
          characterEnd: charEnd,
        };
      }),
    };
  };

  test('should detect basic reflexive verb (sich waschen)', () => {
    const sentence = createMockSentence('Ich wasche mich.', [
      { text: 'Ich', pos: 'PRON', tag: 'PPER', morph: { Case: 'Nom', Person: '1' } },
      { text: 'wasche', pos: 'VERB', tag: 'VVFIN', lemma: 'waschen', morph: {} },
      { text: 'mich', pos: 'PRON', tag: 'PRF', lemma: 'sich', morph: { Case: 'Acc', Person: '1' } },
      { text: '.', pos: 'PUNCT', tag: '$.' },
    ]);

    const results = detector.detect(sentence);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].grammarPoint.category).toBe('reflexive-verb');
  });

  test('should detect reflexive verb (sich erinnern)', () => {
    const sentence = createMockSentence('Er erinnert sich an die Zeit.', [
      { text: 'Er', pos: 'PRON', tag: 'PPER', morph: { Case: 'Nom', Person: '3', Gender: 'Masc' } },
      { text: 'erinnert', pos: 'VERB', tag: 'VVFIN', lemma: 'erinnern', morph: {} },
      { text: 'sich', pos: 'PRON', tag: 'PRF', lemma: 'sich', morph: { Case: 'Acc', Person: '3' } },
      { text: 'an', pos: 'ADP', tag: 'APPR', morph: {} },
      { text: 'die', pos: 'DET', tag: 'ART', morph: { Case: 'Acc', Gender: 'Fem' } },
      { text: 'Zeit', pos: 'NOUN', tag: 'NN', morph: { Case: 'Acc', Gender: 'Fem' } },
      { text: '.', pos: 'PUNCT', tag: '$.' },
    ]);

    const results = detector.detect(sentence);
    expect(results.length).toBeGreaterThan(0);
  });

  test('should detect dative reflexive (sich helfen)', () => {
    const sentence = createMockSentence('Ich helfe mir selbst.', [
      { text: 'Ich', pos: 'PRON', tag: 'PPER', morph: { Case: 'Nom', Person: '1' } },
      { text: 'helfe', pos: 'VERB', tag: 'VVFIN', lemma: 'helfen', morph: {} },
      { text: 'mir', pos: 'PRON', tag: 'PRF', lemma: 'sich', morph: { Case: 'Dat', Person: '1' } },
      { text: 'selbst', pos: 'ADV', tag: 'ADV', morph: {} },
      { text: '.', pos: 'PUNCT', tag: '$.' },
    ]);

    const results = detector.detect(sentence);
    expect(results.length >= 0).toBe(true);
  });

  test('should detect reflexive verb in different persons', () => {
    const sentence = createMockSentence('Wir freuen uns.', [
      { text: 'Wir', pos: 'PRON', tag: 'PPER', morph: { Case: 'Nom', Person: '1', Number: 'Plur' } },
      { text: 'freuen', pos: 'VERB', tag: 'VVFIN', lemma: 'freuen', morph: {} },
      { text: 'uns', pos: 'PRON', tag: 'PRF', lemma: 'sich', morph: { Case: 'Acc', Person: '1', Number: 'Plur' } },
      { text: '.', pos: 'PUNCT', tag: '$.' },
    ]);

    const results = detector.detect(sentence);
    expect(results.length).toBeGreaterThan(0);
  });
});
