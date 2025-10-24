import { ObjectId } from 'mongodb';

export function sanitizeMongoQuery(query) {
  if (query === null || query === undefined) {
    return query;
  }

  if (Array.isArray(query)) {
    return query.map(item => sanitizeMongoQuery(item));
  }

  if (typeof query !== 'object') {
    return query;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(query)) {
    // Prevent MongoDB operator injection
    if (key.startsWith('$') && !isAllowedOperator(key)) {
      console.warn(`Blocked potentially dangerous MongoDB operator: ${key}`);
      continue;
    }

    // Recursively sanitize nested objects
    if (value !== null && typeof value === 'object' && !(value instanceof ObjectId) && !(value instanceof Date)) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function isAllowedOperator(operator) {
  const allowedOperators = [
    // Comparison
    '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
    // Logical
    '$and', '$or', '$not', '$nor',
    // Element
    '$exists', '$type',
    // Array
    '$all', '$elemMatch', '$size',
    // Projection
    '$slice',
    // Update operators (for update operations)
    '$set', '$unset', '$inc', '$push', '$pull', '$addToSet', '$pop'
  ];

  return allowedOperators.includes(operator);
}

export function sanitizeUserInput(input, allowedFields = []) {
  if (!input || typeof input !== 'object') {
    return input;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(input)) {
    // If allowedFields is specified, only include those fields
    if (allowedFields.length > 0 && !allowedFields.includes(key)) {
      continue;
    }

    // Skip potentially dangerous keys
    if (key.startsWith('$') || key.startsWith('__')) {
      console.warn(`Blocked dangerous field name: ${key}`);
      continue;
    }

    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeUserInput(value, []);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function validateObjectId(id) {
  if (!id) {
    return { valid: false, error: 'ID is required' };
  }

  if (id instanceof ObjectId) {
    return { valid: true, id };
  }

  if (typeof id !== 'string') {
    return { valid: false, error: 'ID must be a string' };
  }

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }

  try {
    return { valid: true, id: new ObjectId(id) };
  } catch (error) {
    return { valid: false, error: 'Invalid ObjectId' };
  }
}

export function preventNoSQLInjection(middleware) {
  return (req, res, next) => {
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeMongoQuery(req.query);
    }

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeUserInput(req.body);
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeUserInput(req.params);
    }

    next();
  };
}
