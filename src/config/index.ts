/**
 * Client Configuration Module
 * 
 * Centralized configuration management for the frontend.
 * Provides typed configuration object with defaults.
 */

export interface ClientConfig {
  serverApiBase: string;
  preferredAiProvider: 'deepseek' | 'gemini';
}

/**
 * Get client configuration from environment variables
 * 
 * Provides defaults where appropriate.
 */
function loadConfig(): ClientConfig {
  const serverApiBase = import.meta.env.VITE_DICTIONARY_API_BASE || '';
  const preferredAiProvider = (import.meta.env.VITE_PREFERRED_AI_PROVIDER || 'deepseek') as 'deepseek' | 'gemini';

  return {
    serverApiBase,
    preferredAiProvider,
  };
}

// Load and export configuration
// This will be executed when the module is first imported
export const config = loadConfig();

