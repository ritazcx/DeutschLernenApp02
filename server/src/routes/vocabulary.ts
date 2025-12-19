import express from 'express';
import { lookupWord } from '../services/vocabularyService';
import { createValidationError, createNotFoundError } from '../utils/errors';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * GET /api/vocabulary/:word
 * Look up a single word in the vocabulary database
 */
router.get('/:word', asyncHandler(async (req, res) => {
  const { word } = req.params;
  
  if (!word || !word.trim()) {
    throw createValidationError('Word parameter is required');
  }
  
  const entry = lookupWord(word.trim());
  
  if (!entry) {
    throw createNotFoundError(`Word "${word}" not found in vocabulary database`);
  }
  
  res.json(entry);
}));

export default router;
