
class Container {
  constructor() {
    this.services = new Map();
  }

  make(serviceName) {
    if (this.services.has(serviceName)) {
      return this.services.get(serviceName);
    }

    // Mock implementations for missing services
    switch (serviceName) {
      case 'logger':
        const logger = {
          error: (...args) => console.error('[ERROR]', ...args),
          info: (...args) => console.log('[INFO]', ...args),
          warn: (...args) => console.warn('[WARN]', ...args)
        };
        this.services.set(serviceName, logger);
        return logger;
      
      case 'models/post':
      case 'models/user':
      case 'models/postlikes':
      case 'models/match':
      case 'models/assessment':
      case 'models/transcriptions':
      case 'models/jobskill':
        const mockModel = {
          findById: () => Promise.resolve(null),
          findOne: () => Promise.resolve(null),
          findFirst: () => Promise.resolve(null),
          findMany: () => Promise.resolve([]),
          findManyOr: () => Promise.resolve([]),
          create: () => Promise.resolve({}),
          update: () => Promise.resolve({}),
          updateById: () => Promise.resolve({}),
          delete: () => Promise.resolve({}),
          deleteById: () => Promise.resolve({}),
          increment: () => Promise.resolve({}),
          decrement: () => Promise.resolve({})
        };
        this.services.set(serviceName, mockModel);
        return mockModel;
      
      case 'roles':
        const roles = {
          user: 'USER',
          candidate: 'CANDIDATE',
          recruiter: 'RECRUITER'
        };
        this.services.set(serviceName, roles);
        return roles;
      
      case 'upload':
        const upload = (types) => (req, res, next) => next();
        this.services.set(serviceName, upload);
        return upload;
      
      default:
        console.warn(`Service '${serviceName}' not found in container`);
        return null;
    }
  }

  bind(serviceName, service) {
    this.services.set(serviceName, service);
  }
}

export default new Container();
