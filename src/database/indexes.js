import { getDatabase } from '../services/mongodb.js';

export async function ensureIndexes() {
  try {
    const db = getDatabase();
    
    if (!db) {
      console.warn('Database not available. Skipping index creation.');
      return;
    }

    console.log('Creating database indexes...');

    // Users collection indexes
    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true, name: 'email_unique' }
    );

    await db.collection('users').createIndex(
      { googleId: 1 },
      { sparse: true, name: 'googleId_sparse' }
    );

    await db.collection('users').createIndex(
      { appleId: 1 },
      { sparse: true, name: 'appleId_sparse' }
    );

    await db.collection('users').createIndex(
      { role: 1, roleSubtype: 1 },
      { name: 'role_roleSubtype' }
    );

    await db.collection('users').createIndex(
      { createdTime: -1 },
      { name: 'createdTime_desc' }
    );

    await db.collection('users').createIndex(
      { resetPasswordToken: 1 },
      { sparse: true, name: 'resetPasswordToken_sparse' }
    );

    // Sessions collection indexes
    await db.collection('sessions').createIndex(
      { refreshToken: 1 },
      { unique: true, name: 'refreshToken_unique' }
    );

    await db.collection('sessions').createIndex(
      { userId: 1, isActive: 1 },
      { name: 'userId_isActive' }
    );

    await db.collection('sessions').createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'expiresAt_ttl' }
    );

    // Posts collection indexes
    await db.collection('posts').createIndex(
      { postType: 1, createdTime: -1 },
      { name: 'postType_createdTime' }
    );

    await db.collection('posts').createIndex(
      { userId: 1, postType: 1 },
      { name: 'userId_postType' }
    );

    await db.collection('posts').createIndex(
      { companyId: 1 },
      { sparse: true, name: 'companyId_sparse' }
    );

    await db.collection('posts').createIndex(
      { createdTime: -1 },
      { name: 'createdTime_desc' }
    );

    // Matches collection indexes
    await db.collection('matches').createIndex(
      { candidateId: 1, status: 1 },
      { name: 'candidateId_status' }
    );

    await db.collection('matches').createIndex(
      { recruiterId: 1, status: 1 },
      { name: 'recruiterId_status' }
    );

    await db.collection('matches').createIndex(
      { postId: 1 },
      { name: 'postId' }
    );

    await db.collection('matches').createIndex(
      { createdAt: -1 },
      { name: 'createdAt_desc' }
    );

    // Post Likes collection indexes
    await db.collection('postlikes').createIndex(
      { candidateId: 1, postId: 1 },
      { unique: true, name: 'candidateId_postId_unique' }
    );

    await db.collection('postlikes').createIndex(
      { postId: 1 },
      { name: 'postId' }
    );

    await db.collection('postlikes').createIndex(
      { candidateId: 1, createdAt: -1 },
      { name: 'candidateId_createdAt' }
    );

    // Media collection indexes
    await db.collection('media').createIndex(
      { userId: 1, category: 1 },
      { name: 'userId_category' }
    );

    await db.collection('media').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt' }
    );

    // Assessments collection indexes
    await db.collection('assessments').createIndex(
      { userId: 1 },
      { unique: true, name: 'userId_unique' }
    );

    await db.collection('assessments').createIndex(
      { personalityType: 1 },
      { name: 'personalityType' }
    );

    // Companies collection indexes
    await db.collection('companies').createIndex(
      { name: 1 },
      { unique: true, name: 'name_unique' }
    );

    await db.collection('companies').createIndex(
      { industry: 1 },
      { name: 'industry' }
    );

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('Failed to create database indexes:', error.message);
    // Don't throw error - allow server to start even if index creation fails
  }
}

export async function listIndexes() {
  const db = getDatabase();
  
  if (!db) {
    return null;
  }

  const collections = await db.listCollections().toArray();
  const indexReport = {};

  for (const collection of collections) {
    const collectionName = collection.name;
    const indexes = await db.collection(collectionName).indexes();
    indexReport[collectionName] = indexes;
  }

  return indexReport;
}
