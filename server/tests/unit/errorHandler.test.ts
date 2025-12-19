/**
 * Error Handler Unit Tests
 * Tests for AppError class and error helper functions
 */

import {
  AppError,
  ErrorCode,
  createValidationError,
  createNotFoundError,
  createInternalError,
  createDatabaseError,
  createExternalServiceError,
  ErrorResponse,
} from '../../src/utils/errors';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create an AppError with all properties', () => {
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Test error message',
        400,
        { field: 'email' },
        true
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should use default values for optional parameters', () => {
      const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Test error');

      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
      expect(error.isOperational).toBe(true);
    });

    it('should set isOperational to false for programming errors', () => {
      const error = new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Programming error',
        500,
        undefined,
        false
      );

      expect(error.isOperational).toBe(false);
    });
  });

  describe('toResponse', () => {
    it('should convert error to standard response format without details', () => {
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        400,
        { field: 'email' }
      );

      const response = error.toResponse(false);

      expect(response).toEqual({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
        },
      });
      expect(response.error.details).toBeUndefined();
    });

    it('should include details when includeDetails is true', () => {
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        400,
        { field: 'email', reason: 'invalid format' }
      );

      const response = error.toResponse(true);

      expect(response).toEqual({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details: { field: 'email', reason: 'invalid format' },
        },
      });
    });

    it('should not include details if details is undefined', () => {
      const error = new AppError(ErrorCode.NOT_FOUND, 'Not found', 404);

      const response = error.toResponse(true);

      expect(response.error.details).toBeUndefined();
    });
  });

  describe('stack trace', () => {
    it('should have a stack trace', () => {
      const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Test error');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('AppError');
    });
  });
});

describe('Error Helper Functions', () => {
  describe('createValidationError', () => {
    it('should create a validation error with correct properties', () => {
      const error = createValidationError('Invalid input', { field: 'email' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.isOperational).toBe(true);
    });

    it('should work without details', () => {
      const error = createValidationError('Invalid input');

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
    });
  });

  describe('createNotFoundError', () => {
    it('should create a not found error with default message', () => {
      const error = createNotFoundError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should create a not found error with custom message', () => {
      const error = createNotFoundError('User not found');

      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('createInternalError', () => {
    it('should create an internal error with isOperational false', () => {
      const error = createInternalError('Internal error', { stack: 'trace' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.message).toBe('Internal error');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ stack: 'trace' });
      expect(error.isOperational).toBe(false);
    });

    it('should use default message', () => {
      const error = createInternalError();

      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('createDatabaseError', () => {
    it('should create a database error', () => {
      const error = createDatabaseError('Database connection failed', { code: 'ECONNREFUSED' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ code: 'ECONNREFUSED' });
      expect(error.isOperational).toBe(false);
    });
  });

  describe('createExternalServiceError', () => {
    it('should create an external service error', () => {
      const error = createExternalServiceError('API service unavailable', { status: 503 });

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
      expect(error.message).toBe('API service unavailable');
      expect(error.statusCode).toBe(502);
      expect(error.details).toEqual({ status: 503 });
      expect(error.isOperational).toBe(false);
    });
  });
});

describe('ErrorCode enum', () => {
  it('should have all expected error codes', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCode.BAD_REQUEST).toBe('BAD_REQUEST');
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
    expect(ErrorCode.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
    expect(ErrorCode.DICTIONARY_LOOKUP_FAILED).toBe('DICTIONARY_LOOKUP_FAILED');
    expect(ErrorCode.GENERATION_FAILED).toBe('GENERATION_FAILED');
    expect(ErrorCode.GRAMMAR_ANALYSIS_FAILED).toBe('GRAMMAR_ANALYSIS_FAILED');
    expect(ErrorCode.VOCABULARY_NOT_FOUND).toBe('VOCABULARY_NOT_FOUND');
    expect(ErrorCode.PROXY_ERROR).toBe('PROXY_ERROR');
  });
});

describe('ErrorResponse interface', () => {
  it('should match the expected structure', () => {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Test error',
      },
    };

    expect(response.success).toBe(false);
    expect(response.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(response.error.message).toBe('Test error');
  });

  it('should support optional details', () => {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Test error',
        details: { field: 'email' },
      },
    };

    expect(response.error.details).toEqual({ field: 'email' });
  });
});

