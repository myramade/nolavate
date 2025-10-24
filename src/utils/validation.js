import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
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
  email: z.string().email('Invalid email address')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const categorySchema = z.enum(['INFO', 'EDUCATION', 'EXPERIENCE', 'INTERESTS'], {
  errorMap: () => ({ message: 'Invalid category. Must be INFO, EDUCATION, EXPERIENCE, or INTERESTS' })
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export function validateSchema(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Validation error',
          errors
        });
      }
      
      req.validatedBody = result.data;
      next();
    } catch (error) {
      console.error('Schema validation error:', error);
      res.status(500).json({ message: 'Internal validation error' });
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Invalid query parameters',
          errors
        });
      }
      
      req.validatedQuery = result.data;
      next();
    } catch (error) {
      console.error('Query validation error:', error);
      res.status(500).json({ message: 'Internal validation error' });
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Invalid URL parameters',
          errors
        });
      }
      
      req.validatedParams = result.data;
      next();
    } catch (error) {
      console.error('Params validation error:', error);
      res.status(500).json({ message: 'Internal validation error' });
    }
  };
}
