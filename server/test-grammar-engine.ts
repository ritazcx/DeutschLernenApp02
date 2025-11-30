/**
 * Test B1 Grammar Rules Engine
 * Verifies rule detection with sample B1-level sentences
 */

import { NLPEngine } from './src/services/nlpEngine';
import { GrammarRulesEngine } from './src/services/grammarEngine';

async function runTests() {
  const nlpEngine = new NLPEngine();
  const grammarEngine = new GrammarRulesEngine('B1');

  // Sample B1-level sentences with various grammar features
  const testSentences = [
    // Present tense
    'Ich gehe zur Schule.',
    // Past tense
    'Ich ging zur Schule.',
    // Perfect tense
    'Ich bin zur Schule gegangen.',
    // Modal verb
    'Ich kann Deutsch sprechen.',
    'Ich möchte einen Kaffee trinken.',
    // Cases (nominative, accusative, dative)
    'Der Mann sieht die Frau.',
    'Ich gebe dem Kind ein Buch.',
    // Prepositions with cases
    'Ich fahre mit meinem Freund nach Berlin.',
    'Das Buch liegt auf dem Tisch.',
    // Subordinate clause (verb-final)
    'Ich weiß, dass er morgen kommt.',
    'Weil es regnet, bleibe ich zu Hause.',
    // Question word
    'Wann kommst du nach Hause?',
    'Was möchtest du essen?',
    // Adjective agreement
    'Das ist ein großer Hund.',
    // Article with noun
    'Der Tisch ist braun.',
  ];

  console.log('B1 Grammar Rules Engine Test\n');
  console.log('=' .repeat(60));

  for (const sentence of testSentences) {
    console.log(`\nAnalyzing: "${sentence}"`);
    console.log('-'.repeat(60));

    try {
      const parsed = await nlpEngine.parseSentence(sentence);
      const result = grammarEngine.analyze(parsed, 'B1');

      console.log(`Grammar Points Found: ${result.grammarPoints.length}`);

      if (result.grammarPoints.length > 0) {
        for (const point of result.grammarPoints) {
          console.log(`  • ${point.category.toUpperCase()}: "${point.text}"`);
          console.log(`    └─ ${point.explanation}`);
        }
      } else {
        console.log('  (No grammar points detected)');
      }

      console.log(`\nCategories detected:`, result.summary.byCategory);
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test completed!\n');
}

// Run tests
runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
