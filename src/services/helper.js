
export const getFormattedDate = () => {
  return new Date().toISOString();
};

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

export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const createUserAvatarUsingName = (name) => {
  return {
    streamUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
  };
};

export const createNotification = async (container, fromUserId, toUserId, type, message) => {
  const logger = container.make('logger');
  logger.info(`Creating notification: ${type} - ${message}`);
  return Promise.resolve();
};

export const createMessage = async (container, req, userIds, message) => {
  const logger = container.make('logger');
  logger.info(`Creating message for users ${userIds.join(', ')}: ${message}`);
  return Promise.resolve();
};

export const deleteData = async (filePath) => {
  try {
    // Mock file deletion
    console.log(`Mock: Deleting file at ${filePath}`);
    return Promise.resolve();
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    throw error;
  }
};

export const isHexId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const isEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const handleAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
