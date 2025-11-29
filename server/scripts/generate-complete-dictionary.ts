/**
 * Generate complete dictionary data for all B1 vocabulary
 * - English meaning
 * - German definition
 * - German example sentence
 * - English translation of example
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import db from '../src/db';

dotenv.config();

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

interface VocabEntry {
  word: string;
  article?: string;
  plural?: string;
  conjugations?: {
    present?: string;
    past?: string;
    perfect?: string;
  };
  level: string;
  pos?: string;
  meaning_en?: string;
  meaning_de?: string;
  example_de?: string;
  example_en?: string;
}

async function generateDictionaryData(words: VocabEntry[]): Promise<VocabEntry[]> {
  if (!API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not set');
  }

  const wordsText = words.map(w => {
    let text = w.word;
    if (w.article) text = `${w.article} ${text}`;
    if (w.plural) text += ` (Plural: ${w.plural})`;
    if (w.conjugations) {
      text += ` (Conjugations: ${w.conjugations.present}, ${w.conjugations.past}, ${w.conjugations.perfect})`;
    }
    return text;
  }).join('\n');

  const prompt = `You are a German B1 level dictionary. For each German word below, provide in JSON format:
1. pos: part of speech (noun/verb/adjective/adverb/preposition/conjunction/pronoun/interjection)
2. meaning_en: Brief English translation (5-10 words max)
3. meaning_de: German definition suitable for B1 learners (one sentence, 15-25 words)
4. example_de: Natural German example sentence using the word (B1 level, 10-15 words)
5. example_en: English translation of the example sentence

Words to process:
${wordsText}

Return as JSON array with format:
[{"pos":"verb","meaning_en":"to work","meaning_de":"Eine Tätigkeit ausführen, um Geld zu verdienen oder etwas zu schaffen","example_de":"Ich arbeite jeden Tag im Büro.","example_en":"I work in the office every day."}]

IMPORTANT: Return ONLY the JSON array, no other text.`;

  try {
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response');
      return words;
    }

    const results = JSON.parse(jsonMatch[0]);

    const merged = words.map((word, idx) => {
      const result = results[idx];
      return {
        ...word,
        pos: result?.pos || word.pos,
        meaning_en: result?.meaning_en || word.meaning_en,
        meaning_de: result?.meaning_de || word.meaning_de,
        example_de: result?.example_de || word.example_de,
        example_en: result?.example_en || word.example_en,
      };
    });

    return merged;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    return words;
  }
}

async function processInBatches(entries: VocabEntry[], batchSize: number = 20): Promise<VocabEntry[]> {
  const results: VocabEntry[] = [];
  const total = Math.ceil(entries.length / batchSize);

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    console.log(`\nProcessing batch ${batchNum}/${total} (${batch.length} words)...`);

    try {
      const processed = await generateDictionaryData(batch);
      results.push(...processed);

      // Save to database immediately after each batch
      const tx = db.transaction((items: VocabEntry[]) => {
        const stmt = db.prepare(`
          UPDATE vocabulary SET
            pos = @pos,
            meaning_en = @meaning_en,
            meaning_de = @meaning_de,
            example_de = @example_de,
            example_en = @example_en
          WHERE word = @word
        `);
        for (const entry of items) {
          stmt.run({
            word: entry.word,
            pos: entry.pos || null,
            meaning_en: entry.meaning_en || null,
            meaning_de: entry.meaning_de || null,
            example_de: entry.example_de || null,
            example_en: entry.example_en || null,
          });
        }
      });
      tx(processed);

      console.log(`✓ Completed. Progress: ${results.length}/${entries.length} (saved to DB)`);

      // Rate limiting
      if (i + batchSize < entries.length) {
        console.log('Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`Failed batch ${batchNum}. Adding originals...`);
      results.push(...batch);
    }
  }

  return results;
}

async function main() {
  console.log('📚 Loading B1 vocabulary from database...\n');

  // Get all vocabulary from database
  const allWords = db.prepare('SELECT * FROM vocabulary WHERE level = ?').all('B1');
  console.log(`Found ${allWords.length} B1 words in database\n`);

  // Convert to VocabEntry format
  const entries: VocabEntry[] = allWords.map((row: any) => ({
    word: row.word,
    article: row.article,
    plural: row.plural,
    conjugations: row.conjugation_present ? {
      present: row.conjugation_present,
      past: row.conjugation_past,
      perfect: row.conjugation_perfect,
    } : undefined,
    level: row.level,
    pos: row.pos,
    meaning_en: row.meaning_en,
    meaning_de: row.meaning_de,
    example_de: row.example_de,
    example_en: row.example_en,
  }));

  // Filter words that need dictionary data
  const needsData = entries.filter(e => !e.meaning_en || !e.meaning_de || !e.example_de);
  console.log(`${needsData.length} words need dictionary data\n`);

  if (needsData.length === 0) {
    console.log('✅ All words already have complete dictionary data!');
    return;
  }

  console.log('🤖 Generating dictionary data...\n');
  const processed = await processInBatches(needsData, 20);

  console.log(`\n✅ All ${processed.length} words processed and saved to database\n`);
  console.log('🎉 Dictionary generation complete!');
}

main().catch(console.error);
