import Database from 'better-sqlite3';
import * as fs from 'fs';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '../.env' });

const db = new Database('./data/dictionary.db');

// Configure DeepSeek API
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.error('Error: DEEPSEEK_API_KEY not found in .env file');
  process.exit(1);
}

interface VocabularyEntry {
  id: number;
  word: string;
  level: string;
  pos: string;
  article: string;
  plural: string;
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
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
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

async function generateMeanings(word: string, article: string, pos: string): Promise<{ meaning_en: string; meaning_de: string }> {
  const prompt = `Provide definitions for the German word "${article} ${word}" (part of speech: ${pos}).

Format your response EXACTLY as follows (with these exact separators):
EN: [English definition, 1-2 sentences, clear and concise]
DE: [German definition, 1-2 sentences, clear and concise]

Example format:
EN: To submit or hand in something, especially documents or applications.
DE: Etwas einreichen oder abgeben, besonders Dokumente oder Bewerbungen.

Now provide the definition for "${article} ${word}":`;

  const response = await callDeepSeek(prompt);
  
  const enMatch = response.match(/EN:\s*(.+?)(?=DE:|$)/s);
  const deMatch = response.match(/DE:\s*(.+?)$/s);
  
  const meaning_en = enMatch ? enMatch[1].trim() : '';
  const meaning_de = deMatch ? deMatch[1].trim() : '';
  
  return { meaning_en, meaning_de };
}

async function translateExamples(germanExamples: string): Promise<string> {
  const examples = germanExamples.split('|').map(e => e.trim());
  
  const prompt = `Translate the following German sentences to English. Keep them natural and idiomatic.

${examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

Provide translations in the same format (numbered list), separated by pipe character (|) in a single line at the end.

Format:
1. [English translation 1]
2. [English translation 2]
etc.

Then end with:
TRANSLATIONS: [translation 1] | [translation 2] | etc.`;

  const response = await callDeepSeek(prompt);
  
  const match = response.match(/TRANSLATIONS:\s*(.+?)$/s);
  if (match) {
    return match[1].trim();
  }
  
  // Fallback: extract numbered translations
  const lines = response.split('\n');
  const translations = lines
    .filter(line => /^\d+\.\s/.test(line))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .join(' | ');
  
  return translations;
}

async function completeVocabulary() {
  // Get entries that need completion
  const stmt = db.prepare(`
    SELECT * FROM vocabulary 
    WHERE (meaning_en IS NULL OR meaning_en = '') 
       OR (meaning_de IS NULL OR meaning_de = '')
       OR (example_en IS NULL OR example_en = '')
    ORDER BY level ASC, word ASC
  `);
  
  const entries = stmt.all() as VocabularyEntry[];
  console.log(`Found ${entries.length} entries to complete`);
  
  const updateStmt = db.prepare(`
    UPDATE vocabulary 
    SET meaning_en = ?, meaning_de = ?, example_en = ?
    WHERE id = ?
  `);
  
  let completed = 0;
  let failed = 0;
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const progress = `[${i + 1}/${entries.length}]`;
    
    try {
      let meaning_en = entry.meaning_en || '';
      let meaning_de = entry.meaning_de || '';
      let example_en = entry.example_en || '';
      
      // Generate meanings if missing
      if (!entry.meaning_en || !entry.meaning_de) {
        console.log(`${progress} Generating meanings for: ${entry.word}`);
        const meanings = await generateMeanings(entry.word, entry.article || '', entry.pos || '');
        meaning_en = meanings.meaning_en;
        meaning_de = meanings.meaning_de;
        await sleep(500); // Rate limiting
      }
      
      // Translate examples if missing
      if (!entry.example_en && entry.example_de) {
        console.log(`${progress} Translating examples for: ${entry.word}`);
        example_en = await translateExamples(entry.example_de);
        await sleep(500); // Rate limiting
      }
      
      // Update database
      updateStmt.run(meaning_en, meaning_de, example_en, entry.id);
      completed++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`Completed: ${completed}, Failed: ${failed}`);
      }
    } catch (error) {
      console.error(`${progress} Error processing ${entry.word}:`, error instanceof Error ? error.message : error);
      failed++;
    }
  }
  
  console.log('\n=== Completion Summary ===');
  console.log(`Total processed: ${entries.length}`);
  console.log(`Successfully completed: ${completed}`);
  console.log(`Failed: ${failed}`);
}

completeVocabulary().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
