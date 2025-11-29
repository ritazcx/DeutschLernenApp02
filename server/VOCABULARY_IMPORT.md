# B1 Vocabulary Import Guide

## 📋 Overview
This guide helps you import the complete Goethe-Zertifikat B1 Wortliste into the database.

## 🔄 Workflow

### Step 1: Extract from PDF
1. Open your Goethe-Zertifikat B1 Wortliste PDF
2. Copy the word list content
3. Paste into `server/data/goethe-b1-raw.txt`
   - One word per line
   - Example sentences on the following line (optional)
4. Run the extraction script:
   ```bash
   cd server
   npx ts-node scripts/extract-from-pdf.ts
   ```
5. This creates `server/data/goethe-b1-extracted.json`

### Step 2: Generate English Meanings
1. Make sure your DEEPSEEK_API_KEY is set in `.env`
2. Run the meaning generation script:
   ```bash
   npx ts-node scripts/generate-meanings.ts
   ```
3. This processes words in batches of 30
4. Progress is saved to `b1-vocabulary-progress.json`
5. Final output: `server/data/b1-vocabulary-complete.json`

### Step 3: Import to Database
1. Run the import script:
   ```bash
   npx ts-node scripts/import-vocabulary.ts
   ```
2. This loads all vocabulary into SQLite
3. The script automatically uses the complete vocabulary if available

## 📊 Data Structure

### Input Format (goethe-b1-raw.txt)
```
ab
Ich fahre ab 8 Uhr.
aber
Das ist teuer, aber gut.
abhängen
Das hängt vom Wetter ab.
```

### Extracted Format (goethe-b1-extracted.json)
```json
{
  "level": "B1",
  "source": "Goethe-Zertifikat B1 Wortliste",
  "words": [
    {
      "word": "ab",
      "example_sentence": "Ich fahre ab 8 Uhr.",
      "level": "B1"
    }
  ]
}
```

### Complete Format (b1-vocabulary-complete.json)
```json
{
  "level": "B1",
  "source": "Goethe-Zertifikat B1 Wortliste",
  "word_count": 650,
  "words": [
    {
      "word": "ab",
      "level": "B1",
      "pos": "preposition",
      "meaning_en": "from, starting from",
      "example_sentence": "Ich fahre ab 8 Uhr."
    }
  ]
}
```

## 🗄️ Database Schema

```sql
CREATE TABLE vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL,
  pos TEXT,
  meaning_en TEXT,
  meaning_zh TEXT,
  example_sentence TEXT,
  created_at INTEGER
);
```

## 🎯 Features

- **No Chinese translations**: Only English meanings are generated (saves API calls)
- **Example sentences**: Preserved from official Goethe word list
- **Batch processing**: Processes 30 words at a time with rate limiting
- **Progress saving**: Can resume if interrupted
- **Smart fallback**: Automatically uses best available data source

## 💡 Tips

1. **PDF Extraction**: Use a PDF reader that preserves formatting when copying
2. **Manual Cleanup**: You may need to manually fix formatting issues in the raw text
3. **API Costs**: ~650 words = ~22 batches = ~22 API calls
4. **Time**: Full processing takes ~2-3 minutes with rate limiting
5. **Backup**: The script saves progress, so you can stop and resume

## 🚀 Quick Start

If you have the PDF ready:

```bash
cd server

# 1. Paste PDF content into data/goethe-b1-raw.txt
# 2. Then run all three steps:

npx ts-node scripts/extract-from-pdf.ts
npx ts-node scripts/generate-meanings.ts
npx ts-node scripts/import-vocabulary.ts
```

Done! Your complete B1 vocabulary is now in the database.
