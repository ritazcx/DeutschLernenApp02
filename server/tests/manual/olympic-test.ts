/**
 * Olympic Games Test - Verification
 * 使用原始的 Olympic Games 文本验证完整的语法检测系统
 */

import { NLPEngine } from '../../src/services/nlpEngine';

async function testOlympicGamesText() {
  const nlpEngine = new NLPEngine();

  // 原始的 Olympic Games 文本
  const text = 'Alle 203 Nationalen Olympischen Komitees wurden eingeladen.';

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           Olympic Games Text - Grammar Detection Test          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`📝 Text: "${text}"\n`);

  try {
    console.log('⏳ Analyzing sentence with NLPEngine...');
    const result = await nlpEngine.analyzeGrammar(text);

    console.log('✓ Analysis complete!\n');

    console.log('📊 Results:');
    console.log(`  • Total grammar points: ${result.summary.totalPoints}`);
    console.log(`  • Levels distribution:`);
    Object.entries(result.summary.levels).forEach(([level, count]: [string, any]) => {
      console.log(`    - ${level}: ${count}`);
    });

    console.log(`\n  • Categories detected:`);
    Object.entries(result.summary.categories).forEach(([category, count]: [string, any]) => {
      console.log(`    - ${category}: ${count}`);
    });

    console.log(`\n📋 Grammar Points:`);
    if (result.grammarPoints.length === 0) {
      console.log('  (No grammar points detected)');
    } else {
      result.grammarPoints.slice(0, 10).forEach((point: any, i: number) => {
        console.log(`  ${i + 1}. [${point.grammarPoint.level}] ${point.grammarPoint.category}`);
        console.log(`     ${point.explanation}`);
      });
      if (result.grammarPoints.length > 10) {
        console.log(`  ... and ${result.grammarPoints.length - 10} more`);
      }
    }

    console.log('\n✅ Test completed successfully!\n');

    return {
      success: true,
      text,
      totalPoints: result.summary.totalPoints,
      levels: result.summary.levels,
      categories: result.summary.categories,
    };
  } catch (error) {
    console.error('\n❌ Error during analysis:', error);
    return {
      success: false,
      text,
      error: String(error),
    };
  }
}

// Run test
testOlympicGamesText().then((result) => {
  if (result.success) {
    console.log('Test result: SUCCESS');
    process.exit(0);
  } else {
    console.log('Test result: FAILED');
    process.exit(1);
  }
});
