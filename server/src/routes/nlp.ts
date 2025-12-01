/**
 * NLP API Routes
 * 测试NLP引擎的API端点
 */

import { Router, Request, Response } from 'express';
import { NLPEngine } from '../services/nlpEngine';
import { VocabularyExtractor } from '../services/vocabularyExtractor';

const router = Router();

// 初始化NLP引擎
const nlpEngine = new NLPEngine();
const vocabExtractor = new VocabularyExtractor();

/**
 * POST /api/nlp/parse
 * 解析句子或文章
 */
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { text, mode = 'sentence' } = req.body;

    if (!text) {
      return res.status(400).json({error: 'Missing text parameter'});
    }

    const result = mode === 'text' 
      ? await nlpEngine.parseText(text)
      : await nlpEngine.parseSentence(text);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({error: 'Parse failed', details: String(error)});
  }
});

/**
 * POST /api/nlp/vocabulary
 * 提取生词本
 */
router.post('/vocabulary', async (req: Request, res: Response) => {
  try {
    const { text, excludeLevels = [] } = req.body;

    if (!text) {
      return res.status(400).json({error: 'Missing text parameter'});
    }

    const vocabulary = await vocabExtractor.extract(text, excludeLevels);

    res.json({
      success: true,
      count: vocabulary.length,
      vocabulary
    });
  } catch (error) {
    console.error('Vocabulary extraction error:', error);
    res.status(500).json({error: 'Extraction failed', details: String(error)});
  }
});

/**
 * POST /api/nlp/vocabulary-by-level
 * 按难度等级提取生词本
 */
router.post('/vocabulary-by-level', async (req: Request, res: Response) => {
  try {
    const { text, level } = req.body;

    if (!text || !level) {
      return res.status(400).json({error: 'Missing text or level parameter'});
    }

    const vocabulary = await vocabExtractor.extractByLevel(text, level);

    res.json({
      success: true,
      level,
      count: vocabulary.length,
      vocabulary
    });
  } catch (error) {
    console.error('Vocabulary extraction error:', error);
    res.status(500).json({error: 'Extraction failed', details: String(error)});
  }
});

/**
 * POST /api/nlp/vocabulary-csv
 * 导出生词本为CSV
 */
router.post('/vocabulary-csv', async (req: Request, res: Response) => {
  try {
    const { text, excludeLevels = [] } = req.body;

    if (!text) {
      return res.status(400).json({error: 'Missing text parameter'});
    }

    const vocabulary = await vocabExtractor.extract(text, excludeLevels);
    const csv = vocabExtractor.exportToCSV(vocabulary);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vocabulary.csv"');
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({error: 'Export failed', details: String(error)});
  }
});

/**
 * POST /api/nlp/analyze-grammar
 * Analyze grammar points in a sentence
 */
router.post('/analyze-grammar', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const result = await nlpEngine.analyzeGrammar(text);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Grammar analysis error:', error);
    res.status(500).json({ error: 'Grammar analysis failed', details: String(error) });
  }
});

/**
 * GET /api/nlp/health
 * 健康检查
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'nlp-engine',
    timestamp: new Date().toISOString()
  });
});

export default router;
