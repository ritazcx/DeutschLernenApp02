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
  GRAMMAR,
  SAVED,
}
