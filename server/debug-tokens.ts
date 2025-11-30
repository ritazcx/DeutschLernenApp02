/**
 * Debug Token Morphology
 */

import { NLPEngine } from './src/services/nlpEngine';

async function debugTokens() {
  const nlpEngine = new NLPEngine();
  const result = await nlpEngine.parseSentence('Ich gehe zur Schule.');

  console.log('Tokens:');
  result.tokens.forEach((t, i) => {
    console.log(`[${i}] "${t.word}" (pos: ${t.pos}, lemma: ${t.lemma})`);
    console.log(`    morph: ${JSON.stringify(t.morph)}`);
  });
}

debugTokens().catch(err => console.error(err));
