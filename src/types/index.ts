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
