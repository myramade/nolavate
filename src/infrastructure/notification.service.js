import { logger } from '../config/logger.js';

export class NotificationService {
  async create(fromUserId, toUserId, type, message) {
    logger.info(`Creating notification: ${type} - ${message}`, {
      from: fromUserId,
      to: toUserId
    });
    return Promise.resolve({
      id: 'notification-id',
      fromUserId,
      toUserId,
      type,
      message,
      createdAt: new Date()
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
