import express from 'express';
import { findVocabulary, upsertVocabulary } from '../db';
import { DictionaryEntry } from '../types';
import { fetchDictionaryEntry } from '../services/deepseek';
import { 
  createValidationError,
  ErrorCode,
  AppError
} from '../utils/errors';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

router.get('/api/dictionary/:word', asyncHandler(async (req, res) => {
  const raw = String(req.params.word || '').trim();
  if (!raw) {
    throw createValidationError('Word parameter is required');
  }

  // Check the vocabulary database
  let vocabEntry: any = findVocabulary(raw);
  
  // If not found in database, fetch from DeepSeek and insert
  if (!vocabEntry) {
    try {
      const aiEntry = await fetchDictionaryEntry(raw);
      
      // Insert the new entry into database
      upsertVocabulary({
        word: aiEntry.word || raw,
        level: aiEntry.level || 'B1',
        pos: aiEntry.pos || null,
        article: aiEntry.article || null,
        plural: aiEntry.plural || null,
        meaning_en: aiEntry.translation || '',
        meaning_de: aiEntry.meaning_de || aiEntry.definition || '',
        example_de: aiEntry.example_german || '',
        example_en: aiEntry.example_english || '',
      });
      
      // Use the AI-generated entry
      vocabEntry = {
        word: aiEntry.word || raw,
        article: aiEntry.article || null,
        meaning_en: aiEntry.translation || '',
        meaning_de: aiEntry.meaning_de || aiEntry.definition || '',
        example_de: aiEntry.example_german || '',
        example_en: aiEntry.example_english || '',
        level: aiEntry.level || 'B1',
        pos: aiEntry.pos || null,
        plural: aiEntry.plural || null,
        conjugation_present: null,
        conjugation_past: null,
        conjugation_perfect: null,
      };
    } catch (aiError: any) {
      // Convert DeepSeek API errors to generation failed errors
      throw new AppError(
        ErrorCode.GENERATION_FAILED,
        `Could not generate information for word "${raw}". Please try again.`,
        502, // Bad Gateway - external service error
        aiError?.message || String(aiError)
      );
    }
  }
  
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
  
  res.json(entry);
}));

// Legacy POST endpoint removed - vocabulary is now read-only from database

export default router;
