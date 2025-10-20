export const skipUndefined = (obj, deep = false) => {
  if (!obj) return obj;
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = deep && typeof value === 'object' && !Array.isArray(value) 
        ? skipUndefined(value, deep) 
        : value;
    }
  }
  return result;
};

export const isEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};
