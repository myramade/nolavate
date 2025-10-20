import { logger } from '../config/logger.js';

export class MessagingService {
  async sendMessage(userIds, message) {
    logger.info(`Creating message for users ${userIds.join(', ')}: ${message}`);
    return Promise.resolve({
      id: 'message-id',
      userIds,
      message,
      sentAt: new Date()
    });
  }
}

export const messagingService = new MessagingService();
export default messagingService;
