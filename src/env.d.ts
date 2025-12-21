interface ImportMetaEnv {
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_PREFERRED_AI_PROVIDER?: string;
  readonly VITE_DICTIONARY_API_BASE?: string;
  // add other env vars you rely on here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
