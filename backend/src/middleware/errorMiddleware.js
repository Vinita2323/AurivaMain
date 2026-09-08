import { HTTP_STATUS } from '../constants/status.js';
import env from '../config/env.js';

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.method} ${req.originalUrl}`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  next(error);
};

/**
 * Global Centralized Error Handler Middleware
 */
export const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errorDetails = err.error || null;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Resource not found with invalid identifier: ${err.value}`;
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    const errors = Object.values(err.errors).map((val) => val.message);
    message = 'Validation Error';
    errorDetails = errors;
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for '${field}'. Please use another value.`;
    errorDetails = { field, duplicateValue: err.keyValue ? err.keyValue[field] : undefined };
  }

  // Handle JWT Malformed Error
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid authentication token. Please log in again.';
  }

  // Handle JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Authentication token has expired. Please log in again.';
  }

  // Format final response
  res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails || (env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

export default {
  notFoundHandler,
  errorMiddleware
};
