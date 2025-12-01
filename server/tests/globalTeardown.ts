/**
 * Jest Global Teardown
 * 在所有测试之后执行，用于关闭 spaCy 服务
 */

export default async function globalTeardown() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║      Global Teardown: Shutting down spaCy Service     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    const spacyService = (global as any).__SPACY_SERVICE__;
    
    if (spacyService && typeof spacyService.shutdown === 'function') {
      await spacyService.shutdown();
      console.log('✓ spaCy service shut down successfully\n');
    } else {
      console.warn('⚠ spaCy service instance not found or shutdown method not available');
    }
  } catch (error) {
    console.error(`✗ Error during spaCy service shutdown:`, error);
    // Don't exit with error here, as tests may have already run
  }
}
