import express from 'express';
import { lookupWord } from '../services/vocabularyService';

const router = express.Router();

/**
 * GET /api/vocabulary/:word
 * Look up a single word in the vocabulary database
 */
router.get('/:word', (req, res) => {
  const { word } = req.params;
  
  if (!word) {
    return res.status(400).json({ error: 'Word parameter is required' });
  }
  
  const entry = lookupWord(word);
  
  if (!entry) {
    return res.status(404).json({ error: 'Word not found in vocabulary database' });
  }
  
  res.json(entry);
});

export default router;
