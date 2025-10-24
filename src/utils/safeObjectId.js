import { ObjectId } from 'mongodb';

export function safeObjectId(id) {
  if (!id) {
    return { success: false, error: 'ID is required' };
  }
  
  if (id instanceof ObjectId) {
    return { success: true, value: id };
  }
  
  if (typeof id !== 'string') {
    return { success: false, error: 'ID must be a string' };
  }
  
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return { success: false, error: 'Invalid ID format' };
  }
  
  try {
    return { success: true, value: new ObjectId(id) };
  } catch (error) {
    return { success: false, error: 'Invalid ID' };
  }
}

export function requireObjectId(id, fieldName = 'ID') {
  const result = safeObjectId(id);
  
  if (!result.success) {
    const error = new Error(result.error);
    error.statusCode = 400;
    error.field = fieldName;
    throw error;
  }
  
  return result.value;
}

export function validateObjectIdParam(paramName = 'id') {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      const objectId = requireObjectId(id, paramName);
      req.params[`${paramName}ObjectId`] = objectId;
      next();
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({
          message: error.message,
          field: error.field
        });
      }
      next(error);
    }
  };
}

export function safeObjectIdArray(ids) {
  if (!Array.isArray(ids)) {
    return { success: false, error: 'IDs must be an array' };
  }
  
  const objectIds = [];
  const errors = [];
  
  for (let i = 0; i < ids.length; i++) {
    const result = safeObjectId(ids[i]);
    if (result.success) {
      objectIds.push(result.value);
    } else {
      errors.push({ index: i, error: result.error });
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, value: objectIds };
}
