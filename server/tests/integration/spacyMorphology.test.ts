/**
 * Direct SpaCy Morphological Analysis Test
 * Tests what SpaCy actually extracts from the failing sentence
 */

import { getSpacyService } from '../../src/services/nlpEngine/spacyService';

describe('Direct SpaCy Morphological Analysis', () => {
  let spacyService: any;

  beforeAll(async () => {
    spacyService = getSpacyService();
    // Wait for SpaCy to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, 10000);

  describe('Sentence Tokenization and Morphological Features', () => {
    const testSentence = "Auf dieser Basis erklärte das Executive Board des IOC am 4. Juni 2008 die Städte Chicago, Tokio, Rio de Janeiro und Madrid zu offiziellen Kandidaten.";

    it('should analyze SpaCy tokenization and morphology', async () => {
      const result = await spacyService.analyzeSentence(testSentence);

      console.log('=== DIRECT SPACY ANALYSIS ===');
      console.log('Sentence:', testSentence);
      console.log('Success:', result.success);
      console.log('Tokens returned:', result.tokens?.length || 0);

      if (result.tokens) {
        console.log('\n=== TOKEN MORPHOLOGY ANALYSIS ===');
        result.tokens.forEach((token: any, i: number) => {
          console.log(`${i.toString().padStart(2)}: "${token.word}" (${token.pos}) - lemma: "${token.lemma}" - morph:`, token.morph);

          // Check for specific words we're interested in
          if (['erklärte', 'offiziellen', 'Kandidaten', 'Auf', 'dieser', 'Basis'].includes(token.word)) {
            console.log(`    ^^ KEY WORD: morph features = ${JSON.stringify(token.morph)}`);
          }
        });

        // Analyze morphological completeness
        const morphCompleteness = result.tokens.reduce((acc: any, token: any) => {
          acc.total++;
          if (token.morph && Object.keys(token.morph).length > 0) {
            acc.withMorph++;
            Object.keys(token.morph).forEach((feature: string) => {
              acc.features.add(feature);
            });
          }
          return acc;
        }, { total: 0, withMorph: 0, features: new Set() });

        console.log('\n=== MORPHOLOGICAL COMPLETENESS ===');
        console.log(`Tokens with morphology: ${morphCompleteness.withMorph}/${morphCompleteness.total}`);
        console.log(`Morphological features found: ${Array.from(morphCompleteness.features).join(', ')}`);

        // Check for expected features
        const expectedFeatures = ['Case', 'Gender', 'Number', 'Tense', 'VerbForm'];
        const foundFeatures = Array.from(morphCompleteness.features);
        const missingFeatures = expectedFeatures.filter(f => !foundFeatures.includes(f));

        console.log(`Expected features: ${expectedFeatures.join(', ')}`);
        console.log(`Missing features: ${missingFeatures.join(', ')}`);

        expect(result.success).toBe(true);
        expect(result.tokens.length).toBeGreaterThan(0);
        expect(morphCompleteness.withMorph).toBeGreaterThan(0);
      } else {
        console.log('No tokens returned from SpaCy');
        fail('SpaCy analysis failed');
      }
    }, 10000);
  });
});