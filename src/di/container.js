import { logger } from '../config/logger.js';
import ROLES from '../config/roles.js';
import { userRepository } from '../repositories/user.repository.js';
import { assessmentRepository } from '../repositories/assessment.repository.js';
import { personalityRepository } from '../repositories/personality.repository.js';
import { notificationService } from '../infrastructure/notification.service.js';
import { messagingService } from '../infrastructure/messaging.service.js';
import { storageService } from '../infrastructure/storage.service.js';
import { avatarService } from '../infrastructure/avatar.service.js';

class Container {
  constructor() {
    this.services = new Map();
    this.initialize();
  }

  initialize() {
    this.services.set('logger', logger);
    this.services.set('roles', ROLES);
    
    this.services.set('userRepository', userRepository);
    this.services.set('assessmentRepository', assessmentRepository);
    this.services.set('personalityRepository', personalityRepository);
    
    this.services.set('notificationService', notificationService);
    this.services.set('messagingService', messagingService);
    this.services.set('storageService', storageService);
    this.services.set('avatarService', avatarService);
  }

  get(name) {
    if (!this.services.has(name)) {
      throw new Error(`Service '${name}' not found in container`);
    }
    return this.services.get(name);
  }

  register(name, service) {
    this.services.set(name, service);
  }

  has(name) {
    return this.services.has(name);
  }
}

export const container = new Container();
export default container;
