/**
 * Vitest setup file
 * Runs before all tests
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window object if needed
if (typeof window !== 'undefined') {
  // Add any global window mocks here
}

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    DEV: true,
    PROD: false,
    VITE_DICTIONARY_API_BASE: 'http://localhost:3000',
  },
  writable: true,
});

