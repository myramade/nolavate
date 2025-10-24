import BaseModel from './base.js';
import { ObjectId } from 'mongodb';

export default class SessionModel extends BaseModel {
  constructor(database) {
    super(database, 'sessions');
  }

  async createSession(userId, refreshToken, deviceInfo = {}) {
    const session = {
      _id: new ObjectId(),
      userId: userId instanceof ObjectId ? userId : new ObjectId(userId),
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
    
    await this.db.collection(this.collection).updateMany(
      { userId: userId instanceof ObjectId ? userId : new ObjectId(userId) },
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
    return await this.findMany(
      {
        userId: userId instanceof ObjectId ? userId : new ObjectId(userId),
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
