import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.resolve(dataDir, 'dictionary.db');
const db = new Database(dbPath);

// Create tables for persisted analyses
db.prepare(`
  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    title TEXT,
    source TEXT,
    text TEXT,
    word_count INTEGER,
    created_at INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS sentences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT,
    idx INTEGER,
    sentence_text TEXT,
    translation TEXT,
    FOREIGN KEY(analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS grammar_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT,
    sentence_idx INTEGER,
    type TEXT,
    text TEXT,
    explanation TEXT,
    pos_start INTEGER,
    pos_end INTEGER,
    FOREIGN KEY(analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
  )
`).run();

// Create vocabulary table for CEFR-graded words
db.prepare(`
  CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL,
    pos TEXT,
    article TEXT,
    plural TEXT,
    conjugation_present TEXT,
    conjugation_past TEXT,
    conjugation_perfect TEXT,
    meaning_en TEXT,
    meaning_zh TEXT,
    example_sentences TEXT,
    created_at INTEGER
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON vocabulary(word)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_vocabulary_level ON vocabulary(level)`).run();

// Create phrases table for common expressions
db.prepare(`
  CREATE TABLE IF NOT EXISTS phrases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phrase TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL,
    meaning_en TEXT,
    meaning_zh TEXT,
    created_at INTEGER
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_phrases_phrase ON phrases(phrase)`).run();

// ----- Persistence for analyses -----
export function saveAnalysis(analysis: any) {
  const insertAnalysis = db.prepare(`
    INSERT INTO analyses (id, title, source, text, word_count, created_at)
    VALUES (@id, @title, @source, @text, @word_count, @created_at)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      source=excluded.source,
      text=excluded.text,
      word_count=excluded.word_count,
      created_at=excluded.created_at
  `);

  const insertSentence = db.prepare(`
    INSERT INTO sentences (analysis_id, idx, sentence_text, translation)
    VALUES (@analysis_id, @idx, @sentence_text, @translation)
  `);

  const insertPoint = db.prepare(`
    INSERT INTO grammar_points (analysis_id, sentence_idx, type, text, explanation, pos_start, pos_end)
    VALUES (@analysis_id, @sentence_idx, @type, @text, @explanation, @pos_start, @pos_end)
  `);

  const tx = db.transaction((a: any) => {
    insertAnalysis.run({
      id: a.id,
      title: a.title || null,
      source: a.source || null,
      text: a.text || null,
      word_count: a.word_count || null,
      created_at: Date.now(),
    });

    // delete existing sentences/points for id to simplify updates
    db.prepare('DELETE FROM sentences WHERE analysis_id = ?').run(a.id);
    db.prepare('DELETE FROM grammar_points WHERE analysis_id = ?').run(a.id);

    (a.sentences || []).forEach((s: any, idx: number) => {
      insertSentence.run({
        analysis_id: a.id,
        idx,
        sentence_text: s.sentence || s.sentence_text || '',
        translation: s.translation || null,
      });

      (s.grammarPoints || []).forEach((p: any) => {
        const start = p.position && typeof p.position.start === 'number' ? p.position.start : (p.pos_start ?? null);
        const end = p.position && typeof p.position.end === 'number' ? p.position.end : (p.pos_end ?? null);
        insertPoint.run({
          analysis_id: a.id,
          sentence_idx: idx,
          type: p.type || null,
          text: p.text || null,
          explanation: p.explanation || null,
          pos_start: start,
          pos_end: end,
        });
      });
    });
  });

  tx(analysis);
  return { id: analysis.id };
}

export function listAnalyses(limit = 20, offset = 0) {
  const rows = db.prepare(`SELECT id, title, source, word_count, created_at FROM analyses ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
  return rows;
}

export function getAnalysisById(id: string) {
  const a: any = db.prepare('SELECT * FROM analyses WHERE id = ?').get(id);
  if (!a) return null;
  const sentences = db.prepare('SELECT idx, sentence_text, translation FROM sentences WHERE analysis_id = ? ORDER BY idx ASC').all(id);
  const points = db.prepare('SELECT sentence_idx, type, text, explanation, pos_start, pos_end FROM grammar_points WHERE analysis_id = ? ORDER BY id ASC').all(id);

  // attach points to sentences
  const sentencesWithPoints = sentences.map((s: any, idx: number) => ({
    sentence: s.sentence_text,
    translation: s.translation,
    grammarPoints: points.filter((p: any) => p.sentence_idx === idx).map((p: any) => ({
      type: p.type,
      text: p.text,
      explanation: p.explanation,
      position: p.pos_start != null && p.pos_end != null ? { start: p.pos_start, end: p.pos_end } : null,
    })),
  }));

  return {
    id: a.id,
    title: a.title,
    source: a.source,
    text: a.text,
    word_count: a.word_count,
    created_at: a.created_at,
    sentences: sentencesWithPoints,
  };
}

export function deleteAnalysis(id: string) {
  const info = db.prepare('DELETE FROM analyses WHERE id = ?').run(id);
  // cascade should remove sentences and points; return changes
  return info.changes > 0;
}

// ----- Vocabulary functions -----
export function findVocabulary(word: string) {
  const row = db.prepare('SELECT * FROM vocabulary WHERE LOWER(word) = LOWER(?)').get(word);
  return row || null;
}

export function findVocabularyByLevel(level: string) {
  const rows = db.prepare('SELECT * FROM vocabulary WHERE level = ?').all(level);
  return rows;
}

export function findVocabularyInList(words: string[], levels?: string[]) {
  if (words.length === 0) return [];
  
  const placeholders = words.map(() => '?').join(',');
  let query = `SELECT * FROM vocabulary WHERE LOWER(word) IN (${placeholders})`;
  let params: any[] = words.map(w => w.toLowerCase());
  
  if (levels && levels.length > 0) {
    const levelPlaceholders = levels.map(() => '?').join(',');
    query += ` AND level IN (${levelPlaceholders})`;
    params = [...params, ...levels];
  }
  
  return db.prepare(query).all(...params);
}

export function upsertVocabulary(entry: any) {
  const stmt = db.prepare(`
    INSERT INTO vocabulary (word, level, pos, article, plural, conjugation_present, conjugation_past, conjugation_perfect, meaning_en, meaning_de, example_de, example_en, created_at)
    VALUES (@word, @level, @pos, @article, @plural, @conjugation_present, @conjugation_past, @conjugation_perfect, @meaning_en, @meaning_de, @example_de, @example_en, @created_at)
    ON CONFLICT(word) DO UPDATE SET
      level=excluded.level,
      pos=excluded.pos,
      article=excluded.article,
      plural=excluded.plural,
      conjugation_present=excluded.conjugation_present,
      conjugation_past=excluded.conjugation_past,
      conjugation_perfect=excluded.conjugation_perfect,
      meaning_en=excluded.meaning_en,
      meaning_de=excluded.meaning_de,
      example_de=excluded.example_de,
      example_en=excluded.example_en,
      created_at=excluded.created_at
  `);
  
  // Prepare data with only columns that exist
  const data = {
    word: entry.word,
    level: entry.level || 'B1',
    pos: entry.pos || null,
    article: entry.article || null,
    plural: entry.plural || null,
    conjugation_present: entry.conjugations?.present || entry.conjugation_present || null,
    conjugation_past: entry.conjugations?.past || entry.conjugation_past || null,
    conjugation_perfect: entry.conjugations?.perfect || entry.conjugation_perfect || null,
    meaning_en: entry.meaning_en || '',
    meaning_de: entry.meaning_de || '',
    example_de: entry.example_de || '',
    example_en: entry.example_en || '',
    created_at: Date.now(),
  };
  
  return stmt.run(data);
}

export function importVocabularyBatch(entries: any[]) {
  const tx = db.transaction((items: any[]) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO vocabulary (word, level, pos, article, plural, conjugation_present, conjugation_past, conjugation_perfect, meaning_en, meaning_de, meaning_zh, example_de, example_en, example_sentences, created_at)
      VALUES (@word, @level, @pos, @article, @plural, @conjugation_present, @conjugation_past, @conjugation_perfect, @meaning_en, @meaning_de, @meaning_zh, @example_de, @example_en, @example_sentences, @created_at)
    `);
    for (const entry of items) {
      const data = {
        word: entry.word,
        level: entry.level || 'B1',
        pos: entry.pos || null,
        article: entry.article || null,
        plural: entry.plural || null,
        conjugation_present: entry.conjugations?.present || null,
        conjugation_past: entry.conjugations?.past || null,
        conjugation_perfect: entry.conjugations?.perfect || null,
        meaning_en: entry.meaning_en || null,
        meaning_de: entry.meaning_de || null,
        meaning_zh: entry.meaning_zh || null,
        example_de: entry.example_de || null,
        example_en: entry.example_en || null,
        example_sentences: entry.example_sentences ? JSON.stringify(entry.example_sentences) : null,
        created_at: Date.now(),
      };
      stmt.run(data);
    }
  });
  tx(entries);
}

export default db;
