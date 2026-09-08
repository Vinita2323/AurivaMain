import { HTTP_STATUS } from '../constants/status.js';

/**
 * Standard API Success Response
 * @param {import('express').Response} res
 * @param {string} message - Human-readable success message
 * @param {object|array|null} data - Response payload
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, message = 'Operation successful', data = null, statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data !== null && data !== undefined ? data : {}
  });
};

/**
 * Standard API Error Response
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error message
 * @param {object|string|array|null} error - Error details or stack in development
 * @param {number} statusCode - HTTP status code (default: 500)
 */
export const sendError = (res, message = 'Something went wrong', error = null, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error !== null && error !== undefined ? error : {}
  });
};

export default {
  sendSuccess,
  sendError
};
