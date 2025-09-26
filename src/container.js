class Container {
  constructor() {
    this.services = new Map();
  }

  make(name) {
    try {
      if (this.services.has(name)) {
        return this.services.get(name);
      }

      // Mock logger
      if (name === 'logger') {
        const logger = {
          info: (message) => console.log(`INFO: ${message}`),
          error: (message) => console.error(`ERROR: ${message}`),
          warn: (message) => console.warn(`WARN: ${message}`),
          debug: (message) => console.debug(`DEBUG: ${message}`)
        };
        this.services.set(name, logger);
        return logger;
      }

      // Mock roles
      if (name === 'roles') {
        const roles = {
          user: 'user',
          candidate: 'candidate',
          recruiter: 'recruiter',
          admin: 'admin'
        };
        this.services.set(name, roles);
        return roles;
      }

      // Mock upload service
      if (name === 'upload') {
        const upload = (fileTypes = 'all') => ({
          single: (fieldName) => (req, res, next) => {
            // Mock file upload middleware
            req.file = {
              filename: 'mock-file.txt',
              path: '/mock/path/mock-file.txt',
              mimetype: 'text/plain',
              size: 1024
            };
            next();
          }
        });
        this.services.set(name, upload);
        return upload;
      }

      // Mock models - return empty functions that resolve
      if (name.startsWith('models/')) {
        const mockModel = {
          findById: async (id, select = {}) => ({ id, ...select }),
          findMany: async (where = {}, select = {}, limit = -1, skip = 0, sortBy = 'createdTime', order = 'desc') => [],
          findManyOr: async (whereArray) => [],
          create: async (data) => ({ id: 'mock-id', ...data }),
          update: async (id, data) => ({ id, ...data }),
          delete: async (id) => ({ id }),
          count: async (where = {}) => 0
        };
        this.services.set(name, mockModel);
        return mockModel;
      }

      // Mock job queue
      if (name.includes('jobQueue')) {
        const jobQueue = (queueName) => ({
          add: async (data) => Promise.resolve({ id: 'job-id' })
        });
        this.services.set(name, jobQueue);
        return jobQueue;
      }

      // Mock OpenAI service
      if (name.includes('openai')) {
        const openai = {
          createCompletion: async (prompt) => ({ choices: [{ text: 'Mock response' }] })
        };
        this.services.set(name, openai);
        return openai;
      }

      // Database service (mock)
      if (name === 'database') {
        const mockDatabase = {
          prisma: {
            $connect: async () => console.log('Mock database connected'),
            $disconnect: async () => console.log('Mock database disconnected')
          },
          connectToDatabase: async () => console.log('Mock database connection established')
        };
        this.services.set(name, mockDatabase);
        return mockDatabase;
      }

      console.warn(`Service '${name}' not found in container. Returning null.`);
      return null;

    } catch (error) {
      console.error(`Error creating service '${name}':`, error);
      return null;
    }
  }

  bind(serviceName, service) {
    this.services.set(serviceName, service);
  }
}

export default new Container();