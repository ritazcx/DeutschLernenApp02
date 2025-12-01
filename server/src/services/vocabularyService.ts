import { findVocabulary, findVocabularyInList } from '../db';

export interface VocabularyPoint {
  word: string;
  level: string;
  pos?: string;
  meaning_en?: string;
  meaning_zh?: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Tokenize German text into words
 * Simple implementation for MVP - splits on whitespace and punctuation
 */
function tokenize(text: string): Array<{ word: string; start: number; end: number }> {
  const tokens: Array<{ word: string; start: number; end: number }> = [];
  // Match word characters (including German umlauts and ß)
  const regex = /[a-zA-ZäöüÄÖÜß]+/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  return tokens;
}

/**
 * Find vocabulary words in a sentence
 * For MVP: exact match (case-insensitive), no lemmatization
 */
export function findVocabularyInSentence(
  sentence: string,
  levels: string[] = ['B1']
): VocabularyPoint[] {
  const tokens = tokenize(sentence);
  if (tokens.length === 0) return [];
  
  // Extract unique words
  const uniqueWords = Array.from(new Set(tokens.map(t => t.word)));
  
  // Query database
  const vocabEntries: any[] = findVocabularyInList(uniqueWords, levels);
  
  // Create a map for quick lookup
  const vocabMap = new Map();
  vocabEntries.forEach(entry => {
    vocabMap.set(entry.word.toLowerCase(), entry);
  });
  
  // Match tokens with vocabulary
  const points: VocabularyPoint[] = [];
  tokens.forEach(token => {
    const entry = vocabMap.get(token.word.toLowerCase());
    if (entry) {
      points.push({
        word: entry.word,
        level: entry.level,
        pos: entry.pos,
        meaning_en: entry.meaning_en,
        meaning_zh: entry.meaning_zh,
        startIndex: token.start,
        endIndex: token.end,
      });
    }
  });
  
  return points;
}

/**
 * Lookup a single word in the vocabulary database
 */
export function lookupWord(word: string) {
  return findVocabulary(word);
}
