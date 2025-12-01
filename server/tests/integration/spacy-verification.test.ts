/**
 * Quick Verification Test for spaCy Service
 * Minimal test to verify that globalSetup/Teardown works correctly
 */

import { getNLPEngineForIntegrationTests, isSpacyServiceReady } from '../integrationUtils';

describe('spaCy Service Integration - Quick Verification', () => {
  beforeAll(() => {
    console.log('\n✓ Test suite starting, spaCy service ready:', isSpacyServiceReady());
  });

  it('should have spaCy service ready from global setup', () => {
    const ready = isSpacyServiceReady();
    console.log('spaCy service ready:', ready);
    expect(ready).toBe(true);
  });

  it('should create NLPEngine with shared spaCy service', () => {
    const engine = getNLPEngineForIntegrationTests();
    expect(engine).toBeDefined();
    console.log('✓ NLPEngine created successfully');
  });

  it('should analyze a simple sentence', async () => {
    const engine = getNLPEngineForIntegrationTests();
    const result = await engine.analyzeGrammar('Das ist einfach.');

    expect(result.sentence).toBe('Das ist einfach.');
    expect(result.summary.totalPoints).toBeGreaterThanOrEqual(0);
    console.log(`✓ Analyzed sentence, found ${result.summary.totalPoints} grammar points`);
  }, 20000);

  it('should analyze multiple sentences without restarting spaCy', async () => {
    const engine = getNLPEngineForIntegrationTests();

    const sentences = [
      'Ich bin ein Student.',
      'Der Hund läuft schnell.',
      'Das Wasser ist kalt.',
    ];

    for (const sentence of sentences) {
      const result = await engine.analyzeGrammar(sentence);
      expect(result.sentence).toBe(sentence);
      console.log(`  ✓ "${sentence}" → ${result.summary.totalPoints} points`);
    }

    console.log('✓ All sentences analyzed with single spaCy instance');
  }, 25000);

  afterAll(() => {
    console.log('✓ Test suite completed, spaCy service will be shut down by globalTeardown\n');
  });
});
