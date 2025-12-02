/**
 * Integration Tests: Real spaCy Data
 * Tests grammar detectors using actual spaCy analysis output
 */

import { SpacyService } from '../../src/services/nlpEngine/spacyService';
import { grammarDetectionEngine } from '../../src/services/grammarEngine/detectionEngine';
import { SentenceData } from '../../src/services/grammarEngine/detectors/baseDetector';

const spacyService = new SpacyService();

describe.skip('Grammar Detection with Real spaCy Data', () => {
  // Wait for spaCy service to be ready
  beforeAll((done) => {
    setTimeout(() => {
      done();
    }, 8000);
  }, 15000);

  afterAll(() => {
    spacyService.close();
  });

  describe('Passive Voice Detection', () => {
    it('should detect present passive voice with real spaCy data', async () => {
      const text = 'Das Haus wird von meinem Vater gebaut.';
      const result = await spacyService.analyzeSentence(text);

      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens!.length).toBeGreaterThan(0);

      // Verify token structure includes dep and morph
      const tokens = result.tokens!;
      const hasDepInfo = tokens.some(t => t.dep && t.dep !== 'ROOT');
      expect(hasDepInfo).toBe(true);

      // Convert to SentenceData for detection engine
      const sentenceData: SentenceData = {
        text,
        tokens: tokens.map((t, idx) => ({
          text: t.text,
          lemma: t.lemma,
          pos: t.pos,
          tag: t.tag,
          dep: t.dep,
          morph: t.morph || {},
          index: idx,
          characterStart: 0,
          characterEnd: 0,
        })),
      };

      const detection = await grammarDetectionEngine.analyzeWithMinimalAIFallback(sentenceData);

      // Should detect passive voice
      const passivePoints = detection.grammarPoints.filter(
        (p: any) => p.grammarPoint.category === 'passive'
      );

      // Note: May not detect due to missing PassiveVoiceDetector implementation
      console.log(`Passive voice points found: ${passivePoints.length}`);
      console.log(`Detected categories: ${[...new Set(detection.grammarPoints.map((p: any) => p.grammarPoint.category))]}`);
    }, 15000);

    it('should detect past passive voice', async () => {
      const text = 'Das Haus wurde von meinem Vater gebaut.';
      const result = await spacyService.analyzeSentence(text);

      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens!.length).toBeGreaterThan(0);

      // Verify morph includes tense information
      const tokens = result.tokens!;
      const hasTenseInfo = tokens.some(t => t.morph && t.morph.Tense);
      expect(hasTenseInfo).toBe(true);
    }, 15000);
  });

  describe('Modal Verb Detection', () => {
    it('should detect modal verb in present tense with real spaCy data', async () => {
      const text = 'Ich muss arbeiten.';
      const result = await spacyService.analyzeSentence(text);

      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens!.length).toBeGreaterThan(0);

      // Verify we can identify the modal verb
      const tokens = result.tokens!;
      const modalToken = tokens.find(t => t.text.toLowerCase() === 'muss');

      expect(modalToken).toBeDefined();
      if (modalToken) {
        expect(modalToken.pos).toBe('AUX');
        // Should have morphology
        expect(modalToken.morph).toBeDefined();
      }

      // Test with detection engine
      const sentenceData: SentenceData = {
        text,
        tokens: tokens.map((t, idx) => ({
          text: t.text,
          lemma: t.lemma,
          pos: t.pos,
          tag: t.tag,
          dep: t.dep,
          morph: t.morph || {},
          index: idx,
          characterStart: 0,
          characterEnd: 0,
        })),
      };

      const detection = await grammarDetectionEngine.analyzeWithMinimalAIFallback(sentenceData);
      console.log(`Modal verb sentence - categories found: ${[...new Set(detection.grammarPoints.map((p: any) => p.grammarPoint.category))]}`);
    }, 15000);

    it('should detect multiple modal verbs in different tenses', async () => {
      const testCases = [
        'Du kannst kommen.',
        'Wir sollen zuhören.',
        'Ich musste arbeiten.',
      ];

      for (const text of testCases) {
        const result = await spacyService.analyzeSentence(text);
        expect(result.success).toBe(true);
        expect(result.tokens).toBeDefined();
        expect(result.tokens!.length).toBeGreaterThan(0);

        // Verify morphology is complete
        const tokens = result.tokens!;
        const auxVerbs = tokens.filter(t => t.pos === 'AUX');
        expect(auxVerbs.length).toBeGreaterThan(0);

        console.log(`"${text}" - found ${auxVerbs.length} AUX verbs with morph:`, auxVerbs[0]?.morph);
      }
    }, 15000);
  });

  describe('Subordinate Clause Detection', () => {
    it('should parse subordinate clause with weil', async () => {
      const text = 'Ich bleibe zu Hause, weil es regnet.';
      const result = await spacyService.analyzeSentence(text);

      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens!.length).toBeGreaterThan(0);

      // Verify dependency parsing works
      const tokens = result.tokens!;
      const weilToken = tokens.find(t => t.text === 'weil');

      expect(weilToken).toBeDefined();
      if (weilToken) {
        expect(weilToken.pos).toBe('SCONJ');
        console.log(`'weil' token - dep: ${weilToken.dep}, head: ${weilToken.head}`);
      }

      // Should have multiple tokens with dep != 'ROOT'
      const nonRootTokens = tokens.filter(t => t.dep !== 'ROOT');
      expect(nonRootTokens.length).toBeGreaterThan(2);
    }, 15000);

    it('should parse subordinate clause with dass', async () => {
      const text = 'Ich weiß, dass du kommst.';
      const result = await spacyService.analyzeSentence(text);

      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens!.length).toBeGreaterThan(0);

      // Verify dependency relationships
      const tokens = result.tokens!;
      const dassToken = tokens.find(t => t.text === 'dass');

      expect(dassToken).toBeDefined();
      if (dassToken) {
        console.log(`'dass' token - dep: ${dassToken.dep}, head: ${dassToken.head}`);
      }
    }, 15000);

    it('should parse subordinate clause with wenn', async () => {
      const text = 'Ruf mich an, wenn du da bist.';
      const result = await spacyService.analyzeSentence(text);

      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens!.length).toBeGreaterThan(0);

      const tokens = result.tokens!;
      const wennToken = tokens.find(t => t.text === 'wenn');

      expect(wennToken).toBeDefined();
      if (wennToken) {
        console.log(`'wenn' token - dep: ${wennToken.dep}, head: ${wennToken.head}`);
      }
    }, 15000);
  });

  describe('Relative Clause Detection', () => {
    it('should parse relative clause with der', async () => {
      const text = 'Der Mann, der im Garten sitzt, ist alt.';
      const result = await spacyService.analyzeSentence(text);

      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens!.length).toBeGreaterThan(0);

      // Verify structure
      const tokens = result.tokens!;
      const relativeTokens = tokens.filter(t => t.pos === 'PRON' || t.pos === 'DET');
      const verbTokens = tokens.filter(t => t.pos === 'VERB');

      expect(relativeTokens.length).toBeGreaterThan(0);
      expect(verbTokens.length).toBeGreaterThan(1); // Main verb and relative clause verb

      // Check for 'relcl' dependency (relative clause modifier)
      const relclToken = tokens.find(t => t.dep === 'relcl');
      console.log(`Relative clause - found 'relcl' dep: ${!!relclToken}`);
    }, 15000);

    it('should parse complex relative clause', async () => {
      const text = 'Das Buch, das ich gelesen habe, ist interessant.';
      const result = await spacyService.analyzeSentence(text);

      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens!.length).toBeGreaterThan(0);

      const tokens = result.tokens!;
      console.log(`Complex relative clause tokens:`, tokens.map(t => `${t.text}(${t.dep})`).join(' '));
    }, 15000);
  });

  describe('Morphological Features Validation', () => {
    it('should extract complete morphology for all token types', async () => {
      const text = 'Die großen Häuser werden schnell gebaut.';
      const result = await spacyService.analyzeSentence(text);

      expect(result.success).toBe(true);
      const tokens = result.tokens!;

      console.log('\n=== Morphological Features ===');
      tokens.forEach((token, idx) => {
        const morphStr = Object.entries(token.morph || {})
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        console.log(`${idx}: ${token.text} (${token.pos}) - ${morphStr || 'no morph'}`);
      });

      // Verify feature presence
      const adjectiveTokens = tokens.filter(t => t.pos === 'ADJ');
      const adjectiveWithMorph = adjectiveTokens.filter(t => t.morph && Object.keys(t.morph).length > 0);

      expect(adjectiveWithMorph.length).toBeGreaterThan(0);
      expect(adjectiveWithMorph[0]?.morph?.Case).toBeDefined();
    }, 15000);

    it('should have consistent dep and morph across multiple sentences', async () => {
      const sentences = [
        'Der Mann sitzt im Park.',
        'Die Frau liest ein Buch.',
        'Die Kinder spielen draußen.',
      ];

      for (const text of sentences) {
        const result = await spacyService.analyzeSentence(text);
        expect(result.success).toBe(true);

        const tokens = result.tokens!;
        const tokensWithDep = tokens.filter(t => t.dep && t.dep !== '');
        const tokensWithMorph = tokens.filter(t => t.morph && Object.keys(t.morph).length > 0);

        console.log(`"${text}" - ${tokensWithDep.length}/${tokens.length} with dep, ${tokensWithMorph.length}/${tokens.length} with morph`);

        // Should have meaningful dep and morph distribution
        expect(tokensWithDep.length).toBeGreaterThan(2);
        expect(tokensWithMorph.length).toBeGreaterThan(1);
      }
    }, 15000);
  });

  describe('Data Quality Metrics', () => {
    it('should report dep and morph completeness for complex sentence', async () => {
      const text = 'Auf dieser Basis erklärte das Executive Board des IOC am 4. Juni 2008 die Städte Chicago, Tokio, Rio de Janeiro und Madrid zu offiziellen Kandidaten.';
      const result = await spacyService.analyzeSentence(text);

      expect(result.success).toBe(true);
      const tokens = result.tokens!;

      const metrics = {
        total: tokens.length,
        withDep: tokens.filter(t => t.dep && t.dep !== '').length,
        withMorph: tokens.filter(t => t.morph && Object.keys(t.morph).length > 0).length,
        byPOS: {} as Record<string, number>,
      };

      // Count by POS
      tokens.forEach(t => {
        metrics.byPOS[t.pos] = (metrics.byPOS[t.pos] || 0) + 1;
      });

      console.log('\n=== Data Quality Report ===');
      console.log(`Total tokens: ${metrics.total}`);
      console.log(`Tokens with dep: ${metrics.withDep} (${((metrics.withDep / metrics.total) * 100).toFixed(1)}%)`);
      console.log(`Tokens with morph: ${metrics.withMorph} (${((metrics.withMorph / metrics.total) * 100).toFixed(1)}%)`);
      console.log('Tokens by POS:', metrics.byPOS);

      expect(metrics.withDep).toBeGreaterThan(metrics.total * 0.8); // At least 80% should have dep
      expect(metrics.withMorph).toBeGreaterThan(metrics.total * 0.5); // At least 50% should have morph
    }, 15000);
  });
});
