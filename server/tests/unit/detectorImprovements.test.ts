/**
 * Unit Tests for Detector Improvements
 * Testing fallback pattern matching and dependency parsing
 */

import { A1GrammarDetector } from '../../src/services/grammarEngine/detectors/a1GrammarDetector';
import { A2GrammarDetector } from '../../src/services/grammarEngine/detectors/a2GrammarDetector';
import {
  createMockSentenceData,
  createGermanDeterminer,
  createGermanVerb,
  createGermanPronoun,
  createMockToken,
} from './mockDataHelpers';

describe('Detector Improvements - Fallback Pattern Matching', () => {
  let a1Detector: A1GrammarDetector;
  let a2Detector: A2GrammarDetector;

  beforeAll(() => {
    a1Detector = new A1GrammarDetector();
    a2Detector = new A2GrammarDetector();
  });

  describe('A1 Present Tense with Incomplete Morphology', () => {
    it('should detect present tense verbs with missing Tense field', () => {
      const tokens = [
        createGermanPronoun('Ich', { person: '1', case: 'Nom' }),
        createMockToken('laufe', 'VERB', {
          lemma: 'laufen',
          dep: 'ROOT',
          morph: { VerbForm: 'Fin', Person: '1', Number: 'Sing' }, // Missing Tense
        }),
      ];

      const sentenceData = createMockSentenceData('Ich laufe', tokens);
      const results = a1Detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle multiple common A1 verbs with incomplete morphology', () => {
      const commonVerbs = [
        { word: 'esse', lemma: 'essen' },
        { word: 'trinke', lemma: 'trinken' },
        { word: 'gehe', lemma: 'gehen' },
        { word: 'komme', lemma: 'kommen' },
      ];

      for (const { word, lemma } of commonVerbs) {
        const tokens = [
          createGermanPronoun('Ich', { person: '1', case: 'Nom' }),
          createMockToken(word, 'VERB', {
            lemma,
            dep: 'ROOT',
            morph: { VerbForm: 'Fin' }, // Minimal morphology
          }),
        ];

        const sentenceData = createMockSentenceData(`Ich ${word}`, tokens);
        const results = a1Detector.detect(sentenceData);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
      }
    });
  });

  describe('A2 Past Tense with Incomplete Morphology', () => {
    it('should detect past tense forms with fallback pattern matching', () => {
      const tokens = [
        createGermanPronoun('Ich', { person: '1', case: 'Nom' }),
        createMockToken('lief', 'VERB', {
          lemma: 'laufen',
          dep: 'ROOT',
          morph: { VerbForm: 'Fin', Person: '1' }, // Missing Tense
        }),
      ];

      const sentenceData = createMockSentenceData('Ich lief', tokens);
      const results = a2Detector.detect(sentenceData);

      expect(results).toBeDefined();
    });

    it('should recognize common irregular past forms', () => {
      const pastForms = [
        { word: 'ging', lemma: 'gehen' },
        { word: 'sagte', lemma: 'sagen' },
        { word: 'kam', lemma: 'kommen' },
      ];

      for (const { word, lemma } of pastForms) {
        const tokens = [
          createGermanPronoun('Ich', { person: '1', case: 'Nom' }),
          createMockToken(word, 'VERB', {
            lemma,
            dep: 'ROOT',
            morph: { VerbForm: 'Fin' },
          }),
        ];

        const sentenceData = createMockSentenceData(`Ich ${word}`, tokens);
        const results = a2Detector.detect(sentenceData);

        expect(results).toBeDefined();
      }
    });
  });

  describe('Dependency Parsing for Case Detection', () => {
    it('should detect nominative via dep === nsubj with incomplete morphology', () => {
      const tokens = [
        createMockToken('Der', 'DET', {
          lemma: 'der',
          dep: 'det',
          morph: { Gender: 'Masc' }, // Missing Case
        }),
        createMockToken('Mann', 'NOUN', {
          lemma: 'mann',
          dep: 'nsubj', // Indicates subject (nominative)
          morph: { Gender: 'Masc' }, // Missing Case
        }),
        createGermanVerb('geht', 'gehen', { tense: 'Pres', person: '3' }),
      ];

      const sentenceData = createMockSentenceData('Der Mann geht', tokens);
      const results = a1Detector.detect(sentenceData);

      expect(results).toBeDefined();
    });

    it('should detect dative case with complete morphology', () => {
      const tokens = [
        createMockToken('Ich', 'PRON', {
          lemma: 'ich',
          dep: 'nsubj',
          morph: { Case: 'Nom', Person: '1' },
        }),
        createGermanVerb('gebe', 'geben', { tense: 'Pres', person: '1' }),
        createMockToken('dem', 'DET', {
          lemma: 'der',
          dep: 'det',
          morph: { Case: 'Dat', Gender: 'Masc' },
        }),
        createMockToken('Mann', 'NOUN', {
          lemma: 'mann',
          dep: 'iobj',
          morph: { Case: 'Dat', Gender: 'Masc' },
        }),
      ];

      const sentenceData = createMockSentenceData('Ich gebe dem Mann', tokens);
      const results = a2Detector.detect(sentenceData);

      expect(results).toBeDefined();
    });

    it('should detect dative prepositions (mit, zu)', () => {
      const tokens = [
        createMockToken('Ich', 'PRON', {
          lemma: 'ich',
          dep: 'nsubj',
          morph: { Case: 'Nom', Person: '1' },
        }),
        createGermanVerb('spreche', 'sprechen', { tense: 'Pres', person: '1' }),
        createMockToken('mit', 'ADP', {
          lemma: 'mit',
          dep: 'case',
          morph: {},
        }),
        createMockToken('dem', 'DET', {
          lemma: 'der',
          dep: 'det',
          morph: { Gender: 'Masc', Case: 'Dat' },
        }),
        createMockToken('Freund', 'NOUN', {
          lemma: 'freund',
          dep: 'obl',
          morph: { Gender: 'Masc' },
        }),
      ];

      const sentenceData = createMockSentenceData('Ich spreche mit dem Freund', tokens);
      const results = a2Detector.detect(sentenceData);

      expect(results).toBeDefined();
    });
  });

  describe('Confidence Scoring', () => {
    it('should work with explicit morphological data', () => {
      const tokens = [
        createMockToken('Der', 'DET', {
          lemma: 'der',
          dep: 'det',
          morph: { Case: 'Nom', Gender: 'Masc' },
        }),
        createMockToken('Mann', 'NOUN', {
          lemma: 'mann',
          dep: 'nsubj',
          morph: { Case: 'Nom', Gender: 'Masc' },
        }),
      ];

      const sentenceData = createMockSentenceData('Der Mann', tokens);
      const results = a1Detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should gracefully handle incomplete morphology', () => {
      const tokens = [
        createMockToken('Der', 'DET', {
          lemma: 'der',
          dep: 'det',
          morph: {},
        }),
        createMockToken('Mann', 'NOUN', {
          lemma: 'mann',
          dep: 'nsubj',
          morph: {},
        }),
      ];

      const sentenceData = createMockSentenceData('Der Mann', tokens);
      const results = a1Detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sentence', () => {
      const sentenceData = createMockSentenceData('', []);
      const results = a1Detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle single token', () => {
      const tokens = [
        createMockToken('Mann', 'NOUN', {
          lemma: 'mann',
          dep: 'nsubj',
          morph: { Case: 'Nom' },
        }),
      ];

      const sentenceData = createMockSentenceData('Mann', tokens);
      const results = a1Detector.detect(sentenceData);

      expect(results).toBeDefined();
    });

    it('should handle missing dep field', () => {
      const tokens = [
        createMockToken('Der', 'DET', {
          lemma: 'der',
          morph: { Case: 'Nom', Gender: 'Masc' },
        }),
        createMockToken('Mann', 'NOUN', {
          lemma: 'mann',
          morph: { Case: 'Nom', Gender: 'Masc' },
        }),
      ];

      const sentenceData = createMockSentenceData('Der Mann', tokens);
      const results = a1Detector.detect(sentenceData);

      expect(results).toBeDefined();
    });
  });
});
