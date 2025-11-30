/**
 * Test Grammar Detection Engine
 * Tests the new rule-based detectors for comprehensive CEFR coverage
 */

import { NLPEngine } from './src/services/nlpEngine';

async function runDetectionTests() {
  const nlpEngine = new NLPEngine();

  // Test sentences covering A1-C2 grammar points
  const testSentences = [
    // A1: Basic present tense
    'Ich bin Student.',

    // A2: Dative prepositions
    'Ich gehe mit meinem Freund ins Kino.',

    // A2: Accusative prepositions
    'Das Auto fährt durch die Stadt.',

    // A2: Reflexive verbs
    'Ich wasche mich jeden Morgen.',

    // A2: Simple past
    'Gestern ging ich einkaufen.',

    // A2: Present perfect
    'Ich habe das Buch gelesen.',

    // B1: Subordinate clauses
    'Ich bleibe zu Hause, weil es regnet.',

    // B1: Passive voice
    'Das Buch wird gelesen.',

    // B1: Modal verbs
    'Ich muss arbeiten.',

    // B1: Separable verbs
    'Ich stehe um 7 Uhr auf.',

    // B1: Relative clauses
    'Der Mann, der dort steht, ist mein Bruder.',

    // B1: Konjunktiv II
    'Ich würde gerne kommen.',

    // B2: Passive with agent
    'Das Buch wurde von dem Autor geschrieben.',

    // B2: Statal passive
    'Die Tür ist geschlossen.',

    // B2: Conditional sentences
    'Wenn ich Zeit hätte, würde ich kommen.',

    // B2: Infinitive clauses
    'Ich lerne Deutsch, um in Deutschland zu arbeiten.',

    // B2: Extended adjectives
    'Der von dem Künstler gemalte Tisch steht im Zimmer.',
  ];

  console.log('Grammar Detection Engine Test\n');
  console.log('=' .repeat(80));

  for (const sentence of testSentences) {
    console.log(`\nAnalyzing: "${sentence}"`);
    console.log('-'.repeat(80));

    try {
      const result = await nlpEngine.analyzeGrammar(sentence);

      console.log(`Grammar Points Found: ${result.summary.totalPoints}`);
      console.log(`By Level: ${JSON.stringify(result.summary.levels)}`);

      if (result.grammarPoints.length > 0) {
        for (const point of result.grammarPoints) {
          console.log(`  • ${point.grammarPoint.level} ${point.grammarPoint.category.toUpperCase()}: "${result.sentence.substring(point.position.start, point.position.end)}"`);
          console.log(`    └─ ${point.grammarPoint.name}`);
        }
      } else {
        console.log('  (No grammar points detected)');
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Detection Engine Test completed!\n');
}

// Run tests
runDetectionTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});