import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

interface VocabEntry {
  word: string;
  pos?: string;
  meaning_en?: string;
  meaning_zh?: string;
}

/**
 * Generate meanings for a batch of German words using DeepSeek AI
 */
async function generateMeanings(words: string[]): Promise<VocabEntry[]> {
  if (!API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not set');
  }

  const prompt = `You are a German language expert. For each of the following German words, provide:
1. Part of speech (noun/verb/adjective/adverb/preposition/conjunction/pronoun)
2. Brief English meaning (5-10 words max)
3. Brief Chinese meaning (简短的中文释义)

Format as JSON array with this structure:
[
  {
    "word": "word",
    "pos": "part_of_speech",
    "meaning_en": "English meaning",
    "meaning_zh": "中文释义"
  }
]

Words to process:
${words.join('\n')}

Return ONLY the JSON array, no additional text.`;

  try {
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`
        },
        timeout: 30000
      }
    );

    const content = response.data.choices[0].message.content.trim();
    
    // Try to extract JSON from the response
    let jsonStr = content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const entries = JSON.parse(jsonStr);
    return entries;
  } catch (error: any) {
    console.error('Error generating meanings:', error.message);
    throw error;
  }
}

/**
 * Process vocabulary list in batches
 */
async function processVocabulary(wordList: string[], batchSize: number = 20): Promise<VocabEntry[]> {
  const results: VocabEntry[] = [];
  
  for (let i = 0; i < wordList.length; i += batchSize) {
    const batch = wordList.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(wordList.length / batchSize)} (${batch.length} words)...`);
    
    try {
      const entries = await generateMeanings(batch);
      results.push(...entries);
      
      // Save intermediate results
      const outputPath = path.resolve(__dirname, '../data/b1-vocabulary-progress.json');
      fs.writeFileSync(outputPath, JSON.stringify({ level: 'B1', words: results }, null, 2));
      
      // Rate limiting - wait 2 seconds between batches
      if (i + batchSize < wordList.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Failed to process batch starting at index ${i}:`, error);
      // Continue with next batch
    }
  }
  
  return results;
}

/**
 * Load B1 word list (you need to provide this)
 */
function loadB1WordList(): string[] {
  // This is a comprehensive B1 word list based on Goethe-Institut and common frequency lists
  // For now, I'll include a substantial list. You can expand this further.
  return [
    // Add your complete B1 word list here
    // For demonstration, I'll include common B1 words
  ];
}

async function main() {
  const wordListPath = path.resolve(__dirname, '../data/b1-wordlist.txt');
  
  if (!fs.existsSync(wordListPath)) {
    console.error(`Word list not found at ${wordListPath}`);
    console.log('Please create a file with one German word per line.');
    process.exit(1);
  }
  
  const wordList = fs.readFileSync(wordListPath, 'utf-8')
    .split('\n')
    .map(w => w.trim())
    .filter(w => w.length > 0);
  
  console.log(`Loaded ${wordList.length} words to process`);
  
  const entries = await processVocabulary(wordList, 20);
  
  // Save final results
  const outputPath = path.resolve(__dirname, '../data/b1-vocabulary-complete.json');
  const output = {
    level: 'B1',
    words: entries
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✓ Saved ${entries.length} entries to ${outputPath}`);
}

if (require.main === module) {
  main().catch(console.error);
}
