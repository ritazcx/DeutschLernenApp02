/**
 * Test script for AI Grammar Detector
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { AIGrammarDetector } from './src/services/grammarEngine/detectors/aiGrammarDetector';
import { SentenceData } from './src/services/grammarEngine/detectors/baseDetector';

async function testAIDetector() {
  const detector = new AIGrammarDetector();

  // Test sentence with complex grammar
  const sentenceData: SentenceData = {
    text: "Ich habe gestern ein interessantes Buch über die Geschichte Deutschlands gelesen.",
    tokens: [
      {
        text: "Ich",
        lemma: "ich",
        pos: "PRON",
        tag: "PRON",
        dep: "ROOT",
        index: 0,
        characterStart: 0,
        characterEnd: 3,
      },
      // Simplified tokens for testing
      {
        text: "habe",
        lemma: "haben",
        pos: "AUX",
        tag: "AUX",
        dep: "ROOT",
        index: 1,
        characterStart: 4,
        characterEnd: 8,
      },
      // Add more tokens as needed...
    ]
  };

  console.log('Testing AI Grammar Detector...');
  console.log('Sentence:', sentenceData.text);

  try {
    const results = await detector.detectAsync(sentenceData);
    console.log('AI Detection Results:', results.length);
    results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.grammarPoint.category}: ${result.grammarPoint.name} (confidence: ${result.confidence})`);
      console.log(`   Details:`, result.details);
    });
  } catch (error) {
    console.error('AI Detection failed:', error);
  }
}

testAIDetector();