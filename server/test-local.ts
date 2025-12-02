/**
 * Local Testing Script
 * 
 * 验证 A1/A2 语法检测改进
 * 运行: npx ts-node test-local.ts
 */

import { SpacyService } from './src/services/nlpEngine/spacyService';
import { grammarDetectionEngine } from './src/services/grammarEngine/detectionEngine';
import { NLPEngine } from './src/services/nlpEngine';

const testSentences = {
  // A1 Level - 现在时
  a1_present: [
    'Ich bin ein Student.',
    'Du lernst Deutsch.',
    'Er geht nach Hause.',
    'Wir essen Apfel.',
    'Sie trinken Wasser.',
  ],
  
  // A2 Level - 过去时
  a2_past: [
    'Ich war im Park.',
    'Er lief schnell.',
    'Wir aßen Brot.',
    'Sie tranken Kaffee.',
    'Ich kaufte ein Buch.',
  ],
  
  // B1 Level - 复杂句式
  b1_complex: [
    'Das Buch, das ich gelesen habe, ist interessant.',
    'Wenn du kommst, helfe ich dir.',
    'Der Mann, der im Garten sitzt, ist alt.',
  ],
  
  // Olympic Example (测试真实场景)
  real_world: [
    'Auf dieser Basis erklärte das Executive Board des IOC am 4. Juni 2008 die Städte Chicago, Tokio, Rio de Janeiro und Madrid zu offiziellen Kandidaten.',
  ],
};

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 LOCAL TESTING - Grammar Detection Improvements');
  console.log('='.repeat(80) + '\n');

  const spacyService = new SpacyService();
  const nlpEngine = new NLPEngine();

  try {
    // Test each category
    for (const [category, sentences] of Object.entries(testSentences)) {
      console.log(`\n📌 ${category.toUpperCase()}`);
      console.log('-'.repeat(80));

      for (const sentence of sentences) {
        console.log(`\nSentence: "${sentence}"`);
        
        try {
          // Analyze with spaCy
          const spacyResult = await spacyService.analyzeSentence(sentence);
          
          if (spacyResult.success && spacyResult.tokens) {
            // Convert to SentenceData
            const sentenceData = {
              text: sentence,
              tokens: spacyResult.tokens.map((t, idx) => ({
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

            // Analyze for grammar points
            const result = await grammarDetectionEngine.analyzeWithMinimalAIFallback(sentenceData);
            
            // Summary
            const pointsByLevel = {
              A1: result.grammarPoints.filter((p: any) => p.grammarPoint?.level === 'A1').length,
              A2: result.grammarPoints.filter((p: any) => p.grammarPoint?.level === 'A2').length,
              B1: result.grammarPoints.filter((p: any) => p.grammarPoint?.level === 'B1').length,
              B2: result.grammarPoints.filter((p: any) => p.grammarPoint?.level === 'B2').length,
              C1: result.grammarPoints.filter((p: any) => p.grammarPoint?.level === 'C1').length,
            };

            const pointsByCategory = result.grammarPoints.reduce((acc: any, p: any) => {
              const cat = p.grammarPoint?.category || 'unknown';
              acc[cat] = (acc[cat] || 0) + 1;
              return acc;
            }, {});

            console.log(`  ✅ Tokens: ${sentenceData.tokens.length}`);
            console.log(`  📊 Grammar Points: ${result.grammarPoints.length}`);
            console.log(`     By Level: A1=${pointsByLevel.A1}, A2=${pointsByLevel.A2}, B1=${pointsByLevel.B1}, B2=${pointsByLevel.B2}, C1=${pointsByLevel.C1}`);
            console.log(`     By Category: ${JSON.stringify(pointsByCategory)}`);
            
            // Show detected points
            if (result.grammarPoints.length > 0) {
              console.log(`  📝 Details:`);
              result.grammarPoints.forEach((p: any, i: number) => {
                console.log(`     ${i + 1}. ${p.grammarPoint?.name} (${p.grammarPoint?.level}) - ${p.grammarPoint?.category}`);
                console.log(`        Confidence: ${(p.confidence * 100).toFixed(0)}%`);
              });
            }
          } else {
            console.log(`  ❌ spaCy analysis failed`);
          }
        } catch (error) {
          console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Local Testing Complete');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    spacyService.close();
  }
}

// Run tests
runTests().catch(console.error);
