import Database from 'better-sqlite3';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const db = new Database('./data/dictionary.db');
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
        max_tokens: 1500
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

async function validateAndEnhanceVocabulary() {
  console.log('[VALIDATION] Starting vocabulary validation (entries 807-3629)...\n');

  // Get vocabulary from entry 807 onwards
  const allVocab = db.prepare('SELECT * FROM vocabulary ORDER BY level ASC, word ASC LIMIT 2822 OFFSET 806').all() as VocabularyEntry[];
  console.log(`[VALIDATION] Processing ${allVocab.length} vocabulary entries\n`);

  let updated = 0;
  let validated = 0;
  let errors = 0;

  // Process in batches
  const batchSize = 1;  // Process one at a time for accuracy
  
  for (let i = 0; i < allVocab.length; i++) {
    const entry = allVocab[i];
    const globalIndex = 806 + i + 1;  // Global position in full vocabulary
    const progress = `[VALIDATION ${globalIndex}/3629]`;

    try {
      console.log(`${progress} Validating: ${entry.word}`);

      // Build validation prompt
      const prompt = `You are a German language expert. Validate and enhance the following vocabulary entry.

Current data:
- Word: "${entry.word}"
- Current level: ${entry.level}
- Current POS: ${entry.pos || 'UNKNOWN'}
- Current article: ${entry.article || 'N/A'}
- Current meaning_en: ${entry.meaning_en || 'MISSING'}
- Current meaning_de: ${entry.meaning_de || 'MISSING'}

Please validate and provide corrected information. Return ONLY valid JSON:
{
  "word": "${entry.word}",
  "level": "A1|A2|B1|B2|C1|C2 (correct CEFR level)",
  "pos": "noun|verb|adjective|adverb|conjunction|preposition|pronoun|particle|article|determiner|interjection",
  "article": "der|die|das|none (for nouns only, else 'none')",
  "plural": "plural form or null (for nouns only)",
  "meaning_en": "brief English definition (10-20 words)",
  "meaning_de": "brief German definition (10-20 words)",
  "confidence": 0.0-1.0,
  "notes": "any corrections made or issues found"
}

IMPORTANT:
1. Be very careful with CEFR level - use these guidelines:
   - A1: Basic words (greetings, numbers, family, colors, common actions)
   - A2: Elementary (hobbies, shopping, travel basics)
   - B1: Intermediate (more complex concepts, business, detailed descriptions)
   - B2: Upper Intermediate (abstract concepts, specialized vocabulary)
   - C1: Advanced (sophisticated, rare, technical terms)
   - C2: Mastery (extremely specialized or archaic)

2. For article: German nouns need der (masculine), die (feminine), or das (neuter)

3. Meanings should be clear and at appropriate level`;

      const response = await callDeepSeek(prompt);
      
      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse response');
        }
      }

      if (parsed && parsed.confidence > 0.6) {
        // Update database with validated/enhanced data
        const updates: string[] = [];
        const values: any[] = [];

        if (parsed.level && parsed.level !== entry.level) {
          console.log(`  → Level: ${entry.level} → ${parsed.level}`);
          updates.push('level = ?');
          values.push(parsed.level);
        }

        if (parsed.pos && parsed.pos !== entry.pos) {
          console.log(`  → POS: ${entry.pos || 'EMPTY'} → ${parsed.pos}`);
          updates.push('pos = ?');
          values.push(parsed.pos);
        }

        if (parsed.article && parsed.article !== 'none' && parsed.article !== entry.article) {
          console.log(`  → Article: ${entry.article || 'EMPTY'} → ${parsed.article}`);
          updates.push('article = ?');
          values.push(parsed.article);
        }

        if (parsed.plural && parsed.plural !== entry.plural) {
          console.log(`  → Plural: ${entry.plural || 'EMPTY'} → ${parsed.plural}`);
          updates.push('plural = ?');
          values.push(parsed.plural);
        }

        if (parsed.meaning_en && (!entry.meaning_en || parsed.meaning_en !== entry.meaning_en)) {
          console.log(`  → Meaning EN: ${parsed.meaning_en}`);
          updates.push('meaning_en = ?');
          values.push(parsed.meaning_en);
        }

        if (parsed.meaning_de && (!entry.meaning_de || parsed.meaning_de !== entry.meaning_de)) {
          console.log(`  → Meaning DE: ${parsed.meaning_de}`);
          updates.push('meaning_de = ?');
          values.push(parsed.meaning_de);
        }

        // Execute update
        if (updates.length > 0) {
          values.push(entry.id);
          const updateQuery = `UPDATE vocabulary SET ${updates.join(', ')} WHERE id = ?`;
          db.prepare(updateQuery).run(...values);
          updated++;
        }

        validated++;
        console.log(`  ✓ Confidence: ${(parsed.confidence * 100).toFixed(1)}%\n`);
      } else {
        console.log(`  ⚠ Low confidence (${(parsed?.confidence || 0).toFixed(1)}), skipped\n`);
      }

      await sleep(250);  // Rate limiting

      // Progress checkpoint every 50 entries
      if ((i + 1) % 50 === 0) {
        console.log(`\n=== Progress: ${i + 1}/${allVocab.length} | Updated: ${updated} | Errors: ${errors} ===\n`);
      }

    } catch (error) {
      console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}\n`);
      errors++;
    }
  }

  // Final report
  console.log('\n=== Validation Complete ===');
  console.log(`Total entries processed: ${allVocab.length}`);
  console.log(`Entries validated: ${validated}`);
  console.log(`Entries updated: ${updated}`);
  console.log(`Errors: ${errors}`);

  // Final statistics
  const completeStats = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN pos IS NOT NULL AND pos != "" AND meaning_en IS NOT NULL AND meaning_en != "" THEN 1 ELSE 0 END) as complete FROM vocabulary').get() as any;
  console.log(`\nDatabase Summary: ${completeStats.complete}/${completeStats.total} entries complete`);
}

validateAndEnhanceVocabulary().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
