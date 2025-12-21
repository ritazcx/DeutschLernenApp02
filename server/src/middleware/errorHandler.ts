/**
 * Unified Error Handler Middleware
 * 
 * Catches all errors and converts them to a consistent response format.
 * Should be registered as the last middleware in Express app.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse } from '../utils/errors';
import { config } from '../config';

/**
 * Check if error is an operational error (expected) or programming error (unexpected)
 */
function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Log error with request context
 */
function logError(error: Error, req: Request): void {
  const isDev = config.nodeEnv !== 'production';
  
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    body: isDev ? req.body : undefined, // Only log body in dev
    error: {
      name: error.name,
      message: error.message,
      ...(error instanceof AppError ? {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      } : {}),
      ...(isDev && error.stack ? { stack: error.stack } : {}),
    },
  };

  if (isOperationalError(error)) {
    // Operational errors: log as warning
    console.warn('[Operational Error]', JSON.stringify(logData, null, 2));
  } else {
    // Programming errors: log as error
    console.error('[Programming Error]', JSON.stringify(logData, null, 2));
  }
}

/**
 * Error handler middleware
 * 
 * This should be the last middleware registered in the Express app.
 * It catches all errors (both thrown and passed via next(error)).
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logError(error, req);

  // Determine if we should include error details (only in development)
  const isDev = config.nodeEnv !== 'production';
  const includeDetails = isDev;

  // Handle AppError instances (our custom errors)
  if (error instanceof AppError) {
    const response: ErrorResponse = error.toResponse(includeDetails);
    res.status(error.statusCode).json(response);
    return;
  }

  // Handle unknown errors (programming errors, unexpected errors)
  // Don't expose internal error details in production
  const message = isDev 
    ? error.message || 'An unexpected error occurred'
    : 'An unexpected error occurred. Please try again later.';

  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR' as any,
      message,
      ...(includeDetails ? {
        details: {
          name: error.name,
          ...(error.stack ? { stack: error.stack } : {}),
        },
      } : {}),
    },
  };

  res.status(500).json(response);
}

/**
 * Async error wrapper
 * 
 * Wraps async route handlers to automatically catch errors and pass them to error handler.
 * 
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => {
 *     // Your async code here
 *   }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

