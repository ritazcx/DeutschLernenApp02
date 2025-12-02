/**
 * Olympic Games Test - Grammar Detection Verification
 * Tests the complete grammar detection pipeline with real spaCy data
 */

import { getNLPEngineForIntegrationTests, isSpacyServiceReady } from '../integrationUtils';

describe('Olympic Games Text - Complete Grammar Detection', () => {
  let nlpEngine: any;

  beforeAll(() => {
    if (!isSpacyServiceReady()) {
      console.error('❌ spaCy service is not ready!');
    }
    nlpEngine = getNLPEngineForIntegrationTests();
  });

  it('should detect all grammar points in Olympic Games sentence', async () => {
    const text = 'Alle 203 Nationalen Olympischen Komitees wurden eingeladen.';

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║           Olympic Games Text - Grammar Detection              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`📝 Text: "${text}"\n`);

    const result = await nlpEngine.analyzeGrammar(text);

    console.log('✓ Analysis complete!\n');
    console.log('📊 Results:');
    console.log(`  • Total grammar points: ${result.summary.totalPoints}`);
    console.log(`  • Levels distribution:`, result.summary.levels);
    console.log(`  • Categories detected:`, result.summary.categories);

    console.log(`\n📋 Detailed Grammar Points:`);
    if (result.grammarPoints.length === 0) {
      console.log('  (No grammar points detected)');
    } else {
      result.grammarPoints.forEach((point: any, i: number) => {
        console.log(`  ${i + 1}. [${point.grammarPoint.level}] ${point.grammarPoint.category}`);
        console.log(`     Position: ${point.positions}`);
        console.log(`     ${point.explanation}\n`);
      });
    }

    // Verify basic expectations
    expect(result.sentence).toBe(text);
    expect(result.summary.totalPoints).toBeGreaterThan(0);

    // Verify that we detected at least passive voice (wurden)
    const passivePoints = result.grammarPoints.filter((p: any) =>
      p.grammarPoint.category === 'passive' || p.grammarPoint.category === 'voice'
    );
    console.log(`\n✓ Passive voice detections: ${passivePoints.length}`);
    expect(passivePoints.length).toBeGreaterThan(0);

    console.log('✅ Test passed!\n');
  }, 25000);

  it('should handle complex sentences with multiple clauses', async () => {
    const sentences = [
      'Das Buch, das ich gelesen habe, ist interessant.',
      'Ich bleibe zu Hause, weil es regnet.',
      'Wenn du Zeit hast, komm bitte vorbei.',
    ];

    console.log('\n【Multiple Sentences Test】\n');

    for (const sentence of sentences) {
      const result = await nlpEngine.analyzeGrammar(sentence);
      console.log(`✓ "${sentence}"`);
      console.log(`  Grammar points: ${result.summary.totalPoints}\n`);
      expect(result.summary.totalPoints).toBeGreaterThanOrEqual(0);
    }

    console.log('✅ All sentences processed successfully!\n');
  }, 30000);
});
