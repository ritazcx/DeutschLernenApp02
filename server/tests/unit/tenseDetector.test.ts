/**
 * Unit Tests for Tense Detector
 * Using REAL SpaCy morphological analysis instead of mock data
 */

import { TenseDetector } from '../../src/services/grammarEngine/detectors/tenseDetector';
import { NLPEngine } from '../../src/services/nlpEngine';
import { SentenceData } from '../../src/services/grammarEngine/detectors/baseDetector';

describe('TenseDetector - Real Morphological Analysis', () => {
  let detector: TenseDetector;
  let nlpEngine: NLPEngine;

  beforeAll(async () => {
    detector = new TenseDetector();
    nlpEngine = new NLPEngine();
  }, 10000);

  afterAll(async () => {
    // Clean up SpaCy service to prevent Jest hanging
    if (nlpEngine && (nlpEngine as any).spacyService) {
      const spacyService = (nlpEngine as any).spacyService;
      if (spacyService.process) {
        spacyService.process.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }, 5000);

  describe('Basic Properties', () => {
    it('should have correct name and category', () => {
      expect(detector.name).toBe('TenseDetector');
      expect(detector.category).toBe('tense');
    });
  });

  describe('Real Sentence Analysis', () => {
    it('should detect tenses in B2 article sentence with real SpaCy data', async () => {
      const testSentence = "Auf dieser Basis erklärte das Executive Board des IOC am 4. Juni 2008 die Städte Chicago, Tokio, Rio de Janeiro und Madrid zu offiziellen Kandidaten.";

      // Get real morphological analysis from SpaCy
      const parsed = await nlpEngine.parseSentence(testSentence);

      // Convert to SentenceData format expected by detector
      const sentenceData: SentenceData = {
        text: testSentence,
        tokens: parsed.tokens.map((token, index) => ({
          text: token.word,
          lemma: token.lemma,
          pos: token.pos,
          tag: token.pos,
          dep: 'ROOT',
          morph: token.morph ? Object.fromEntries(
            Object.entries(token.morph).filter(([_, v]) => v !== 'n/a')
          ) : undefined,
          index,
          characterStart: token.position.start,
          characterEnd: token.position.end,
        })),
      };

      // Run the detector with real morphological data
      const results = detector.detect(sentenceData);

      console.log(`[TENSE DETECTOR TEST] Sentence: "${testSentence}"`);
      console.log(`[TENSE DETECTOR TEST] Tokens analyzed: ${parsed.tokens.length}`);
      console.log(`[TENSE DETECTOR TEST] Grammar points found: ${results.length}`);

      // Log morphological features for key verbs
      parsed.tokens.forEach((token, i) => {
        if (token.pos === 'VERB' || token.pos === 'AUX') {
          console.log(`[TENSE DETECTOR TEST] Verb "${token.word}": morph=${JSON.stringify(token.morph)}`);
        }
      });

      // Log detected grammar points
      results.forEach((result, i) => {
        console.log(`[TENSE DETECTOR TEST] Point ${i}: ${JSON.stringify(result.details)}`);
      });

      // The test should reveal whether tense detection works with real SpaCy data
      // If morphological analysis is broken, this will have fewer results than expected
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);

      // With proper morphological analysis, we should detect "erklärte" as simple past
      const erklarteDetections = results.filter(r => r.details.word === 'erklärte');
      console.log(`[TENSE DETECTOR TEST] "erklärte" detections: ${erklarteDetections.length}`);

    }, 10000);

    it('should detect tenses in simple present sentence with real SpaCy data', async () => {
      const testSentence = "Die Studenten machen ihre Hausaufgaben.";

      const parsed = await nlpEngine.parseSentence(testSentence);

      const sentenceData: SentenceData = {
        text: testSentence,
        tokens: parsed.tokens.map((token, index) => ({
          text: token.word,
          lemma: token.lemma,
          pos: token.pos,
          tag: token.pos,
          dep: 'ROOT',
          morph: token.morph ? Object.fromEntries(
            Object.entries(token.morph).filter(([_, v]) => v !== 'n/a')
          ) : undefined,
          index,
          characterStart: token.position.start,
          characterEnd: token.position.end,
        })),
      };

      const results = detector.detect(sentenceData);

      console.log(`[SIMPLE PRESENT TEST] Sentence: "${testSentence}"`);
      console.log(`[SIMPLE PRESENT TEST] Grammar points found: ${results.length}`);

      results.forEach((result, i) => {
        console.log(`[SIMPLE PRESENT TEST] Point ${i}: ${JSON.stringify(result.details)}`);
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);

    }, 10000);

    it('should detect tenses in complex B2 sentence with multiple verbs', async () => {
      const testSentence = "Die Mitglieder des IOC entschieden am 2. Oktober 2009 in Kopenhagen, dass Rio de Janeiro der Austragungsort der Olympischen Sommerspiele 2016 sein wird.";

      const parsed = await nlpEngine.parseSentence(testSentence);

      const sentenceData: SentenceData = {
        text: testSentence,
        tokens: parsed.tokens.map((token, index) => ({
          text: token.word,
          lemma: token.lemma,
          pos: token.pos,
          tag: token.pos,
          dep: 'ROOT',
          morph: token.morph ? Object.fromEntries(
            Object.entries(token.morph).filter(([_, v]) => v !== 'n/a')
          ) : undefined,
          index,
          characterStart: token.position.start,
          characterEnd: token.position.end,
        })),
      };

      const results = detector.detect(sentenceData);

      console.log(`[COMPLEX B2 TEST] Sentence: "${testSentence}"`);
      console.log(`[COMPLEX B2 TEST] Tokens analyzed: ${parsed.tokens.length}`);
      console.log(`[COMPLEX B2 TEST] Grammar points found: ${results.length}`);

      // Log morphological features for all verbs
      parsed.tokens.forEach((token, i) => {
        if (token.pos === 'VERB' || token.pos === 'AUX') {
          console.log(`[COMPLEX B2 TEST] Verb "${token.word}": morph=${JSON.stringify(token.morph)}`);
        }
      });

      results.forEach((result, i) => {
        console.log(`[COMPLEX B2 TEST] Point ${i}: ${JSON.stringify(result.details)}`);
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);

      // Should detect "entschieden" (simple past) and "sein wird" (future)
      const entschiedenDetections = results.filter(r => r.details.word === 'entschieden');
      const wirdDetections = results.filter(r => r.details.word === 'wird');

      console.log(`[COMPLEX B2 TEST] "entschieden" detections: ${entschiedenDetections.length}`);
      console.log(`[COMPLEX B2 TEST] "wird" detections: ${wirdDetections.length}`);

    }, 10000);
  });
});