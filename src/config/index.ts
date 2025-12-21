/**
 * Client Configuration Module
 * 
 * Centralized configuration management for the frontend.
 * Provides typed configuration object with defaults.
 */

export interface ClientConfig {
  serverApiBase: string;
  preferredAiProvider: 'deepseek';
}

/**
 * Get client configuration from environment variables
 * 
 * Provides defaults where appropriate.
 */
function loadConfig(): ClientConfig {
  const serverApiBase = import.meta.env.VITE_DICTIONARY_API_BASE || '';
  const preferredAiProvider = 'deepseek' as const;

  return {
    serverApiBase,
    preferredAiProvider,
  };
}

// Load and export configuration
// This will be executed when the module is first imported
export const config = loadConfig();

