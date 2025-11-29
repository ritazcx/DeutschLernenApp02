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
  const a = db.prepare('SELECT * FROM analyses WHERE id = ?').get(id);
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

export default db;
