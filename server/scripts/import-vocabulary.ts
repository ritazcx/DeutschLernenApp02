import { importVocabularyBatch } from '../src/db';
import * as fs from 'fs';
import * as path from 'path';

const dataFile = path.resolve(__dirname, '../data/b1-core-vocabulary.json');

if (!fs.existsSync(dataFile)) {
  console.error('Vocabulary data file not found:', dataFile);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

console.log(`Importing ${data.words.length} ${data.level} words...`);

importVocabularyBatch(data.words.map((w: any) => ({
  word: w.word,
  level: data.level,
  pos: w.pos,
  meaning_en: w.meaning_en,
  meaning_zh: w.meaning_zh,
})));

console.log('✓ Vocabulary import completed successfully!');
