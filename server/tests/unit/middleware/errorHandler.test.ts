/**
 * Error Handler Middleware Unit Tests
 * Tests for errorHandler middleware and asyncHandler wrapper
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler, asyncHandler } from '../../../src/middleware/errorHandler';
import { AppError, ErrorCode, createValidationError, createNotFoundError } from '../../../src/utils/errors';

// Mock console methods to avoid cluttering test output
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/api/test',
      query: {},
      body: {},
    };

    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AppError handling', () => {
    it('should handle AppError and return standardized response', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production'; // Set to production to exclude details
      
      const error = createValidationError('Invalid input', { field: 'email' });

      errorHandler(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid input',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should include details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = createValidationError('Invalid input', { field: 'email' });

      errorHandler(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid input',
          details: { field: 'email' },
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = createValidationError('Invalid input', { field: 'email' });

      errorHandler(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid input',
        },
      });
      expect(jsonSpy.mock.calls[0][0].error.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle different status codes', () => {
      const error = createNotFoundError('Resource not found');

      errorHandler(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(404);
    });

    it('should log operational errors as warnings', () => {
      const error = createValidationError('Invalid input');

      errorHandler(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.warn).toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should log programming errors as errors', () => {
      const error = new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Programming error',
        500,
        undefined,
        false
      );

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Unknown error handling', () => {
    it('should handle unknown errors and return generic response', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production'; // Set to production to get generic message
      
      const error = new Error('Unknown error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      const response = jsonSpy.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.message).toBe('An unexpected error occurred. Please try again later.');

      process.env.NODE_ENV = originalEnv;
    });

    it('should include error details in development mode for unknown errors', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Unknown error');
      error.stack = 'Error stack trace';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(response.error.details).toBeDefined();
      expect(response.error.details.name).toBe('Error');
      expect(response.error.details.stack).toBe('Error stack trace');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Unknown error');
      error.stack = 'Error stack trace';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(response.error.message).toBe('An unexpected error occurred. Please try again later.');
      expect(response.error.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log unknown errors as errors', () => {
      const error = new Error('Unknown error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Error logging context', () => {
    it('should include request context in error logs', () => {
      const error = createValidationError('Invalid input');
      (mockRequest as any).method = 'POST';
      (mockRequest as any).path = '/api/users';
      (mockRequest as any).query = { page: '1' };
      (mockRequest as any).body = { email: 'test@example.com' };

      errorHandler(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.warn).toHaveBeenCalled();
      const logCall = (console.warn as jest.Mock).mock.calls[0][1];
      const logData = JSON.parse(logCall);
      expect(logData.method).toBe('POST');
      expect(logData.path).toBe('/api/users');
      expect(logData.query).toEqual({ page: '1' });
    });

    it('should not log request body in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = createValidationError('Invalid input');
      (mockRequest as any).body = { email: 'test@example.com' };

      errorHandler(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

      const logCall = (console.warn as jest.Mock).mock.calls[0][1];
      const logData = JSON.parse(logCall);
      expect(logData.body).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('asyncHandler wrapper', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should pass through successful async handlers', async () => {
    const handler = asyncHandler(async (req, res, next) => {
      return 'success';
    });

    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should catch and pass errors to next', async () => {
    const error = new Error('Test error');
    const handler = asyncHandler(async (req, res, next) => {
      throw error;
    });

    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should catch AppError and pass to next', async () => {
    const error = createValidationError('Invalid input');
    const handler = asyncHandler(async (req, res, next) => {
      throw error;
    });

    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should handle synchronous errors (wrapped in Promise)', async () => {
    const error = new Error('Sync error');
    // asyncHandler expects async functions, but can handle sync functions that throw
    // by wrapping them in Promise.resolve
    const handler = asyncHandler(async (req, res, next) => {
      throw error;
    });

    // asyncHandler wraps the function and catches errors, passing them to next
    handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Wait for the promise to resolve/reject
    await new Promise(resolve => setImmediate(resolve));

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should handle promise rejections', async () => {
    const error = new Error('Promise rejection');
    const handler = asyncHandler(async (req, res, next) => {
      return Promise.reject(error);
    });

    // asyncHandler catches promise rejections and passes them to next
    handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Wait for the promise to resolve/reject
    await new Promise(resolve => setImmediate(resolve));

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should preserve request and response objects', async () => {
    const handler = asyncHandler(async (req, res, next) => {
      expect(req).toBe(mockRequest);
      expect(res).toBe(mockResponse);
      return 'success';
    });

    await handler(mockRequest as Request, mockResponse as Response, mockNext);
  });
});

