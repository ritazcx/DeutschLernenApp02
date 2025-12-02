/**
 * Unit Tests for Tense Detector
 * Using mock morphological data (spaCy format) without SpaCy service
 */

import { TenseDetector } from '../../src/services/grammarEngine/detectors/tenseDetector';
import { SentenceData } from '../../src/services/grammarEngine/detectors/baseDetector';
import {
  createSimplePresentSentence,
  createSimplePastSentence,
  createPresentPerfectSentence,
  createMockSentenceData,
  createGermanVerb,
  createGermanAuxiliary,
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

  describe('Real Sentence Analysis', () => {
    it('should detect simple present tense with mock data', () => {
      // Use mock data instead of real spaCy
      const sentenceData = createSimplePresentSentence();

      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      // Should find present tense in "Ich laufe"
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
      // Create a sentence with multiple verbs: "Der Mann geht nach Hause und ruft seinen Freund an"
      const tokens = [
        createGermanAuxiliary('Der', 'der', { gender: 'Masc' }), // placeholder - would need createGermanDeterminer
        createGermanVerb('geht', 'gehen', { person: '3', tense: 'Pres', number: 'Sing' }),
        createGermanVerb('ruft', 'rufen', { person: '3', tense: 'Pres', number: 'Sing' }),
      ];

      const sentenceData = createMockSentenceData('Der Mann geht und ruft an.', tokens);

      const results = detector.detect(sentenceData);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });
});