import express from 'express';
import { findWord, upsertWord } from '../db';
import { fetchDictionaryEntry } from '../services/deepseek';
import { DictionaryEntry } from '../types';

const router = express.Router();

router.get('/api/dictionary/:word', async (req, res) => {
  const raw = String(req.params.word || '').trim();
  if (!raw) return res.status(400).json({ error: 'missing word' });

  try {
    const cached = findWord(raw);
    if (cached) return res.json(cached);

    // Not found — call DeepSeek server-side
    const entry = await fetchDictionaryEntry(raw);
    // Normalize keys to match DB column names
    const dbEntry: any = {
      word: entry.word,
      gender: entry.gender || '',
      translation: entry.translation || '',
      definition: entry.definition || '',
      example_german: entry.example_german || '',
      example_english: entry.example_english || '',
      difficulty: entry.difficulty || '',
      image_url: (entry as any).image_url || (entry as any).imageUrl || null,
    };

    upsertWord(dbEntry);
    return res.json(dbEntry);
  } catch (err: any) {
    console.error('dictionary GET error', err?.message || err);
    return res.status(500).json({ error: 'lookup_failed', detail: String(err?.message || err) });
  }
});

router.post('/api/dictionary', (req, res) => {
  const body: DictionaryEntry = req.body;
  if (!body || !body.word) return res.status(400).json({ error: 'missing word field' });

  try {
    upsertWord(body as any);
    return res.status(201).json({ ok: true, word: body.word });
  } catch (err: any) {
    console.error('dictionary POST error', err?.message || err);
    return res.status(500).json({ error: 'insert_failed' });
  }
});

export default router;
