/**
 * Extract vocabulary from Goethe-Zertifikat B1 Wortliste PDF
 * 
 * This script helps you manually convert PDF data to JSON format.
 * 
 * Instructions:
 * 1. Open the PDF and copy the word list
 * 2. Paste into a text file: data/goethe-b1-raw.txt
 * 3. Format should be one word per line
 * 4. Run this script to generate structured JSON
 */

import * as fs from 'fs';
import * as path from 'path';

interface RawVocabEntry {
  word: string;
  example?: string;
}

/**
 * Parse raw text from PDF
 * Expected format variations:
 * - Just words
 * - Words with examples
 */
function parseRawText(text: string): RawVocabEntry[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const entries: RawVocabEntry[] = [];
  
  let currentWord: string | null = null;
  let currentExample: string | null = null;
  
  for (const line of lines) {
    // Skip headers, page numbers, etc
    if (line.match(/^(Seite|Page|\d+)$/i)) continue;
    if (line.match(/^Goethe-Zertifikat/i)) continue;
    
    // Check if line looks like an example (starts with lowercase or contains punctuation)
    const looksLikeExample = line.match(/^[a-zäöü]/) || line.includes(',') || line.includes('.');
    
    if (!looksLikeExample && line.length > 1) {
      // This is a new word
      if (currentWord) {
        entries.push({
          word: currentWord,
          example: currentExample || undefined
        });
      }
      currentWord = line;
      currentExample = null;
    } else if (currentWord && looksLikeExample) {
      // This is an example for the current word
      currentExample = line;
    }
  }
  
  // Don't forget the last entry
  if (currentWord) {
    entries.push({
      word: currentWord,
      example: currentExample || undefined
    });
  }
  
  return entries;
}

async function main() {
  const inputPath = path.resolve(__dirname, '../data/goethe-b1-raw.txt');
  
  if (!fs.existsSync(inputPath)) {
    console.log('📋 Please create data/goethe-b1-raw.txt with content from the PDF');
    console.log('   One word per line, with optional example sentences');
    console.log('   Then run this script again.');
    
    // Create sample file
    const sampleContent = `ab
Ich fahre ab 8 Uhr.
aber
Das ist teuer, aber gut.
abhängen
Das hängt vom Wetter ab.`;
    
    fs.writeFileSync(inputPath, sampleContent);
    console.log(`\n✓ Created sample file at ${inputPath}`);
    console.log('   Replace with actual PDF content and run again.');
    return;
  }
  
  const rawText = fs.readFileSync(inputPath, 'utf-8');
  const entries = parseRawText(rawText);
  
  console.log(`✓ Parsed ${entries.length} vocabulary entries`);
  
  // Save as structured JSON (without meanings yet)
  const outputPath = path.resolve(__dirname, '../data/goethe-b1-extracted.json');
  const output = {
    level: 'B1',
    source: 'Goethe-Zertifikat B1 Wortliste',
    words: entries.map(e => ({
      word: e.word,
      example_sentence: e.example,
      level: 'B1',
      // meaning_en will be generated later
    }))
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✓ Saved to ${outputPath}`);
  console.log(`\nNext step: Run generate-meanings.ts to add English meanings`);
}

main().catch(console.error);
