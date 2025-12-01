import express from 'express';
import { NLPEngine } from '../services/nlpEngine';

const router = express.Router();

  // Initialize NLP engine
  let nlpEngine: NLPEngine;
  try {
    nlpEngine = new NLPEngine();
  } catch (error) {
    console.error('Failed to initialize NLP Engine:', error);
    throw error;
  }/**
 * Robust sentence splitting that handles dates, abbreviations, and German text
 * Treats titles and subtitles as single sentences
 */
function splitIntoSentences(text: string): string[] {
  // Handle common German abbreviations and date patterns
  const protectedPatterns = [
    /\b\d{1,2}\./g,  // dates like "5.", "21."
    /\b\d{1,2}\.\s*(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez|January|February|March|April|May|June|July|August|September|October|November|December)/gi,
    /\b(Dr|Prof|Fr|Hr|Frl|Hr)\./g,  // titles
    /\b(z\.B|e\.g|i\.e|etc|vs|ca|c\.a|cf|et al|usw|bzw|u\.a|d\.h|d\.i|a\.a\.O)\./gi,  // common abbreviations
    /\b([IVXLCDM]+\.)/g,  // Roman numerals like "XXXI."
    /\b([A-Z]\.){2,}/g,  // initials like "U.S.A."
  ];

  // Temporarily replace protected periods with a placeholder
  let processedText = text;
  const placeholders: string[] = [];
  let placeholderIndex = 0;

  protectedPatterns.forEach(pattern => {
    processedText = processedText.replace(pattern, (match) => {
      const placeholder = `__PLACEHOLDER_${placeholderIndex}__`;
      placeholders[placeholderIndex] = match;
      placeholderIndex++;
      return placeholder;
    });
  });

  // First, split on paragraph breaks (double line breaks) to separate sections
  const paragraphs = processedText.split(/\n\s*\n/);
  
  const allSentences: string[] = [];

  // Process each paragraph
  for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex++) {
    const paragraph = paragraphs[paragraphIndex];
    if (paragraph.trim().length === 0) continue;

    // Split on single line breaks to handle titles separated by newlines
    const lines = paragraph.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const section = lines[lineIndex];
      if (section.length === 0) continue;

      // Check if this section looks like a title (short, no sentence punctuation, or is a standalone line)
      const isTitle = (section.length < 100 && !section.match(/[.!?]\s*$/)) || 
                      (lineIndex === 0 && lines.length > 1 && section.length < 100 && !section.match(/[.!?]\s*$/));

      if (isTitle) {
        // Treat as single title/subtitle sentence
        allSentences.push(section.replace(/\s+/g, ' ').trim());
      } else {
        // Normal sentence splitting for content sections
        const sentencePattern = /([.!?])\s+(?=[A-ZÄÖÜ])/g;
        const sentences: string[] = [];
        let lastIndex = 0;
        let match;

        while ((match = sentencePattern.exec(section)) !== null) {
          const sentenceEnd = match.index + match[1].length;
          const sentence = section.substring(lastIndex, sentenceEnd).trim();
          if (sentence.length > 0) {
            sentences.push(sentence.replace(/\s+/g, ' ')); // Normalize whitespace
          }
          lastIndex = sentenceEnd;
        }

        // Add the last sentence if there's remaining text
        if (lastIndex < section.length) {
          const lastSentence = section.substring(lastIndex).trim();
          if (lastSentence.length > 0) {
            sentences.push(lastSentence.replace(/\s+/g, ' ')); // Normalize whitespace
          }
        }

        allSentences.push(...sentences);
      }
    }
  }

  // Restore the protected patterns
  const finalSentences = allSentences.map(sentence => {
    let restored = sentence;
    placeholders.forEach((original, index) => {
      restored = restored.replace(`__PLACEHOLDER_${index}__`, original);
    });
    return restored;
  });

  return finalSentences.filter(s => s.trim().length > 0);
}

/**
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
