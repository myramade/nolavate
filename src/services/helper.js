
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
