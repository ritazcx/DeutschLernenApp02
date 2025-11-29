import express from 'express';
import { findVocabulary } from '../db';
import { DictionaryEntry } from '../types';

const router = express.Router();

router.get('/api/dictionary/:word', async (req, res) => {
  const raw = String(req.params.word || '').trim();
  if (!raw) return res.status(400).json({ error: 'missing word' });

  try {
    // Check the vocabulary database
    const vocabEntry = findVocabulary(raw);
    if (vocabEntry) {
      // Transform vocabulary entry to match frontend DictionaryEntry interface
      const entry: any = {
        word: vocabEntry.word,
        gender: vocabEntry.article || '', // Frontend uses 'gender' not 'article'
        translation: vocabEntry.meaning_en || '',
        definition: vocabEntry.meaning_de || '', // Frontend uses 'definition' for German definition
        exampleSentenceGerman: vocabEntry.example_de || '',
        exampleSentenceEnglish: vocabEntry.example_en || '',
        difficulty: vocabEntry.level || '',
        imageUrl: null,
        // Additional fields for backend/advanced use
        pos: vocabEntry.pos,
        plural: vocabEntry.plural,
        conjugations: vocabEntry.conjugation_present ? {
          present: vocabEntry.conjugation_present,
          past: vocabEntry.conjugation_past,
          perfect: vocabEntry.conjugation_perfect
        } : undefined
      };
      
      return res.json(entry);
    }

    // Word not found in either database
    return res.status(404).json({ 
      error: 'word_not_found', 
      message: `Word "${raw}" not found in vocabulary database. Try analyzing a text containing this word first.` 
    });
  } catch (err: any) {
    console.error('dictionary GET error', err?.message || err);
    return res.status(500).json({ error: 'lookup_failed', detail: String(err?.message || err) });
  }
});

// Legacy POST endpoint removed - vocabulary is now read-only from database

// Search vocabulary with filters
router.get('/api/vocabulary/search', (req, res) => {
  try {
    const { q, level, pos, limit = '50' } = req.query;
    
    let query = 'SELECT * FROM vocabulary WHERE 1=1';
    const params: any[] = [];
    
    if (q && typeof q === 'string') {
      query += ' AND (LOWER(word) LIKE ? OR LOWER(meaning_en) LIKE ?)';
      const searchTerm = `%${q.toLowerCase()}%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (level && typeof level === 'string') {
      query += ' AND level = ?';
      params.push(level);
    }
    
    if (pos && typeof pos === 'string') {
      query += ' AND pos = ?';
      params.push(pos);
    }
    
    query += ' ORDER BY word LIMIT ?';
    params.push(parseInt(limit as string, 10));
    
    const db = require('../db').default;
    const results = db.prepare(query).all(...params);
    
    // Add conjugations if available
    const parsed = results.map((row: any) => ({
      ...row,
      conjugations: row.conjugation_present ? {
        present: row.conjugation_present,
        past: row.conjugation_past,
        perfect: row.conjugation_perfect
      } : undefined
    }));
    
    res.json({ results: parsed, count: parsed.length });
  } catch (err: any) {
    console.error('vocabulary search error', err?.message || err);
    res.status(500).json({ error: 'search_failed' });
  }
});

// Get vocabulary statistics
router.get('/api/vocabulary/stats', (req, res) => {
  try {
    const db = require('../db').default;
    
    const total = db.prepare('SELECT COUNT(*) as count FROM vocabulary').get().count;
    const byLevel = db.prepare('SELECT level, COUNT(*) as count FROM vocabulary GROUP BY level').all();
    const byPos = db.prepare('SELECT pos, COUNT(*) as count FROM vocabulary WHERE pos IS NOT NULL GROUP BY pos').all();
    const withMeanings = db.prepare('SELECT COUNT(*) as count FROM vocabulary WHERE meaning_en IS NOT NULL').get().count;
    const withExamples = db.prepare('SELECT COUNT(*) as count FROM vocabulary WHERE example_de IS NOT NULL OR example_en IS NOT NULL').get().count;
    
    res.json({
      total,
      byLevel,
      byPos,
      withMeanings,
      withExamples
    });
  } catch (err: any) {
    console.error('vocabulary stats error', err?.message || err);
    res.status(500).json({ error: 'stats_failed' });
  }
});

export default router;
