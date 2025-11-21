export interface DictionaryEntry {
  word: string;
  gender: 'der' | 'die' | 'das' | '';
  translation: string;
  definition: string;
  exampleSentenceGerman: string;
  exampleSentenceEnglish: string;
  difficulty?: string;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isAudioPlaying?: boolean;
  correction?: string; // If the model corrects the user
}

export enum AppView {
  HOME = 'HOME',
  DICTIONARY = 'DICTIONARY',
  CHAT = 'CHAT',
  WRITING = 'WRITING'
}