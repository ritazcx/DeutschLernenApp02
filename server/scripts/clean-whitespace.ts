import Database from 'better-sqlite3';
import * as path from 'path';

const db = new Database(path.join(__dirname, '../data/dictionary.db'));

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

function cleanWhitespace() {
  console.log('Starting whitespace cleanup...\n');

  const allVocab = db.prepare('SELECT * FROM vocabulary').all() as VocabularyEntry[];
  console.log(`Processing ${allVocab.length} entries\n`);

  let updated = 0;
  let totalFieldsUpdated = 0;

  for (let i = 0; i < allVocab.length; i++) {
    const entry = allVocab[i];
    const updates: string[] = [];
    const values: any[] = [];

    // Check and trim each text field
    const fields = [
      'word',
      'level',
      'pos',
      'article',
      'plural',
      'meaning_en',
      'meaning_de',
      'example_de',
      'example_en'
    ];

    for (const field of fields) {
      const value = (entry as any)[field];
      if (value && typeof value === 'string' && value !== value.trim()) {
        updates.push(`${field} = ?`);
        values.push(value.trim());
        totalFieldsUpdated++;
      }
    }

    // Execute update if there are changes
    if (updates.length > 0) {
      values.push(entry.id);
      const updateQuery = `UPDATE vocabulary SET ${updates.join(', ')} WHERE id = ?`;
      db.prepare(updateQuery).run(...values);
      updated++;

      if ((i + 1) % 100 === 0) {
        console.log(`Processed: ${i + 1}/${allVocab.length} (Updated: ${updated})`);
      }
    }
  }

  console.log('\n=== Cleanup Complete ===');
  console.log(`Total entries with whitespace: ${updated}`);
  console.log(`Total fields trimmed: ${totalFieldsUpdated}`);
}

cleanWhitespace();
