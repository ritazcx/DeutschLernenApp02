import Database from 'better-sqlite3';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const db = new Database('./data/dictionary.db');
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.error('Error: DEEPSEEK_API_KEY not found in .env file');
  console.error('Tried paths:');
  console.error('  -', path.join(__dirname, '../../.env'));
  console.error('  -', path.join(__dirname, '../.env'));
  process.exit(1);
}

interface VocabularyEntry {
  id: number;
  word: string;
  level: string;
  pos: string | null;
  article: string | null;
  plural: string | null;
  meaning_en: string | null;
  meaning_de: string | null;
  example_de: string | null;
  example_en: string | null;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callDeepSeek(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data.choices && response.data.choices[0].message) {
      return response.data.choices[0].message.content.trim();
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('DeepSeek API error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

async function cleanVocabularyData() {
  console.log('Starting vocabulary data cleaning and enhancement...\n');

  // Step 1: Find entries with missing POS
  console.log('Step 1: Fixing entries with missing POS (part of speech)...');
  const missingPOS = db.prepare(`
    SELECT id, word, level, article FROM vocabulary 
    WHERE (pos IS NULL OR pos = '')
    ORDER BY level ASC, word ASC
    LIMIT 100
  `).all() as VocabularyEntry[];

  console.log(`Found ${missingPOS.length} entries with missing POS\n`);

  let posFixed = 0;
  for (let i = 0; i < missingPOS.length; i++) {
    const entry = missingPOS[i];
    const progress = `[${i + 1}/${missingPOS.length}]`;

    try {
      console.log(`${progress} Processing: ${entry.word}`);

      const prompt = `Classify the German word "${entry.word}" (article: ${entry.article || 'none'}, level: ${entry.level}).

Respond with ONLY a JSON object in this format:
{
  "pos": "noun|verb|adjective|adverb|conjunction|preposition|pronoun|particle",
  "confidence": 0.0-1.0
}

The word is at CEFR level ${entry.level}, so classify accordingly.`;

      const response = await callDeepSeek(prompt);
      const parsed = JSON.parse(response);

      if (parsed.pos && parsed.confidence > 0.7) {
        db.prepare('UPDATE vocabulary SET pos = ? WHERE id = ?').run(parsed.pos, entry.id);
        console.log(`  ✓ Fixed: ${parsed.pos}\n`);
        posFixed++;
      }

      await sleep(300);
    } catch (error) {
      console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}\n`);
    }
  }

  console.log(`\nFixed ${posFixed} entries with missing POS\n`);

  // Step 2: Fix obviously wrong level classifications
  console.log('Step 2: Checking for obviously wrong level classifications...');
  
  // Words that are commonly A1-A2 but marked as B2
  const commonlyWrongWords = {
    'damit': 'A1',  // conjunction
    'vielleicht': 'A1', // adverb
    'natürlich': 'A1', // adverb
    'möglich': 'A1', // adjective
    'bereits': 'A2', // adverb
    'zuerst': 'A1', // adverb
    'darum': 'A1', // conjunction/pronoun
  };

  for (const [word, correctLevel] of Object.entries(commonlyWrongWords)) {
    const current = db.prepare('SELECT level FROM vocabulary WHERE LOWER(word) = ?').get(word.toLowerCase()) as any;
    if (current && current.level !== correctLevel) {
      console.log(`Fixing "${word}": ${current.level} → ${correctLevel}`);
      db.prepare('UPDATE vocabulary SET level = ? WHERE LOWER(word) = ?').run(correctLevel, word.toLowerCase());
    }
  }

  // Step 3: Fix common article errors
  console.log('\nStep 3: Fixing common article errors...');
  
  const articleFixes = {
    'Stadt': 'die',      // was marked as 'der'
    'Frau': 'die',       // should be 'die'
    'Mann': 'der',       // should be 'der'
    'Kind': 'das',       // should be 'das'
  };

  for (const [word, correctArticle] of Object.entries(articleFixes)) {
    const current = db.prepare('SELECT article FROM vocabulary WHERE word = ?').get(word) as any;
    if (current && current.article !== correctArticle) {
      console.log(`Fixing "${word}": ${current.article} → ${correctArticle}`);
      db.prepare('UPDATE vocabulary SET article = ? WHERE word = ?').run(correctArticle, word);
    }
  }

  // Step 4: Fill missing meanings using AI (ALL ENTRIES)
  console.log('\nStep 4: Filling missing English meanings...');
  const missingMeanings = db.prepare(`
    SELECT id, word, level, pos, article FROM vocabulary 
    WHERE (meaning_en IS NULL OR meaning_en = '')
    ORDER BY level ASC, word ASC
  `).all() as VocabularyEntry[];

  console.log(`Found ${missingMeanings.length} entries with missing meanings\n`);

  let meaningsAdded = 0;
  for (let i = 0; i < missingMeanings.length; i++) {
    const entry = missingMeanings[i];
    const progress = `[${i + 1}/${missingMeanings.length}]`;

    try {
      console.log(`${progress} Getting meaning for: ${entry.word}`);

      const prompt = `Provide a brief English definition for the German ${entry.pos || 'word'} "${entry.word}" at CEFR level ${entry.level}.

Respond with ONLY a JSON object:
{
  "meaning_en": "brief definition (5-15 words max)"
}`;

      const response = await callDeepSeek(prompt);
      const parsed = JSON.parse(response);

      if (parsed.meaning_en) {
        db.prepare('UPDATE vocabulary SET meaning_en = ? WHERE id = ?').run(parsed.meaning_en, entry.id);
        console.log(`  ✓ Added: ${parsed.meaning_en}\n`);
        meaningsAdded++;
      }

      // Reduce sleep time for faster processing
      await sleep(200);
    } catch (error) {
      console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}\n`);
    }

    // Progress checkpoint every 50 entries
    if ((i + 1) % 50 === 0) {
      console.log(`\n=== Progress: ${i + 1}/${missingMeanings.length} meanings added ===\n`);
    }
  }

  console.log(`\nAdded ${meaningsAdded} missing meanings\n`);

  // Step 5: Batch validate and enhance
  console.log('Step 5: Final data quality check...');
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN pos IS NULL OR pos = '' THEN 1 END) as missing_pos,
      COUNT(CASE WHEN meaning_en IS NULL OR meaning_en = '' THEN 1 END) as missing_meaning_en,
      COUNT(CASE WHEN level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2') THEN 1 END) as valid_levels
    FROM vocabulary
  `).get() as any;

  console.log('\n=== Data Quality Report ===');
  console.log(`Total entries: ${stats.total}`);
  console.log(`Missing POS: ${stats.missing_pos} (${((stats.missing_pos / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Missing meanings: ${stats.missing_meaning_en} (${((stats.missing_meaning_en / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Valid levels: ${stats.valid_levels}/${stats.total}`);

  console.log('\n=== Cleaning Complete ===');
  console.log(`POS fixed: ${posFixed}`);
  console.log(`Meanings added: ${meaningsAdded}`);
}

cleanVocabularyData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
