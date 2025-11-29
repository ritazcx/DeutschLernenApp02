import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

interface VocabEntry {
  word: string;
  level: string;
  pos: 'noun' | 'verb' | 'adjective' | 'expression';
  article?: string;
  plural?: string;
  examples?: string[];
}

const db = new Database(path.join(__dirname, '../data/dictionary.db'));

function parseB2Vocabulary(filePath: string): VocabEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const entries: VocabEntry[] = [];
  const seenWords = new Set<string>();
  
  let currentEntry: VocabEntry | null = null;
  let inExamplesSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines, page markers, headers
    if (!line || 
        line.startsWith('---') || 
        line.startsWith('Wortliste') ||
        line.startsWith('Akademie') ||
        line.startsWith('KAPITEL') ||
        line.startsWith('MEINE ') ||
        line.startsWith('Informationen')) {
      continue;
    }
    
    // Check for BEISPIELSÄTZE section marker
    if (line === 'BEISPIELSÄTZE') {
      inExamplesSection = true;
      continue;
    }
    
    // New chapter starts - reset examples section
    if (line.match(/^[A-ZÄÖÜ\s]+$/)) {
      inExamplesSection = false;
      continue;
    }
    
    // If we're in the examples section, look for vocabulary entries
    if (inExamplesSection) {
      // Pattern 1: Nouns with articles and plural (e.g., "die Abgabe, -n")
      const nounMatch = line.match(/^(der|die|das)\s+([A-ZÄÖÜ][a-zäöüß-]+),\s*([^\s]+|\/)\s*$/);
      if (nounMatch) {
        // Save previous entry if exists
        if (currentEntry && !seenWords.has(currentEntry.word)) {
          entries.push(currentEntry);
          seenWords.add(currentEntry.word);
        }
        
        currentEntry = {
          word: nounMatch[2],
          level: 'B2',
          pos: 'noun',
          article: nounMatch[1],
          plural: nounMatch[3] === '/' ? '' : nounMatch[3],
          examples: []
        };
        continue;
      }
      
      // Pattern 2: Verbs with separable prefix (e.g., "ab|lenken von")
      const separableVerbMatch = line.match(/^([a-zäöü]+)\|([a-zäöü]+)(\s+.*)?$/);
      if (separableVerbMatch) {
        if (currentEntry && !seenWords.has(currentEntry.word)) {
          entries.push(currentEntry);
          seenWords.add(currentEntry.word);
        }
        
        const verb = separableVerbMatch[1] + separableVerbMatch[2];
        currentEntry = {
          word: verb,
          level: 'B2',
          pos: 'verb',
          examples: []
        };
        continue;
      }
      
      // Pattern 3: Verbs with vowel changes (e.g., "an|sehen, [egie] als + A")
      const vowelChangeVerbMatch = line.match(/^([a-zäöü]+)\|([a-zäöü]+),\s*\[([^\]]+)\]/);
      if (vowelChangeVerbMatch) {
        if (currentEntry && !seenWords.has(currentEntry.word)) {
          entries.push(currentEntry);
          seenWords.add(currentEntry.word);
        }
        
        const verb = vowelChangeVerbMatch[1] + vowelChangeVerbMatch[2];
        currentEntry = {
          word: verb,
          level: 'B2',
          pos: 'verb',
          examples: []
        };
        continue;
      }
      
      // Pattern 4: Regular verbs (lowercase word at start)
      const regularVerbMatch = line.match(/^([a-zäöü]{4,})(,|\s|$)/);
      if (regularVerbMatch) {
        const word = regularVerbMatch[1];
        // Filter out common words and particles
        if (!['sich', 'sein', 'haben', 'werden', 'wenn', 'dann', 'aber', 'oder', 'und', 'dass', 'für', 'mit', 'von', 'bei', 'nach', 'über'].includes(word)) {
          if (currentEntry && !seenWords.has(currentEntry.word)) {
            entries.push(currentEntry);
            seenWords.add(currentEntry.word);
          }
          
          currentEntry = {
            word: word,
            level: 'B2',
            pos: 'verb',
            examples: []
          };
          continue;
        }
      }
      
      // Pattern 5: Adjectives (lowercase word before sentence or description)
      const adjectiveMatch = line.match(/^([a-zäöü-]+)$/);
      if (adjectiveMatch) {
        const word = adjectiveMatch[1];
        if (word.length >= 5 && !['diese', 'jener', 'solche', 'welche', 'meine', 'deine', 'seine', 'unsere', 'gegen', 'durch'].includes(word)) {
          if (currentEntry && !seenWords.has(currentEntry.word)) {
            entries.push(currentEntry);
            seenWords.add(currentEntry.word);
          }
          
          currentEntry = {
            word: word,
            level: 'B2',
            pos: 'adjective',
            examples: []
          };
          continue;
        }
      }
      
      // Pattern 6: Multi-word expressions
      const expressionMatch = line.match(/^(von .+ sein|zu .+ kommen|in .+ stehen|[a-zäöü-]+\|[a-zäöü-]+,\s+\[.+\].*)/);
      if (expressionMatch) {
        if (currentEntry && !seenWords.has(currentEntry.word)) {
          entries.push(currentEntry);
          seenWords.add(currentEntry.word);
        }
        
        currentEntry = {
          word: line,
          level: 'B2',
          pos: 'expression',
          examples: []
        };
        continue;
      }
      
      // If line starts with capital letter, it's likely an example sentence
      if (currentEntry && line[0] === line[0].toUpperCase() && line.length > 10) {
        if (!currentEntry.examples) {
          currentEntry.examples = [];
        }
        currentEntry.examples.push(line);
      }
    }
  }
  
  // Don't forget the last entry
  if (currentEntry && !seenWords.has(currentEntry.word)) {
    entries.push(currentEntry);
  }
  
  return entries;
}

function importVocabularyBatch(entries: VocabEntry[]) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO vocabulary 
    (word, level, pos, article, plural, example_sentences)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((vocabList: VocabEntry[]) => {
    for (const entry of vocabList) {
      insert.run(
        entry.word,
        entry.level,
        entry.pos,
        entry.article || null,
        entry.plural || null,
        entry.examples && entry.examples.length > 0 ? entry.examples.join(' | ') : null
      );
    }
  });
  
  insertMany(entries);
}

// Main execution
console.log('Starting B2 vocabulary parsing from PyMuPDF extracted text...\n');

const inputFile = path.join(__dirname, '../data/b2-raw-text-pymupdf.txt');
const outputFile = path.join(__dirname, '../data/b2-vocabulary-complete.json');

const entries = parseB2Vocabulary(inputFile);

console.log(`✓ Parsed ${entries.length} unique B2 vocabulary entries`);
const byPos = entries.reduce((acc, e) => {
  acc[e.pos] = (acc[e.pos] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
console.log(`  - ${byPos.noun || 0} nouns`);
console.log(`  - ${byPos.verb || 0} verbs`);
console.log(`  - ${byPos.adjective || 0} adjectives`);
console.log(`  - ${byPos.expression || 0} expressions`);

const withExamples = entries.filter(e => e.examples && e.examples.length > 0).length;
console.log(`  - ${withExamples} entries with example sentences`);

// Save to JSON
fs.writeFileSync(outputFile, JSON.stringify(entries, null, 2), 'utf-8');
console.log(`✓ Saved to ${outputFile}`);

// Show samples
console.log('\n--- Sample Nouns (first 10) ---');
entries.filter(e => e.pos === 'noun').slice(0, 10).forEach(e => {
  console.log(`${e.article} ${e.word}`.padEnd(35), e.plural || '');
  if (e.examples && e.examples.length > 0) {
    console.log(`  Example: ${e.examples[0].substring(0, 80)}...`);
  }
});

console.log('\n--- Sample Verbs (first 10) ---');
entries.filter(e => e.pos === 'verb').slice(0, 10).forEach(e => {
  console.log(e.word);
  if (e.examples && e.examples.length > 0) {
    console.log(`  Example: ${e.examples[0].substring(0, 80)}...`);
  }
});

// Import to database
console.log('\n--- Importing into database ---');
importVocabularyBatch(entries);
console.log(`✓ Imported ${entries.length} B2 words into database`);

console.log('\n✅ Done! B2 vocabulary successfully parsed and imported.');
