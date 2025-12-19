/**
 * Unified Error Handler - Frontend
 * 
 * Provides utilities for handling errors consistently across the frontend.
 */

import { AppError, ErrorResponse, ErrorCode } from './errors';

/**
 * Enhanced fetch wrapper with automatic error handling
 * 
 * Automatically parses error responses and throws AppError instances.
 * 
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Promise with parsed response data
 * @throws AppError if request fails
 */
export async function fetchWithErrorHandling<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    // Parse response body
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    let data: any;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    // Check if response indicates an error
    if (!response.ok) {
      // Check if it's our standard error format
      if (data.success === false && data.error) {
        throw AppError.fromBackendResponse(data as ErrorResponse);
      }
      
      // Otherwise, create error from status code
      throw AppError.fromFetchError(
        new Error(data.message || `HTTP ${response.status}`),
        response.status
      );
    }

    // Check if response has success: false (even with 200 status)
    if (data.success === false && data.error) {
      throw AppError.fromBackendResponse(data as ErrorResponse);
    }

    return data;
  } catch (error) {
    // Re-throw AppError instances
    if (error instanceof AppError) {
      throw error;
    }

    // Convert other errors to AppError
    if (error instanceof Error) {
      throw AppError.fromFetchError(error);
    }

    // Handle unknown error types
    throw new AppError(
      ErrorCode.UNKNOWN_ERROR,
      'An unknown error occurred',
      error instanceof Error ? error : new Error(String(error)),
      'An unexpected error occurred. Please try again.'
    );
  }
}

/**
 * Log error with context
 * 
 * @param error - Error to log
 * @param context - Additional context information
 */
export function logError(error: Error | AppError, context?: Record<string, any>): void {
  const isDev = import.meta.env.DEV;
  
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      ...(error instanceof AppError ? {
        code: error.code,
        backendErrorCode: error.backendErrorCode,
        backendDetails: error.backendDetails,
        originalError: error.originalError?.message,
      } : {}),
      ...(isDev && error.stack ? { stack: error.stack } : {}),
    },
    ...(context ? { context } : {}),
  };

  if (error instanceof AppError) {
    console.warn('[App Error]', logData);
  } else {
    console.error('[Error]', logData);
  }
}

/**
 * Get user-friendly error message
 * 
 * @param error - Error instance
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  
  // Fallback for non-AppError instances
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return error.code === ErrorCode.NETWORK_ERROR;
  }
  return false;
}

/**
 * Check if error is a server error
 */
export function isServerError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return error.code === ErrorCode.SERVER_ERROR;
  }
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return error.code === ErrorCode.VALIDATION_ERROR;
  }
  return false;
}

