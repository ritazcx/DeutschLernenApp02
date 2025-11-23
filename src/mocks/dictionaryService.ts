// Moved mock dictionary service from src/services for clarity.
export interface DictionaryEntry {
  word: string;
  level: string;
  article?: string;
  gender?: string;
  plural?: string;
  examples?: string[];
  audioUrl?: string;
}

const RANDOM_WORDS: Record<string, string[]> = {
  A1: ["Haus", "Buch", "Wasser"],
  A2: ["laufen", "bringen", "später"],
  B1: ["behandeln", "erreichen", "Verantwortung"],
};

export async function fetchWordOfTheDay(level: string): Promise<DictionaryEntry> {
  const list = RANDOM_WORDS[level] || RANDOM_WORDS.A2;
  const word = list[Math.floor(Math.random() * list.length)];
  return {
    word,
    level,
    article: "das",
    gender: "n",
    plural: word + "e",
    examples: [`Ich sehe ${word}.`, `${word} ist wichtig.`],
  };
}

export async function searchDictionaryWord(q: string): Promise<DictionaryEntry> {
  return {
    word: q,
    level: "A1",
    article: "die",
    gender: "f",
    plural: q + "en",
    examples: [`Ich suche ${q}.`, `${q} ist ein Wort.`],
  };
}
