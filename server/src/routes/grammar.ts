import express from 'express';
import { getNLPEngine } from '../services/nlpEngine/singleton';
import { grammarDetectionEngine } from '../services/grammarEngine/detectionEngine';
import { splitIntoSentences } from '../utils/sentenceSplitter';

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
router.post('/analyze-detection', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    // More robust sentence splitting that handles dates and abbreviations
    const sentences = splitIntoSentences(text);

    // If debug=collocation, attach detailed collocation matching trace for each sentence
    const debugCollocation = req.query.debug === 'collocation';

    const sentenceAnalyses = await Promise.all(
      sentences.map(async (sentenceText: string, index: number) => {
        try {
          if (!debugCollocation) {
            const result = await nlpEngine.analyzeGrammar(sentenceText.trim());
            return {
              sentence: sentenceText.trim(),
              grammarPoints: result.grammarPoints,
              byLevel: result.byLevel,
              byCategory: result.byCategory,
              summary: result.summary,
              sentenceIndex: index
            };
          }

          // Debug flow: parse sentence, run rule-based analysis, then call collocation detector debugAnalyze
          const parsed = await nlpEngine.parseSentence(sentenceText.trim());

          const sentenceData = {
            text: sentenceText.trim(),
            tokens: parsed.tokens.map((token: any) => ({
              text: token.word,
              lemma: token.lemma,
              pos: token.pos,
              tag: token.tag || token.pos,
              dep: token.dep || 'ROOT',
              head: token.head,
              morph: token.morph,
              index: token.id,
              characterStart: token.position?.start || 0,
              characterEnd: token.position?.end || 0,

              entity_type: (token as any).entity_type,
              entity_id: (token as any).entity_id,
              is_entity_start: (token as any).is_entity_start,
              is_entity_end: (token as any).is_entity_end,
              entity_text: (token as any).entity_text,
            })),
            entities: parsed.entities || []
          };

          const analysis = await grammarDetectionEngine.analyzeWithMinimalAIFallback(sentenceData as any);

          // Find collocation detector and call debugAnalyze if available
          const collocationDetector = grammarDetectionEngine.getDetectors().find(d => d.constructor.name === 'CollocationDetector') as any;
          let collocationDebug = null;
          if (collocationDetector && typeof collocationDetector.debugAnalyze === 'function') {
            try {
              collocationDebug = collocationDetector.debugAnalyze(sentenceData as any);
            } catch (dbgErr) {
              console.warn('Collocation debugAnalyze threw an error:', dbgErr);
              collocationDebug = { error: String(dbgErr) };
            }
          }

          return {
            sentence: sentenceText.trim(),
            grammarPoints: analysis.grammarPoints,
            byLevel: analysis.byLevel,
            byCategory: analysis.byCategory,
            summary: analysis.summary,
            sentenceIndex: index,
            collocationDebug
          };
        } catch (error) {
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
  } catch (error) {
    console.error('Grammar detection analysis error:', error);
    res.status(500).json({ error: 'Grammar detection analysis failed', details: (error as Error).message });
  }
});

/**
 * GET /validate
 * Validate that grammar analysis is working with a simple test sentence
 */
router.get('/validate', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Grammar validation error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Grammar analysis validation failed',
      details: (error as Error).message
    });
  }
});

export default router;
