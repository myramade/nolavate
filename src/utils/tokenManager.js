import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  PASSWORD_RESET: 'password_reset'
};

export function generateAccessToken(payload) {
  return jwt.sign(
    {
      ...payload,
      type: TOKEN_TYPES.ACCESS
    },
    config.jwt.secret,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.type !== TOKEN_TYPES.ACCESS) {
      throw new Error('Invalid token type');
    }
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export function generatePasswordResetToken(payload) {
  return jwt.sign(
    {
      ...payload,
      type: TOKEN_TYPES.PASSWORD_RESET
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

export function verifyPasswordResetToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.type !== TOKEN_TYPES.PASSWORD_RESET) {
      throw new Error('Invalid token type');
    }
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}
