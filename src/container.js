import { getDatabase } from './services/mongodb.js';
import UserModel from './models/user.js';
import PostModel from './models/post.js';
import CompanyModel from './models/company.js';
import JobOfferModel from './models/joboffers.js';
import MatchModel from './models/match.js';
import AssessmentModel from './models/assessment.js';
import AssessmentQuestionsModel from './models/assessmentquestions.js';
import PersonalityModel from './models/personality.js';
import PostLikesModel from './models/postlikes.js';
import PostViewsModel from './models/postviews.js';
import NotificationModel from './models/notifications.js';
import TranscriptionModel from './models/transcriptions.js';
import JobSkillModel from './models/jobskill.js';
import CommentModel from './models/comment.js';
import SessionModel from './models/session.js';
import ROLES from './config/roles.js';
import { createUploadMiddleware } from './infrastructure/upload.service.js';

class Container {
  constructor() {
    this.services = new Map();
    this.models = new Map();
    this.db = null;
    
    // Initialize services immediately (synchronously)
    this.initializeServices();
  }

  initializeServices() {
    // Register common services
    this.services.set('roles', ROLES);
    this.services.set('upload', createUploadMiddleware);
    this.services.set('logger', {
      info: (message) => console.log(`INFO: ${message}`),
      error: (message) => console.error(`ERROR: ${message}`),
      warn: (message) => console.warn(`WARN: ${message}`),
      debug: (message) => console.debug(`DEBUG: ${message}`)
    });
  }

  async initialize() {
    // Get database connection (will be null if not connected yet)
    this.db = getDatabase();
    
    // Initialize all models with database connection (or null)
    this.models.set('user', new UserModel(this.db));
    this.models.set('post', new PostModel(this.db));
    this.models.set('company', new CompanyModel(this.db));
    this.models.set('joboffer', new JobOfferModel(this.db));
    this.models.set('match', new MatchModel(this.db));
    this.models.set('assessment', new AssessmentModel(this.db));
    this.models.set('assessmentquestions', new AssessmentQuestionsModel(this.db));
    this.models.set('personality', new PersonalityModel(this.db));
    this.models.set('postlikes', new PostLikesModel(this.db));
    this.models.set('postviews', new PostViewsModel(this.db));
    this.models.set('notification', new NotificationModel(this.db));
    this.models.set('transcription', new TranscriptionModel(this.db));
    this.models.set('jobskill', new JobSkillModel(this.db));
    this.models.set('comment', new CommentModel(this.db));
    this.models.set('session', new SessionModel(this.db));
    
    if (this.db) {
      console.log('Container initialized with MongoDB database connection');
    } else {
      console.warn('Container initialized without database connection - using mock data');
    }
  }

  make(name) {
    try {
      // Check if it's a model request
      if (name.startsWith('models/')) {
        const modelName = name.replace('models/', '');
        if (this.models.has(modelName)) {
          return this.models.get(modelName);
        }
        console.warn(`Model '${modelName}' not found in container.`);
        return null;
      }

      // Check if it's a service
      if (this.services.has(name)) {
        return this.services.get(name);
      }

      // Handle job queue (mock for now)
      if (name.includes('jobQueue')) {
        const jobQueue = (queueName) => ({
          add: async (data) => Promise.resolve({ id: 'job-id' })
        });
        this.services.set(name, jobQueue);
        return jobQueue;
      }

      // Handle OpenAI service (mock for now)
      if (name.includes('openai')) {
        const openai = {
          createCompletion: async (prompt) => ({ choices: [{ text: 'Mock response' }] })
        };
        this.services.set(name, openai);
        return openai;
      }

      console.warn(`Service '${name}' not found in container.`);
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

const container = new Container();
export default container;
