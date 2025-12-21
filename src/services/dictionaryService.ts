// Mock dictionary service for fast-fallback functionality
import { DictionaryEntry } from '@/types';

const RANDOM_WORDS: Record<string, string[]> = {
  A1: ["Haus", "Buch", "Wasser"],
  A2: ["laufen", "bringen", "später"],
  B1: ["behandeln", "erreichen", "Verantwortung"],
};

export async function fetchWordOfTheDay(level: string): Promise<DictionaryEntry> {
  const list = RANDOM_WORDS[level] || RANDOM_WORDS.A2;
  const word = list[Math.floor(Math.random() * list.length)];
  
  // Return mock data that matches the unified DictionaryEntry interface
  return {
    word,
    translation: `Translation of ${word}`,  // Required field
    gender: 'das' as const,
    definition: `Definition of ${word}`,
    exampleSentenceGerman: `Ich sehe ${word}.`,
    exampleSentenceEnglish: `I see ${word}.`,
    difficulty: level,
    // Backward compatibility fields
    level,
    article: 'das',
    plural: word + "e",
    examples: [`Ich sehe ${word}.`, `${word} ist wichtig.`],
  };
}

