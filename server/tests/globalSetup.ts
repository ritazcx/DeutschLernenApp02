/**
 * Jest Global Setup
 * 在所有测试之前执行，用于启动 spaCy 服务
 */

// We need to dynamically import and configure the spaCy service
// The SpacyService class is in src, so we need to ensure it's available

export default async function globalSetup() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       Global Setup: Initializing spaCy Service        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Import compiled version - require as CommonJS module
    // When running from dist/tests/globalSetup.js, path is ../src/services/nlpEngine/spacyService
    // (because TypeScript compiles src/ to dist/src/)
    const spacyServiceModule = require('../src/services/nlpEngine/spacyService');
    const SpacyService = spacyServiceModule.SpacyService;
    
    if (!SpacyService) {
      const availableExports = Object.keys(spacyServiceModule);
      throw new Error(`SpacyService class not found in module. Available exports: ${availableExports.join(', ')}`);
    }
    
    const spacyService = new SpacyService();
    
    // Wait for service to be ready with timeout
    const maxWaitTime = 60000; // 60 seconds
    const startTime = Date.now();
    
    let lastStatus = '';
    while (!spacyService.isReady()) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error(`spaCy service did not become ready within ${maxWaitTime / 1000} seconds`);
      }
      
      const currentStatus = spacyService.isReady() ? 'ready' : 'initializing';
      if (currentStatus !== lastStatus) {
        lastStatus = currentStatus;
        console.log(`[Setup] Current status: ${currentStatus}`);
      }
      
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const elapsedTime = Date.now() - startTime;
    console.log(`✓ spaCy service initialized successfully in ${elapsedTime}ms\n`);
    
    // Store service instance in global scope for tests to access
    (global as any).__SPACY_SERVICE__ = spacyService;
    
    return;
  } catch (error) {
    console.error(`✗ Failed to initialize spaCy service:`, error);
    process.exit(1);
  }
}
