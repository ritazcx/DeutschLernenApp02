export interface DictionaryEntry {
  word: string;
  gender?: 'der' | 'die' | 'das' | '';
  translation: string;
  definition?: string;
  exampleSentenceGerman?: string;
  exampleSentenceEnglish?: string;
  difficulty?: string;
  imageUrl?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model' | 'assistant' | 'system';
  text?: string;
  content?: string;
  correction?: string;
}

// Note: `AppView` is defined at project root to preserve existing usage.
export * from "./chat";
export * from "./dictionary";

export enum AppView {
  HOME,
  DICTIONARY,
  CHAT,
  WRITING,
}
