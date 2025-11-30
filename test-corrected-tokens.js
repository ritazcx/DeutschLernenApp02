import { PassiveVoiceDetector } from './server/dist/services/grammarEngine/detectors/passiveVoiceDetector.js';
import { B1_GRAMMAR } from './server/dist/services/grammarEngine/cefr-taxonomy.js';

// Test with corrected tokens
function testCorrectTokens() {
  console.log('🔍 Testing passive detector with corrected tokens...\n');

  console.log('B1_GRAMMAR available:', !!B1_GRAMMAR);
  console.log('passive-voice-present exists:', !!B1_GRAMMAR['passive-voice-present']);
  if (B1_GRAMMAR['passive-voice-present']) {
    console.log('Grammar point:', B1_GRAMMAR['passive-voice-present'].name);
  }

  const detector = new PassiveVoiceDetector();

  // Corrected tokens based on what spaCy should produce
  const sentenceData = {
    text: 'Das Haus wird von meinem Vater gebaut.',
    tokens: [
      { text: 'Das', lemma: 'der', pos: 'DET', tag: 'DET', dep: 'ROOT', morph: {}, index: 0, characterStart: 0, characterEnd: 3 },
      { text: 'Haus', lemma: 'Haus', pos: 'NOUN', tag: 'NOUN', dep: 'ROOT', morph: { Case: 'Nom', Number: 'Sing' }, index: 1, characterStart: 4, characterEnd: 8 },
      { text: 'wird', lemma: 'werden', pos: 'AUX', tag: 'AUX', dep: 'ROOT', morph: { Mood: 'Ind', Tense: 'Pres', VerbForm: 'Fin' }, index: 2, characterStart: 9, characterEnd: 13 },
      { text: 'von', lemma: 'von', pos: 'ADP', tag: 'ADP', dep: 'ROOT', morph: {}, index: 3, characterStart: 14, characterEnd: 17 },
      { text: 'meinem', lemma: 'mein', pos: 'DET', tag: 'DET', dep: 'ROOT', morph: { Case: 'Dat', Number: 'Sing', Person: '1' }, index: 4, characterStart: 18, characterEnd: 24 },
      { text: 'Vater', lemma: 'Vater', pos: 'NOUN', tag: 'NOUN', dep: 'ROOT', morph: { Case: 'Dat', Number: 'Sing' }, index: 5, characterStart: 25, characterEnd: 30 },
      { text: 'gebaut', lemma: 'bauen', pos: 'VERB', tag: 'VERB', dep: 'ROOT', morph: { VerbForm: 'Part', Tense: 'Past' }, index: 6, characterStart: 31, characterEnd: 37 },
      { text: '.', lemma: '.', pos: 'PUNCT', tag: 'PUNCT', dep: 'ROOT', morph: {}, index: 7, characterStart: 37, characterEnd: 38 }
    ]
  };

  console.log('Testing sentence:', sentenceData.text);
  console.log('Tokens:');
  sentenceData.tokens.forEach((token, i) => {
    console.log(`  ${i}: "${token.text}" (${token.pos}) lemma:"${token.lemma}" morph:${JSON.stringify(token.morph)}`);
  });
  console.log('');

  try {
    console.log('About to call detector.detect()...');
    const results = detector.detect(sentenceData);
    console.log('Raw results from detector:', results);

    console.log('📊 Detection results:');
    if (results.length === 0) {
      console.log('❌ No passive voice detected');
    } else {
      results.forEach((result, i) => {
        console.log(`Result ${i+1}:`, JSON.stringify(result, null, 2));
        console.log(`${i + 1}. ${result.grammarPoint?.name || 'undefined'} (${result.grammarPoint?.level || 'undefined'}): ${result.grammarPoint?.description || 'undefined'}`);
        console.log(`   Confidence: ${result.confidence}`);
        console.log(`   Position: ${result.position.start}-${result.position.end}`);
        if (result.details) {
          console.log(`   Details: ${JSON.stringify(result.details)}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testCorrectTokens();