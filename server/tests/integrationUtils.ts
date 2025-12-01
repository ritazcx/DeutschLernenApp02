/**
 * Test Integration Utilities
 * Provides access to shared spaCy service for integration tests
 */

import { NLPEngine } from '../src/services/nlpEngine';

/**
 * Get or create NLP engine for integration tests
 * Uses globally managed spaCy service instead of creating new one
 */
export function getNLPEngineForIntegrationTests(): NLPEngine {
  // In integration tests, spaCy service is managed globally
  // NLPEngine will use the singleton instance
  return new NLPEngine();
}

/**
 * Check if spaCy service is ready
 */
export function isSpacyServiceReady(): boolean {
  const service = (global as any).__SPACY_SERVICE__;
  return service && typeof service.isReady === 'function' && service.isReady();
}

/**
 * Get the global spaCy service instance
 */
export function getGlobalSpacyService() {
  return (global as any).__SPACY_SERVICE__;
}

/**
 * Skip tests if spaCy is not available
 */
export function skipIfNoSpacy() {
  if (!isSpacyServiceReady()) {
    console.warn('⚠️ spaCy service not ready, skipping test');
    return true;
  }
  return false;
}
