/**
 * Morphological Analysis Utilities
 * Helper functions for analyzing SpaCy morphological output
 */

import { Token } from '../../src/services/nlpEngine/types';

export interface MorphologicalCompleteness {
  totalTokens: number;
  tokensWithMorph: number;
  completenessPercentage: number;
  missingFeatures: string[];
  featureCoverage: Record<string, { present: number; total: number; percentage: number }>;
}

/**
 * Analyze completeness of morphological features across tokens
 */
export function analyzeMorphologicalCompleteness(tokens: Token[]): MorphologicalCompleteness {
  const totalTokens = tokens.length;
  let tokensWithMorph = 0;
  const allFeatures = new Set<string>();
  const presentFeatures = new Map<string, number>();

  tokens.forEach(token => {
    if (token.morph && Object.keys(token.morph).length > 0) {
      tokensWithMorph++;

      // Count present features
      Object.keys(token.morph).forEach(feature => {
        presentFeatures.set(feature, (presentFeatures.get(feature) || 0) + 1);
      });
    }

    // Track what features we expect for this POS
    const expectedFeatures = getExpectedFeaturesForPOS(token.pos);
    expectedFeatures.forEach(feature => allFeatures.add(feature));
  });

  const completenessPercentage = totalTokens > 0 ? (tokensWithMorph / totalTokens) * 100 : 0;
  const missingFeatures = Array.from(allFeatures).filter(f => !presentFeatures.has(f));

  // Calculate feature coverage
  const featureCoverage: Record<string, { present: number; total: number; percentage: number }> = {};
  allFeatures.forEach(feature => {
    const present = presentFeatures.get(feature) || 0;
    const total = tokens.filter(t => getExpectedFeaturesForPOS(t.pos).includes(feature)).length;
    featureCoverage[feature] = {
      present,
      total,
      percentage: total > 0 ? (present / total) * 100 : 0
    };
  });

  return {
    totalTokens,
    tokensWithMorph,
    completenessPercentage,
    missingFeatures,
    featureCoverage
  };
}

/**
 * Get expected morphological features for a POS tag
 */
export function getExpectedFeaturesForPOS(pos: string): string[] {
  const featureMap: Record<string, string[]> = {
    'VERB': ['Tense', 'Mood', 'Person', 'Number', 'VerbForm'],
    'AUX': ['Tense', 'Mood', 'Person', 'Number', 'VerbForm'],
    'NOUN': ['Case', 'Gender', 'Number'],
    'ADJ': ['Case', 'Gender', 'Number', 'Degree'],
    'DET': ['Case', 'Gender', 'Number', 'PronType'],
    'PRON': ['Case', 'Gender', 'Number', 'PronType'],
    'ADP': [], // Prepositions typically have no morphological features
    'ADV': ['Degree'],
    'PART': [],
    'CCONJ': [],
    'SCONJ': [],
    'PUNCT': [],
    'PROPN': ['Case', 'Gender', 'Number'], // Proper nouns can have case
    'NUM': ['NumType'],
    'X': [] // Unknown tokens
  };

  return featureMap[pos] || [];
}

/**
 * Analyze grammar detection results
 */
export function analyzeGrammarDetectionResults(grammarPoints: any[], expectedCategories: string[]) {
  const pointsByCategory = grammarPoints.reduce((acc, point) => {
    const category = point.grammarPoint?.category || 'unknown';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const foundCategories = Object.keys(pointsByCategory);
  const missingCategories = expectedCategories.filter(cat => !foundCategories.includes(cat));

  return {
    totalPoints: grammarPoints.length,
    pointsByCategory,
    foundCategories,
    missingCategories,
    coveragePercentage: (expectedCategories.length - missingCategories.length) / expectedCategories.length * 100
  };
}

/**
 * Print morphological analysis report
 */
export function printMorphologicalReport(sentence: string, tokens: Token[], grammarPoints: any[]) {
  console.log('='.repeat(80));
  console.log('MORPHOLOGICAL ANALYSIS REPORT');
  console.log('='.repeat(80));
  console.log('Sentence:', sentence);
  console.log('');

  const morphAnalysis = analyzeMorphologicalCompleteness(tokens);
  console.log('MORPHOLOGICAL COMPLETENESS:');
  console.log(`- Total tokens: ${morphAnalysis.totalTokens}`);
  console.log(`- Tokens with morph features: ${morphAnalysis.tokensWithMorph} (${morphAnalysis.completenessPercentage.toFixed(1)}%)`);
  console.log(`- Missing features: ${morphAnalysis.missingFeatures.join(', ') || 'none'}`);
  console.log('');

  console.log('FEATURE COVERAGE:');
  Object.entries(morphAnalysis.featureCoverage).forEach(([feature, stats]) => {
    console.log(`- ${feature}: ${stats.present}/${stats.total} (${stats.percentage.toFixed(1)}%)`);
  });
  console.log('');

  const grammarAnalysis = analyzeGrammarDetectionResults(grammarPoints, ['tense', 'case', 'preposition', 'agreement']);
  console.log('GRAMMAR DETECTION RESULTS:');
  console.log(`- Total grammar points: ${grammarAnalysis.totalPoints}`);
  console.log(`- Points by category:`, grammarAnalysis.pointsByCategory);
  console.log(`- Expected categories: ${grammarAnalysis.foundCategories.length}/${['tense', 'case', 'preposition', 'agreement'].length}`);
  console.log(`- Missing categories: ${grammarAnalysis.missingCategories.join(', ') || 'none'}`);
  console.log(`- Coverage: ${grammarAnalysis.coveragePercentage.toFixed(1)}%`);
  console.log('');

  console.log('TOKEN DETAILS:');
  tokens.forEach((token, i) => {
    const morphStr = token.morph && Object.keys(token.morph).length > 0
      ? JSON.stringify(token.morph)
      : 'no morph features';
    console.log(`${i.toString().padStart(2)}: "${token.word}" (${token.pos}) - ${morphStr}`);
  });

  console.log('='.repeat(80));
}

/**
 * DEMONSTRATE THE CORE ISSUE: Mock vs Real Data
 */
export function demonstrateMockVsRealIssue() {
  console.log('='.repeat(80));
  console.log('DEMONSTRATING THE CORE TEST SUITE ISSUE');
  console.log('='.repeat(80));

  // Mock data (what current tests use)
  const mockTokens: Token[] = [
    { id: 0, word: 'erklärte', lemma: 'erklären', pos: 'VERB', morph: { tense: 'past', mood: 'indicative' }, position: { start: 0, end: 8 } },
    { id: 1, word: 'offiziellen', lemma: 'offiziell', pos: 'ADJ', morph: { case: 'dative', gender: 'masculine', number: 'plural' }, position: { start: 9, end: 20 } },
  ];

  console.log('MOCK DATA (current tests - always passes):');
  console.log('Tokens:', mockTokens.map(t => `${t.word}(${JSON.stringify(t.morph)})`).join(', '));

  // Simulate detector logic with mock data
  const mockTenseResults = mockTokens.filter(t => t.pos === 'VERB' && t.morph?.tense === 'past');
  const mockCaseResults = mockTokens.filter(t => ['NOUN', 'ADJ'].includes(t.pos) && t.morph?.case);

  console.log('Mock tense detections:', mockTenseResults.length);
  console.log('Mock case detections:', mockCaseResults.length);
  console.log('Mock total detections: PASS ✓');
  console.log('');

  // Real data scenario (what actually happens)
  const realTokens: Token[] = [
    { id: 0, word: 'erklärte', lemma: 'erklären', pos: 'VERB', morph: {}, position: { start: 0, end: 8 } }, // SpaCy fails to extract tense
    { id: 1, word: 'offiziellen', lemma: 'offiziell', pos: 'ADJ', morph: {}, position: { start: 9, end: 20 } }, // SpaCy fails to extract case
  ];

  console.log('REAL DATA (production - fails silently):');
  console.log('Tokens:', realTokens.map(t => `${t.word}(${JSON.stringify(t.morph)})`).join(', '));

  // Simulate detector logic with real data
  const realTenseResults = realTokens.filter(t => t.pos === 'VERB' && t.morph?.tense === 'past');
  const realCaseResults = realTokens.filter(t => ['NOUN', 'ADJ'].includes(t.pos) && t.morph?.case);

  console.log('Real tense detections:', realTenseResults.length, '(should be 1)');
  console.log('Real case detections:', realCaseResults.length, '(should be 1)');
  console.log('Real total detections: FAIL ✗');
  console.log('');

  console.log('CONCLUSION:');
  console.log('- Mock tests pass because they use perfect fabricated data');
  console.log('- Real morphological analysis fails, causing detectors to return no results');
  console.log('- Test suite never catches this because it doesn\'t test the actual SpaCy pipeline');
  console.log('='.repeat(80));
}