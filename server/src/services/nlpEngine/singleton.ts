/**
 * NLPEngine Singleton
 * 
 * Ensures only one NLPEngine instance exists across the application.
 * This prevents duplicate spaCy model loading, which saves significant memory (~200MB+).
 * 
 * Usage:
 *   import { getNLPEngine } from './nlpEngine/singleton';
 *   const nlp = getNLPEngine();
 */

import { NLPEngine } from './index';

let instance: NLPEngine | null = null;

/**
 * Get the singleton NLPEngine instance
 * Creates the instance on first call, returns cached instance on subsequent calls
 */
export function getNLPEngine(): NLPEngine {
  if (!instance) {
    console.log('Initializing NLPEngine singleton...');
    instance = new NLPEngine();
    console.log('NLPEngine singleton initialized successfully');
  }
  return instance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetNLPEngine(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}
