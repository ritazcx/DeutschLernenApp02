import express from 'express';
import { randomUUID } from 'crypto';
import { saveAnalysis, listAnalyses, getAnalysisById, deleteAnalysis } from '../db';

const router = express.Router();

/**
 * @deprecated These analysis persistence endpoints are not currently used by the frontend.
 * Frontend uses localStorage for article persistence instead of backend database.
 * 
 * Consider removing if backend persistence is not needed:
 * - POST /api/analyses
 * - GET /api/analyses
 * - GET /api/analyses/:id
 * - DELETE /api/analyses/:id
 * 
 * Database tables affected: analyses, sentences, grammar_points
 */

// Save an analysis
router.post('/api/analyses', (req, res) => {
  try {
    const body = req.body || {};
    const id = body.id || randomUUID();
    const payload = {
      id,
      title: body.title || null,
      source: body.source || null,
      text: body.text || null,
      word_count: body.word_count || (body.text ? body.text.split(/\s+/).filter(Boolean).length : null),
      sentences: body.sentences || [],
    };

    saveAnalysis(payload);
    res.status(201).json({ id });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Error saving analysis', err);
    res.status(500).json({ error: 'save_failed', detail: err?.message || String(err) });
  }
});

// List analyses with simple pagination
router.get('/api/analyses', (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit ?? 20));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    const rows = listAnalyses(limit, offset);
    res.json({ items: rows, limit, offset });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Error listing analyses', err);
    res.status(500).json({ error: 'list_failed' });
  }
});

// Get one analysis
router.get('/api/analyses/:id', (req, res) => {
  try {
    const id = req.params.id;
    const a = getAnalysisById(id);
    if (!a) return res.status(404).json({ error: 'not_found' });
    res.json(a);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Error getting analysis', err);
    res.status(500).json({ error: 'get_failed' });
  }
});

// Delete an analysis
router.delete('/api/analyses/:id', (req, res) => {
  try {
    const id = req.params.id;
    const ok = deleteAnalysis(id);
    if (!ok) return res.status(404).json({ error: 'not_found' });
    res.json({ success: true });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Error deleting analysis', err);
    res.status(500).json({ error: 'delete_failed' });
  }
});

export default router;
