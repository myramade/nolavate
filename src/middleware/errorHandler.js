import { ApiResponse } from '../utils/response.js';
import { logger } from '../config/logger.js';

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, req, res, next) {
  logger.error(`[${req.requestId}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Handle known application errors
  if (err.isOperational) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return ApiResponse.validationError(res, [{ message: err.message }]);
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid or expired token');
  }

  if (err.name === 'MongoServerError') {
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      return ApiResponse.error(
        res,
        `Duplicate value for ${field}. This ${field} already exists.`,
        409
      );
    }
    
    // Handle other MongoDB errors
    return ApiResponse.error(res, 'Database error occurred', 500);
  }

  if (err.message === 'Not allowed by CORS') {
    return ApiResponse.forbidden(res, 'CORS policy violation');
  }

  if (err.type === 'entity.parse.failed') {
    return ApiResponse.validationError(res, [{ message: 'Invalid JSON in request body' }]);
  }

  // Log unexpected errors for investigation
  logger.error('Unexpected error:', {
    error: err,
    stack: err.stack,
    requestId: req.requestId
  });

  // Default error response
  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message,
    500
  );
}

export function notFoundHandler(req, res) {
  return ApiResponse.notFound(res, `Route not found: ${req.originalUrl}`);
}
