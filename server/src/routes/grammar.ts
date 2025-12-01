import express from 'express';
import { NLPEngine } from '../services/nlpEngine';

const router = express.Router();

// Initialize NLP engine
const nlpEngine = new NLPEngine();

/**
 * GET /api/grammar/categories
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
    'modal_verb',
    'collocation',
    'special_construction',
  ];

  res.json({
    categories,
    count: categories.length,
  });
});

/**
 * POST /api/grammar/analyze-detection
 * Analyze text using the new rule-based grammar detection engine
 */
router.post('/api/grammar/analyze-detection', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    console.log('Analyzing text with detection engine:', text.substring(0, 100) + '...');

    // Use the NLPEngine's analyzeGrammar method (rule-based with minimal AI fallback)
    const result = await nlpEngine.analyzeGrammar(text);

    console.log(`Found ${result.summary.totalPoints} grammar points across ${Object.values(result.summary.levels).reduce((a, b) => a + b, 0)} levels`);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Grammar detection analysis error:', error);
    res.status(500).json({ error: 'Grammar detection analysis failed', details: (error as Error).message });
  }
});

/**
 * GET /api/grammar/levels
 * Get available CEFR levels
 */
router.get('/levels', (req, res) => {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  res.json({
    levels,
    count: levels.length,
  });
});

export default router;
