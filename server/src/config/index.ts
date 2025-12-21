/**
 * Server Configuration Module
 * 
 * Centralized configuration management for the server.
 * Validates required environment variables and provides typed configuration object.
 */

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  frontendUrl?: string;
  deepseekApiKey: string;
}

/**
 * Get server configuration from environment variables
 * 
 * Validates required environment variables and provides defaults where appropriate.
 * Throws error if required variables are missing.
 */
function loadConfig(): ServerConfig {
  const port = Number(process.env.PORT || 4000);
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const frontendUrl = process.env.FRONTEND_URL;
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

  // Validate required environment variables
  if (!deepseekApiKey) {
    throw new Error(
      'Missing required environment variable: DEEPSEEK_API_KEY. ' +
      'Please set DEEPSEEK_API_KEY in your environment or .env file.'
    );
  }

  return {
    port,
    nodeEnv,
    frontendUrl,
    deepseekApiKey,
  };
}

// Load and export configuration
// This will be executed when the module is first imported
let cachedConfig: ServerConfig | null = null;

/**
 * Get configuration object
 * In test environment, reads from environment variables each time to support dynamic changes
 * In production, uses cached configuration for performance
 */
function getConfig(): ServerConfig {
  // In test environment, always read from environment variables to support test setup
  if (process.env.NODE_ENV === 'test') {
    return loadConfig();
  }
  
  // In production/development, use cached configuration
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

export const config = new Proxy({} as ServerConfig, {
  get(target, prop: keyof ServerConfig) {
    const currentConfig = getConfig();
    return currentConfig[prop];
  },
});

