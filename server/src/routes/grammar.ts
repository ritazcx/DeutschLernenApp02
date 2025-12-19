import express from 'express';
import { getNLPEngine } from '../services/nlpEngine/singleton';
import { splitIntoSentences } from '../utils/sentenceSplitter';
import { createValidationError, ErrorCode, AppError } from '../utils/errors';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get singleton NLP engine instance
const nlpEngine = getNLPEngine();

/**
 * GET /categories
 * GET /categories
 * Get available grammar categories
 */
router.get('/categories', (req, res) => {
  const categories = [
    'tense',
    'case',
    'mood',
    'voice',
    'verb_form',
    'preposition',
    'conjunction',
    'agreement',
    'word_order',
    'article',
    'pronoun',
    'adjective',
    'noun',
    'separable_verb',
    'modal-verb',
    'collocation',
    'special_construction',
  ];

  res.json({
    categories,
    count: categories.length,
  });
});

/**
 * GET /levels
 * Get available CEFR levels
 */
router.get('/levels', (req, res) => {
  const levels = [
    'A1',
    'A2', 
    'B1',
    'B2',
    'C1',
    'C2'
  ];

  res.json({
    levels,
    count: levels.length,
  });
});

/**
 * POST /analyze-detection
 * Analyze text using the new rule-based grammar detection engine
 * Splits text into sentences and analyzes each one individually
 */
router.post('/analyze-detection', asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    throw createValidationError('Text is required and must be a string');
  }

  // More robust sentence splitting that handles dates and abbreviations
  const sentences = splitIntoSentences(text);

  const sentenceAnalyses = await Promise.all(
    sentences.map(async (sentenceText: string, index: number) => {
      try {
        const result = await nlpEngine.analyzeGrammar(sentenceText.trim());
        return {
          sentence: sentenceText.trim(),
          grammarPoints: result.grammarPoints,
          byLevel: result.byLevel,
          byCategory: result.byCategory,
          summary: result.summary,
          sentenceIndex: index
        };
      } catch (error) {
        // Log warning but continue with empty result for this sentence
        console.warn(`Failed to analyze sentence ${index}:`, error);
        return {
          sentence: sentenceText.trim(),
          grammarPoints: [],
          byLevel: { A1: [], A2: [], B1: [], B2: [], C1: [], C2: [] },
          byCategory: {},
          summary: { totalPoints: 0, levels: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 }, categories: {} },
          sentenceIndex: index
        };
      }
    })
  );

  // Combine all results
  const totalPoints = sentenceAnalyses.reduce((sum: number, analysis) => sum + analysis.summary.totalPoints, 0);
  const allLevels = sentenceAnalyses.reduce((acc: Record<string, number>, analysis) => {
    Object.entries(analysis.summary.levels).forEach(([level, count]) => {
      acc[level] = (acc[level] || 0) + count;
    });
    return acc;
  }, {} as Record<string, number>);

  res.json({
    success: true,
    sentences: sentenceAnalyses,
    summary: {
      totalSentences: sentences.length,
      totalPoints,
      levels: allLevels
    }
  });
}));

/**
 * GET /validate
 * Validate that grammar analysis is working with a simple test sentence
 */
router.get('/validate', asyncHandler(async (req, res) => {
  // Test with a simple sentence that should detect basic grammar
  const testText = 'Ich kann das machen.';
  const result = await nlpEngine.analyzeGrammar(testText);

  // Check if we got some basic analysis
  const hasAnalysis = result.summary.totalPoints > 0;
  const hasModalVerb = result.byCategory['modal-verb']?.length > 0;

  res.json({
    success: true,
    valid: hasAnalysis,
    testSentence: testText,
    detectedPoints: result.summary.totalPoints,
    hasModalVerb,
    message: hasAnalysis ? 'Grammar analysis is working' : 'Grammar analysis returned no results (may be expected for simple sentences)',
  });
}));

export default router;
