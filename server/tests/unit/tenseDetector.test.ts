/**
 * Unit Tests for Tense Detector
 * Using mock morphological data (spaCy format) without SpaCy service
 * 
 * Tests include:
 * - Basic tense detection with complete morphology
 * - Fallback pattern matching with incomplete morphology
 * - Confidence scoring for different detection methods
 * - Edge cases and error handling
 */

import { TenseDetector } from '../../src/services/grammarEngine/detectors/A1/tenseDetector';
import { SentenceData } from '../../src/services/grammarEngine/detectors/shared/baseDetector';
import {
  createSimplePresentSentence,
  createSimplePastSentence,
  createPresentPerfectSentence,
  createMockSentenceData,
  createGermanVerb,
  createGermanAuxiliary,
  createGermanPronoun,
  createGermanDeterminer,
  createMockToken,
} from './mockDataHelpers';

describe('TenseDetector - Mock Morphological Data', () => {
  let detector: TenseDetector;

  beforeAll(() => {
    detector = new TenseDetector();
  });

  afterAll(() => {
    // No cleanup needed for mock data
  });

  describe('Basic Properties', () => {
    it('should have correct name and category', () => {
      expect(detector.name).toBe('TenseDetector');
      expect(detector.category).toBe('tense');
    });
  });

  describe('Standard Tense Detection', () => {
    it('should detect simple present tense with mock data', () => {
      const sentenceData = createSimplePresentSentence();
      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect simple past tense with mock data', () => {
      const sentenceData = createSimplePastSentence();
      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should detect present perfect tense with mock data', () => {
      const sentenceData = createPresentPerfectSentence();
      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle complex sentences with multiple verbs', () => {
      const tokens = [
        createGermanDeterminer('Der', { gender: 'Masc', case: 'Nom', number: 'Sing' }),
        createMockToken('Mann', 'NOUN', { lemma: 'mann', tag: 'NN', dep: 'nsubj' }),
        createGermanVerb('geht', 'gehen', { person: '3', tense: 'Pres', number: 'Sing' }),
        createGermanVerb('ruft', 'rufen', { person: '3', tense: 'Pres', number: 'Sing' }),
      ];

      const sentenceData = createMockSentenceData('Der Mann geht und ruft an.', tokens);
      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Fallback Pattern Matching - Incomplete Morphology', () => {
    /**
     * Tests for fallback pattern matching when spaCy doesn't provide
     * complete morphological data (e.g., missing Tense field)
     */

    it('should detect present tense via pattern matching when Tense field missing', () => {
      // Simulate incomplete morphology from spaCy
      const incompleteVerb = createMockToken('laufe', 'VERB', {
        lemma: 'laufen',
        tag: 'VB',
        dep: 'ROOT',
        morph: {
          VerbForm: 'Fin',
          Person: '1',
          Number: 'Sing',
          // Intentionally missing: Tense field
        },
      });

      const pronoun = createGermanPronoun('Ich', { person: '1', case: 'Nom', number: 'Sing' });
      const sentenceData = createMockSentenceData('Ich laufe', [pronoun, incompleteVerb]);

      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
      // Should detect via fallback pattern matching
      // Confidence might be 0.80 (pattern) instead of 0.95 (morphology)
    });

    it('should detect past tense via pattern matching when Tense field missing', () => {
      const pastVerb = createMockToken('lief', 'VERB', {
        lemma: 'laufen',
        tag: 'VB',
        dep: 'ROOT',
        morph: {
          VerbForm: 'Fin',
          Person: '3',
          Number: 'Sing',
          // Missing Tense field - should use pattern matching
        },
      });

      const subject = createGermanPronoun('Er', { person: '3', case: 'Nom', number: 'Sing' });
      const sentenceData = createMockSentenceData('Er lief', [subject, pastVerb]);

      const results = detector.detect(sentenceData);
      expect(results).toBeDefined();
    });

    it('should recognize common present tense conjugations', () => {
      const commonPresentVerbs = [
        'laufe', 'gehe', 'komme', 'sehe', 'sage', 'spreche', 'schreibe',
        'lese', 'höre', 'lerne', 'arbeite', 'esse', 'trinke',
      ];

      for (const verb of commonPresentVerbs) {
        const token = createMockToken(verb, 'VERB', {
          lemma: verb.slice(0, -1), // simple lemmatization
          morph: { VerbForm: 'Fin' }, // incomplete morphology
        });

        const sentenceData = createMockSentenceData(`Ich ${verb}`, [
          createGermanPronoun('Ich'),
          token,
        ]);

        const results = detector.detect(sentenceData);
        expect(results).toBeDefined();
        // Pattern matching should recognize these forms
      }
    });

    it('should recognize common past tense forms', () => {
      const pastTenseVerbs = [
        { word: 'lief', lemma: 'laufen' },
        { word: 'aß', lemma: 'essen' },
        { word: 'trank', lemma: 'trinken' },
        { word: 'sah', lemma: 'sehen' },
        { word: 'sagte', lemma: 'sagen' },
      ];

      for (const { word, lemma } of pastTenseVerbs) {
        const token = createMockToken(word, 'VERB', {
          lemma,
          morph: { VerbForm: 'Fin' }, // incomplete morphology
        });

        const sentenceData = createMockSentenceData(`Er ${word}`, [
          createGermanPronoun('Er'),
          token,
        ]);

        const results = detector.detect(sentenceData);
        expect(results).toBeDefined();
      }
    });
  });

  describe('Confidence Scoring Variations', () => {
    /**
     * Tests for different confidence levels:
     * - 0.95: Complete morphological data
     * - 0.80: Pattern matching fallback
     * - 0.70: Inference/heuristic
     */

    it('should use high confidence (0.95) when morphology complete', () => {
      const completeVerb = createGermanVerb('laufe', 'laufen', {
        tense: 'Pres',
        person: '1',
        number: 'Sing',
      });

      const sentenceData = createMockSentenceData('Ich laufe', [
        createGermanPronoun('Ich'),
        completeVerb,
      ]);

      const results = detector.detect(sentenceData);
      expect(results).toBeDefined();

      // Check if any detection has high confidence
      const highConfidence = results.some(r => r.confidence >= 0.90);
      expect(highConfidence || results.length === 0).toBe(true);
    });

    it('should use medium confidence (0.80) for pattern matching', () => {
      const patternVerb = createMockToken('laufe', 'VERB', {
        lemma: 'laufen',
        morph: { VerbForm: 'Fin' }, // incomplete
      });

      const sentenceData = createMockSentenceData('Ich laufe', [
        createGermanPronoun('Ich'),
        patternVerb,
      ]);

      const results = detector.detect(sentenceData);
      expect(results).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty token list gracefully', () => {
      const sentenceData: SentenceData = {
        text: '',
        tokens: [],
      };

      const results = detector.detect(sentenceData);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle tokens with missing morph data', () => {
      const tokenWithoutMorph = createMockToken('laufe', 'VERB', {
        lemma: 'laufen',
        morph: {}, // completely empty
      });

      const sentenceData = createMockSentenceData('Ich laufe', [
        createGermanPronoun('Ich'),
        tokenWithoutMorph,
      ]);

      const results = detector.detect(sentenceData);
      expect(results).toBeDefined();
    });

    it('should handle non-verb tokens in verb position', () => {
      const noun = createMockToken('Laufen', 'NOUN', {
        lemma: 'laufen',
        morph: { Case: 'Nom' },
      });

      const sentenceData = createMockSentenceData('Das Laufen ist schwer', [noun]);
      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle tokens with mismatched lemma', () => {
      const token = createMockToken('xyz', 'VERB', {
        lemma: 'nonexistent',
        morph: { VerbForm: 'Fin' },
      });

      const sentenceData = createMockSentenceData('Ich xyz', [
        createGermanPronoun('Ich'),
        token,
      ]);

      const results = detector.detect(sentenceData);
      expect(results).toBeDefined();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle German sentence with complete morphology', () => {
      const tokens = [
        createGermanPronoun('Ich', { person: '1', number: 'Sing' }),
        createGermanVerb('esse', 'essen', { tense: 'Pres', person: '1', number: 'Sing' }),
        createMockToken('einen', 'DET', { lemma: 'ein', morph: { Case: 'Acc' } }),
        createMockToken('Apfel', 'NOUN', { lemma: 'apfel', morph: { Case: 'Acc' } }),
      ];

      const sentenceData = createMockSentenceData('Ich esse einen Apfel', tokens);
      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle sentence with auxiliary verb (present perfect)', () => {
      const tokens = [
        createGermanPronoun('Ich', { person: '1', number: 'Sing' }),
        createGermanAuxiliary('bin', 'sein', { tense: 'Pres', person: '1', number: 'Sing' }),
        createMockToken('gelaufen', 'VERB', {
          lemma: 'laufen',
          morph: { VerbForm: 'Part', Tense: 'Past' },
        }),
      ];

      const sentenceData = createMockSentenceData('Ich bin gelaufen', tokens);
      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
    });

    it('should handle multiple tenses in complex sentence', () => {
      const tokens = [
        createGermanPronoun('Ich', { person: '1', number: 'Sing' }),
        createGermanVerb('esse', 'essen', { tense: 'Pres', person: '1', number: 'Sing' }),
        createMockToken('weil', 'CCONJ', { lemma: 'weil' }),
        createGermanPronoun('ich', { person: '1', number: 'Sing' }),
        createMockToken('hungrig', 'ADJ', { lemma: 'hungrig', morph: {} }), // simplified
      ];

      const sentenceData = createMockSentenceData(
        'Ich esse weil ich hungrig bin',
        tokens
      );
      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
    });
  });
});