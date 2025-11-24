import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.resolve(dataDir, 'dictionary.db');
const db = new Database(dbPath);

// Create table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS dictionary (
    word TEXT PRIMARY KEY,
    gender TEXT,
    translation TEXT,
    definition TEXT,
    example_german TEXT,
    example_english TEXT,
    difficulty TEXT,
    image_url TEXT,
    created_at INTEGER
  )
`).run();

export function findWord(word: string) {
  const row = db.prepare('SELECT * FROM dictionary WHERE lower(word)=lower(?)').get(word);
  return row || null;
}

export function upsertWord(entry: any) {
  const stmt = db.prepare(`
    INSERT INTO dictionary (word, gender, translation, definition, example_german, example_english, difficulty, image_url, created_at)
    VALUES (@word, @gender, @translation, @definition, @example_german, @example_english, @difficulty, @image_url, @created_at)
    ON CONFLICT(word) DO UPDATE SET
      gender=excluded.gender,
      translation=excluded.translation,
      definition=excluded.definition,
      example_german=excluded.example_german,
      example_english=excluded.example_english,
      difficulty=excluded.difficulty,
      image_url=excluded.image_url,
      created_at=excluded.created_at
  `);
  return stmt.run({
    ...entry,
    created_at: Date.now(),
  });
}

export default db;
