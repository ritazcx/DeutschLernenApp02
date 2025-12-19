/**
 * Unified Error Handling - Backend
 * 
 * Provides consistent error types and error classes for the backend API.
 */

/**
 * Error codes for different types of errors
 */
export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  BAD_REQUEST = 'BAD_REQUEST',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business logic errors
  DICTIONARY_LOOKUP_FAILED = 'DICTIONARY_LOOKUP_FAILED',
  GENERATION_FAILED = 'GENERATION_FAILED',
  GRAMMAR_ANALYSIS_FAILED = 'GRAMMAR_ANALYSIS_FAILED',
  VOCABULARY_NOT_FOUND = 'VOCABULARY_NOT_FOUND',
  PROXY_ERROR = 'PROXY_ERROR',
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
}

/**
 * Application Error class
 * 
 * Extends Error with additional metadata for consistent error handling
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to standard response format
   */
  toResponse(includeDetails: boolean = false): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(includeDetails && this.details ? { details: this.details } : {}),
      },
    };
  }
}

/**
 * Helper functions to create common errors
 */
export const createValidationError = (message: string, details?: any): AppError => {
  return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
};

export const createNotFoundError = (message: string = 'Resource not found'): AppError => {
  return new AppError(ErrorCode.NOT_FOUND, message, 404);
};

export const createInternalError = (message: string = 'Internal server error', details?: any): AppError => {
  return new AppError(ErrorCode.INTERNAL_ERROR, message, 500, details, false);
};

export const createDatabaseError = (message: string, details?: any): AppError => {
  return new AppError(ErrorCode.DATABASE_ERROR, message, 500, details, false);
};

export const createExternalServiceError = (message: string, details?: any): AppError => {
  return new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, message, 502, details, false);
};

