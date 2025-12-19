/**
 * Frontend Error Handler Unit Tests
 * Tests for frontend error handling utilities
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  fetchWithErrorHandling,
  logError,
  getUserFriendlyMessage,
  isNetworkError,
  isServerError,
  isValidationError,
} from '../../utils/errorHandler';
import { AppError, ErrorCode } from '../../utils/errors';

// Mock fetch globally
global.fetch = vi.fn();

describe('fetchWithErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful responses', () => {
    it('should return parsed JSON data for successful requests', async () => {
      const mockData = { success: true, data: { id: 1, name: 'Test' } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (key: string) => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockData,
      });

      const result = await fetchWithErrorHandling('/api/test');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/test', undefined);
    });

    it('should handle non-JSON responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (key: string) => (key === 'content-type' ? 'text/plain' : null),
        },
        text: async () => 'Plain text response',
      });

      const result = await fetchWithErrorHandling('/api/test');

      expect(result).toEqual({ message: 'Plain text response' });
    });

    it('should handle empty responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: {
          get: (key: string) => null,
        },
        text: async () => '',
      });

      const result = await fetchWithErrorHandling('/api/test');

      expect(result).toEqual({ message: '' });
    });
  });

  describe('error responses', () => {
    it('should throw AppError for backend error responses', async () => {
      const errorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: (key: string) => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => errorResponse,
      });

      try {
        await fetchWithErrorHandling('/api/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        if (error instanceof AppError) {
          expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
          expect(error.userMessage).toBe('Invalid input');
        }
      }
    });

    it('should throw AppError for non-ok responses without standard format', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (key: string) => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => ({ message: 'Server error' }),
      });

      try {
        await fetchWithErrorHandling('/api/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        if (error instanceof AppError) {
          expect(error.code).toBe(ErrorCode.SERVER_ERROR);
        }
      }
    });

    it('should handle success: false even with 200 status', async () => {
      const errorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (key: string) => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => errorResponse,
      });

      await expect(fetchWithErrorHandling('/api/test')).rejects.toThrow(AppError);
    });
  });

  describe('network errors', () => {
    it('should handle network errors (fetch failed)', async () => {
      const networkError = new TypeError('Failed to fetch');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      try {
        await fetchWithErrorHandling('/api/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        if (error instanceof AppError) {
          expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
          expect(error.userMessage).toContain('connect');
        }
      }
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      (global.fetch as any).mockRejectedValueOnce(genericError);

      await expect(fetchWithErrorHandling('/api/test')).rejects.toThrow(AppError);

      try {
        await fetchWithErrorHandling('/api/test');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        if (error instanceof AppError) {
          expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
        }
      }
    });

    it('should handle non-Error objects', async () => {
      (global.fetch as any).mockRejectedValueOnce('String error');

      await expect(fetchWithErrorHandling('/api/test')).rejects.toThrow(AppError);

      try {
        await fetchWithErrorHandling('/api/test');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        if (error instanceof AppError) {
          expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
        }
      }
    });
  });

  describe('request options', () => {
    it('should pass request options to fetch', async () => {
      const mockData = { success: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (key: string) => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockData,
      });

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      };

      await fetchWithErrorHandling('/api/test', options);

      expect(global.fetch).toHaveBeenCalledWith('/api/test', options);
    });
  });
});

describe('logError', () => {
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log AppError as warning', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error');
    logError(error);

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should log non-AppError as error', () => {
    const error = new Error('Regular error');
    logError(error);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should include context in log', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error');
    const context = { userId: 123, action: 'login' };

    logError(error, context);

    expect(consoleWarnSpy).toHaveBeenCalled();
    const logCall = consoleWarnSpy.mock.calls[0];
    expect(logCall[1]).toHaveProperty('context', context);
  });

  it('should include error details for AppError', () => {
    const error = new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Test error',
      undefined,
      'User message',
      'BACKEND_ERROR_CODE',
      { field: 'email' }
    );

    logError(error);

    expect(consoleWarnSpy).toHaveBeenCalled();
    const logCall = consoleWarnSpy.mock.calls[0];
    const logData = logCall[1];
    expect(logData.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(logData.error.backendErrorCode).toBe('BACKEND_ERROR_CODE');
    expect(logData.error.backendDetails).toEqual({ field: 'email' });
  });
});

describe('getUserFriendlyMessage', () => {
  it('should return userMessage for AppError', () => {
    const error = new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Technical message',
      undefined,
      'User-friendly message'
    );

    expect(getUserFriendlyMessage(error)).toBe('User-friendly message');
  });

  it('should return message for AppError without userMessage (defaults to message)', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Error message');

    // userMessage defaults to message if not provided
    expect(getUserFriendlyMessage(error)).toBe('Error message');
  });

  it('should return message for regular Error', () => {
    const error = new Error('Regular error message');

    expect(getUserFriendlyMessage(error)).toBe('Regular error message');
  });

  it('should return default message for Error without message', () => {
    const error = new Error();

    expect(getUserFriendlyMessage(error)).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('Error type checkers', () => {
  describe('isNetworkError', () => {
    it('should return true for network errors', () => {
      const error = new AppError(ErrorCode.NETWORK_ERROR, 'Network error');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for non-network errors', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Validation error');
      expect(isNetworkError(error)).toBe(false);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for server errors', () => {
      const error = new AppError(ErrorCode.SERVER_ERROR, 'Server error');
      expect(isServerError(error)).toBe(true);
    });

    it('should return false for non-server errors', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Validation error');
      expect(isServerError(error)).toBe(false);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isServerError(error)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for validation errors', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Validation error');
      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for non-validation errors', () => {
      const error = new AppError(ErrorCode.SERVER_ERROR, 'Server error');
      expect(isValidationError(error)).toBe(false);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isValidationError(error)).toBe(false);
    });
  });
});

