import { z } from 'zod';
import { PAGINATION_DEFAULTS, ApiResponse } from './response.js';

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  roleSubtype: z.enum(['CANDIDATE', 'RECRUITER'], {
    errorMap: () => ({ message: 'Invalid role. Must be CANDIDATE or RECRUITER' })
  })
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const googleOAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  state: z.string().optional(),
  nonce: z.string().optional()
});

export const appleOAuthSchema = z.object({
  idToken: z.string().optional(),
  code: z.string().optional(),
  nonce: z.string().optional()
}).refine(data => data.idToken || data.code, {
  message: 'Either idToken or code is required'
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address')
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const categorySchema = z.enum(['INFO', 'EDUCATION', 'EXPERIENCE', 'INTERESTS'], {
  errorMap: () => ({ message: 'Invalid category. Must be INFO, EDUCATION, EXPERIENCE, or INTERESTS' })
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION_DEFAULTS.page),
  pageSize: z.coerce.number().int().positive().max(PAGINATION_DEFAULTS.maxPageSize).default(PAGINATION_DEFAULTS.pageSize)
});

export function validateSchema(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error?.errors?.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })) || [{ field: 'unknown', message: 'Validation failed' }];
        
        return ApiResponse.validationError(res, errors);
      }
      
      req.validatedBody = result.data;
      next();
    } catch (error) {
      console.error('Schema validation error:', error);
      return ApiResponse.error(res, 'Internal validation error', 500);
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = result.error?.errors?.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })) || [{ field: 'unknown', message: 'Validation failed' }];
        
        return ApiResponse.validationError(res, errors);
      }
      
      req.validatedQuery = result.data;
      next();
    } catch (error) {
      console.error('Query validation error:', error);
      return ApiResponse.error(res, 'Internal validation error', 500);
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors = result.error?.errors?.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })) || [{ field: 'unknown', message: 'Validation failed' }];
        
        return ApiResponse.validationError(res, errors);
      }
      
      req.validatedParams = result.data;
      next();
    } catch (error) {
      console.error('Params validation error:', error);
      return ApiResponse.error(res, 'Internal validation error', 500);
    }
  };
}
