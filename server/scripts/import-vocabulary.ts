import { importVocabularyBatch } from '../src/db';
import * as fs from 'fs';
import * as path from 'path';

// Try to import from complete vocabulary first, fallback to core
const completeFile = path.resolve(__dirname, '../data/b1-vocabulary-complete.json');
const coreFile = path.resolve(__dirname, '../data/b1-core-vocabulary.json');

let dataFile = completeFile;
if (!fs.existsSync(completeFile)) {
  console.log('Complete vocabulary not found, using core vocabulary');
  dataFile = coreFile;
}

if (!fs.existsSync(dataFile)) {
  console.error('Vocabulary data file not found:', dataFile);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

console.log(`Importing ${data.words.length} ${data.level} words...`);

importVocabularyBatch(data.words.map((w: any) => ({
  word: w.word,
  level: data.level || w.level,
  pos: w.pos,
  meaning_en: w.meaning_en,
  meaning_zh: w.meaning_zh,
  example_sentence: w.example_sentence,
})));

console.log('✓ Vocabulary import completed successfully!');
console.log(`  Source: ${path.basename(dataFile)}`);
