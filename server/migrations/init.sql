-- Initial migration: dictionary table
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
);
