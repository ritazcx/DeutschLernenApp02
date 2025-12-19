import express from 'express';
import { findVocabulary, upsertVocabulary } from '../db';
import { DictionaryEntry } from '../types';
import { fetchDictionaryEntry } from '../services/deepseek';

const router = express.Router();

router.get('/api/dictionary/:word', async (req, res) => {
  const raw = String(req.params.word || '').trim();
  if (!raw) return res.status(400).json({ error: 'missing word' });

  try {
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
        console.error(`Error fetching "${raw}" from DeepSeek:`, aiError?.message);
        return res.status(500).json({ 
          error: 'generation_failed',
          message: `Could not generate information for word "${raw}". Please try again.`
        });
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
    
    return res.json(entry);
  } catch (err: any) {
    console.error('dictionary GET error', err?.message || err);
    return res.status(500).json({ error: 'lookup_failed', detail: String(err?.message || err) });
  }
});

// Legacy POST endpoint removed - vocabulary is now read-only from database

export default router;
