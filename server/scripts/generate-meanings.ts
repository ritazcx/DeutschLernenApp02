/**
 * Generate English meanings for vocabulary entries using DeepSeek AI
 * Only generates English meanings, no Chinese
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

interface VocabEntry {
  word: string;
  level: string;
  pos?: string;
  meaning_en?: string;
  example_sentence?: string;
}

async function generateMeanings(words: VocabEntry[]): Promise<VocabEntry[]> {
  if (!API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not set');
  }

  const wordsText = words.map(w => 
    w.example_sentence 
      ? `${w.word} (example: ${w.example_sentence})`
      : w.word
  ).join('\n');

  const prompt = `You are a German language expert. For each word below, provide:
1. Part of speech (noun/verb/adjective/adverb/preposition/conjunction/pronoun/article)
2. Brief English meaning (B1 level, 5-10 words max)

Format as JSON array:
[
  {
    "word": "word",
    "pos": "part_of_speech", 
    "meaning_en": "English meaning"
  }
]

Words:
${wordsText}

Return ONLY the JSON array, no additional text.`;

  try {
    console.log(`Calling DeepSeek API for ${words.length} words...`);
    
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 3000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`
        },
        timeout: 45000
      }
    );

    const content = response.data.choices[0].message.content.trim();
    
    // Extract JSON from response
    let jsonStr = content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const results = JSON.parse(jsonStr);
    
    // Merge results with original entries
    const merged = words.map(word => {
      const result = results.find((r: any) => r.word.toLowerCase() === word.word.toLowerCase());
      return {
        ...word,
        pos: result?.pos || word.pos,
        meaning_en: result?.meaning_en || word.meaning_en
      };
    });
    
    return merged;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

async function processInBatches(entries: VocabEntry[], batchSize: number = 30): Promise<VocabEntry[]> {
  const results: VocabEntry[] = [];
  const total = Math.ceil(entries.length / batchSize);
  
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    
    console.log(`\nProcessing batch ${batchNum}/${total} (${batch.length} words)...`);
    
    try {
      const processed = await generateMeanings(batch);
      results.push(...processed);
      
      // Save progress
      const progressPath = path.resolve(__dirname, '../data/b1-vocabulary-progress.json');
      fs.writeFileSync(progressPath, JSON.stringify({
        level: 'B1',
        processed: results.length,
        total: entries.length,
        words: results
      }, null, 2));
      
      console.log(`✓ Completed. Progress: ${results.length}/${entries.length}`);
      
      // Rate limiting - wait between batches
      if (i + batchSize < entries.length) {
        console.log('Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`Failed batch ${batchNum}. Continuing...`);
      // Add originals without meanings for this batch
      results.push(...batch);
    }
  }
  
  return results;
}

async function main() {
  const inputPath = path.resolve(__dirname, '../data/goethe-b1-extracted.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error('❌ File not found:', inputPath);
    console.log('Please run extract-from-pdf.ts first');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const entries: VocabEntry[] = data.words;
  
  console.log(`📚 Loaded ${entries.length} vocabulary entries`);
  console.log('🤖 Generating English meanings...\n');
  
  const processed = await processInBatches(entries, 30);
  
  // Save final results
  const outputPath = path.resolve(__dirname, '../data/b1-vocabulary-complete.json');
  const output = {
    level: 'B1',
    source: data.source || 'Goethe-Zertifikat B1 Wortliste',
    generated_at: new Date().toISOString(),
    word_count: processed.length,
    words: processed
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\n✅ Complete!`);
  console.log(`📝 Saved ${processed.length} entries to ${outputPath}`);
  console.log(`\nNext step: Run import-vocabulary.ts to load into database`);
}

main().catch(console.error);
