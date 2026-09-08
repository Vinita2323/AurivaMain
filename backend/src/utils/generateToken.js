import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Generate a signed JWT token
 * @param {object} payload - Data to embed in the token (e.g., { id, role, email })
 * @param {string|number} [expiresIn] - Expiration override
 * @returns {string} - Signed JWT token
 */
export const generateToken = (payload, expiresIn = env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn
  });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} - Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

export default generateToken;
