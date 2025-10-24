import BaseModel from './base.js';
import { ObjectId } from 'mongodb';

export default class SessionModel extends BaseModel {
  constructor(database) {
    super(database, 'sessions');
  }

  async createSession(userId, refreshToken, deviceInfo = {}) {
    // Handle both ObjectId and string (mock) IDs
    let sessionUserId;
    if (userId instanceof ObjectId) {
      sessionUserId = userId;
    } else if (typeof userId === 'string') {
      // For mock IDs (e.g., "mock-123..."), keep as string
      // For valid ObjectId strings, convert to ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(userId)) {
        sessionUserId = new ObjectId(userId);
      } else {
        sessionUserId = userId; // Mock ID - keep as string
      }
    } else {
      throw new Error('Invalid userId type');
    }

    const session = {
      _id: this.db ? new ObjectId() : `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: sessionUserId,
      refreshToken,
      deviceInfo: {
        userAgent: deviceInfo.userAgent || null,
        ip: deviceInfo.ip || null
      },
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isActive: true
    };

    await this.create(session);
    return session;
  }

  async findActiveSession(refreshToken) {
    return await this.findOne({
      refreshToken,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
  }

  async updateSessionUsage(sessionId) {
    return await this.update(sessionId, {
      lastUsedAt: new Date()
    });
  }

  async revokeSession(sessionId) {
    return await this.update(sessionId, {
      isActive: false
    });
  }

  async revokeAllUserSessions(userId) {
    if (!this.db) return;
    
    // Handle both ObjectId and string IDs
    let queryUserId;
    if (userId instanceof ObjectId) {
      queryUserId = userId;
    } else if (typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
      queryUserId = new ObjectId(userId);
    } else {
      queryUserId = userId; // Mock ID or other string
    }
    
    await this.db.collection(this.collection).updateMany(
      { userId: queryUserId },
      { $set: { isActive: false } }
    );
  }

  async cleanExpiredSessions() {
    if (!this.db) return;
    
    return await this.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }

  async getUserActiveSessions(userId) {
    // Handle both ObjectId and string IDs
    let queryUserId;
    if (userId instanceof ObjectId) {
      queryUserId = userId;
    } else if (typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
      queryUserId = new ObjectId(userId);
    } else {
      queryUserId = userId; // Mock ID or other string
    }
    
    return await this.findMany(
      {
        userId: queryUserId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      },
      {},
      -1,
      0,
      'lastUsedAt',
      'desc'
    );
  }
}
