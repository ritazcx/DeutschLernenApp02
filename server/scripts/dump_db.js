#!/usr/bin/env node
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '../data/dictionary.db');
try {
  const db = new Database(dbPath, { readonly: true });
  const rows = db.prepare('SELECT word, gender, translation, definition, example_german, example_english, difficulty, image_url, created_at FROM dictionary ORDER BY created_at DESC LIMIT 500').all();
  // Convert created_at (ms) to ISO strings
  const out = rows.map(r => ({
    ...r,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
  }));
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
} catch (err) {
  console.error('Failed to open or read database at', dbPath);
  console.error(err && err.message ? err.message : err);
  process.exit(2);
}
