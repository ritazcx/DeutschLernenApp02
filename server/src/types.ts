export interface DictionaryEntry {
  word: string;
  gender?: string;
  translation?: string;
  definition?: string;
  example_german?: string;
  example_english?: string;
  difficulty?: string;
  image_url?: string;
  // Database fields for vocabulary insertion
  level?: string;
  pos?: string | null;
  article?: string | null;
  plural?: string | null;
  meaning_de?: string;
}

