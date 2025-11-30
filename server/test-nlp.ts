#!/usr/bin/env npx ts-node

/**
 * NLP Engine Test Script
 * 快速测试NLP引擎的功能
 */

import { NLPEngine } from './src/services/nlpEngine';
import { VocabularyExtractor } from './src/services/vocabularyExtractor';

async function main() {
  console.log('🚀 Starting NLP Engine tests...\n');

  const dbPath = '/Users/chenxuanzhang/Documents/my-AI-projects/DeutschLernenApp02/server/data/dictionary.db';
  const nlpEngine = new NLPEngine(dbPath);
  const vocabExtractor = new VocabularyExtractor(dbPath);

  // 测试文本
  const testSentence = 'Gestern bin ich ins Kino gegangen.';
  const testText = `
    Ich lebe in Berlin. Das ist eine große Stadt in Deutschland.
    Ich lerne Deutsch, weil es eine schwere Sprache ist.
    Mein Lehrer hat mir viele neue Wörter beigebracht.
  `;

  try {
    // 测试1: 单句解析
    console.log('Test 1: Parse single sentence');
    console.log(`Input: "${testSentence}"`);
    const parsedSentence = nlpEngine.parseSentence(testSentence);
    console.log(`Parsed ${parsedSentence.tokens.length} tokens`);
    console.log(`Level: ${parsedSentence.estimatedLevel}`);
    console.log(`Has passive: ${parsedSentence.hasPassive}`);
    console.log(`Tokens:`, parsedSentence.tokens.map(t => `${t.word}(${t.lemma}/${t.pos})`).join(', '));
    console.log('✅ Pass\n');

    // 测试2: 文章解析
    console.log('Test 2: Parse multiple sentences');
    const parsedText = nlpEngine.parseText(testText);
    console.log(`Parsed ${parsedText.length} sentences`);
    parsedText.forEach((sent, idx) => {
      console.log(`  Sentence ${idx + 1}: ${sent.tokens.length} tokens, level ${sent.estimatedLevel}`);
    });
    console.log('✅ Pass\n');

    // 测试3: 生词本提取
    console.log('Test 3: Extract vocabulary');
    const vocabulary = vocabExtractor.extract(testText);
    console.log(`Extracted ${vocabulary.length} unique words`);
    console.log('Top 10 words:');
    vocabulary.slice(0, 10).forEach((word, idx) => {
      console.log(`  ${idx + 1}. ${word.lemma} (${word.pos}) - Level: ${word.level}, Freq: ${word.frequency}`);
    });
    console.log('✅ Pass\n');

    // 测试4: 按难度提取
    console.log('Test 4: Extract by level');
    const b1Words = vocabExtractor.extractByLevel(testText, 'B1');
    const b2Words = vocabExtractor.extractByLevel(testText, 'B2');
    console.log(`B1 words: ${b1Words.length}`);
    console.log(`B2 words: ${b2Words.length}`);
    console.log('✅ Pass\n');

    // 测试5: CSV导出
    console.log('Test 5: Export to CSV');
    const csv = vocabExtractor.exportToCSV(vocabulary.slice(0, 5));
    console.log('Sample CSV output:');
    console.log(csv.split('\n').slice(0, 3).join('\n'));
    console.log('✅ Pass\n');

    console.log('✨ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    nlpEngine.close();
    vocabExtractor.close();
  }
}

main();
