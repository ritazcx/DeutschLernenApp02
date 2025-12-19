/**
 * Unified Error Handling - Frontend
 * 
 * Provides consistent error types and error classes for the frontend.
 */

/**
 * Error codes for different types of errors
 */
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Standard error response format from backend
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
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
  public readonly originalError?: Error;
  public readonly userMessage: string;
  public readonly backendErrorCode?: string;
  public readonly backendDetails?: any;

  constructor(
    code: ErrorCode,
    message: string,
    originalError?: Error,
    userMessage?: string,
    backendErrorCode?: string,
    backendDetails?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
    this.userMessage = userMessage || message;
    this.backendErrorCode = backendErrorCode;
    this.backendDetails = backendDetails;
  }

  /**
   * Create AppError from backend error response
   */
  static fromBackendResponse(response: ErrorResponse, originalError?: Error): AppError {
    const code = mapBackendErrorCode(response.error.code);
    return new AppError(
      code,
      response.error.message,
      originalError,
      response.error.message, // Use backend message as user message
      response.error.code,
      response.error.details
    );
  }

  /**
   * Create AppError from fetch error
   */
  static fromFetchError(error: Error, statusCode?: number): AppError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new AppError(
        ErrorCode.NETWORK_ERROR,
        'Network request failed. Please check your connection.',
        error,
        'Unable to connect to server. Please check your internet connection.'
      );
    }
    
    if (statusCode) {
      return new AppError(
        ErrorCode.SERVER_ERROR,
        `Server error: ${statusCode}`,
        error,
        `Server returned an error (${statusCode}). Please try again later.`
      );
    }

    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      error.message || 'An unknown error occurred',
      error,
      'An unexpected error occurred. Please try again.'
    );
  }
}

/**
 * Map backend error code to frontend error code
 */
function mapBackendErrorCode(backendCode: string): ErrorCode {
  // Map backend error codes to frontend error codes
  const codeMap: Record<string, ErrorCode> = {
    'VALIDATION_ERROR': ErrorCode.VALIDATION_ERROR,
    'NOT_FOUND': ErrorCode.VALIDATION_ERROR,
    'BAD_REQUEST': ErrorCode.VALIDATION_ERROR,
    'INTERNAL_ERROR': ErrorCode.SERVER_ERROR,
    'DATABASE_ERROR': ErrorCode.SERVER_ERROR,
    'EXTERNAL_SERVICE_ERROR': ErrorCode.SERVER_ERROR,
  };

  return codeMap[backendCode] || ErrorCode.SERVER_ERROR;
}

