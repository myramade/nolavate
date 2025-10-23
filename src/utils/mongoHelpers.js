import { ObjectId } from 'mongodb';

/**
 * Convert string ID to ObjectId, handling nulls and ObjectId instances
 * @param {string|ObjectId|null} id - ID to convert
 * @returns {ObjectId|null}
 */
export function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  try {
    return new ObjectId(id);
  } catch (error) {
    return null;
  }
}

/**
 * Convert ObjectId to string, handling nulls
 * @param {ObjectId|string|null} objectId - ObjectId to convert
 * @returns {string|null}
 */
export function toString(objectId) {
  if (!objectId) return null;
  if (typeof objectId === 'string') return objectId;
  return objectId.toString();
}

/**
 * Serialize document for JSON response (converts all _id and ObjectId fields to strings)
 * @param {Object|Array|null} doc - Document or array of documents to serialize
 * @returns {Object|Array|null}
 */
export function serializeDocument(doc) {
  if (!doc) return null;
  
  if (Array.isArray(doc)) {
    return doc.map(serializeDocument);
  }
  
  if (doc instanceof ObjectId) {
    return doc.toString();
  }
  
  if (doc instanceof Date) {
    return doc;
  }
  
  if (typeof doc === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(doc)) {
      if (key === '_id') {
        serialized.id = toString(value);
      } else if (value instanceof ObjectId) {
        serialized[key] = toString(value);
      } else if (Array.isArray(value)) {
        serialized[key] = value.map(item => serializeDocument(item));
      } else if (value instanceof Date) {
        serialized[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        serialized[key] = serializeDocument(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }
  
  return doc;
}

/**
 * Load user with profile data
 * @param {Object} container - DI container
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function loadUserWithProfile(container, userId) {
  if (!userId) return null;
  const userModel = container.make('models/user');
  const user = await userModel.findById(userId, {
    _id: 1,
    name: 1,
    email: 1,
    photo: 1,
    role: 1,
    roleSubtype: 1
  });
  return user;
}

/**
 * Load post with related company and user
 * @param {Object} container - DI container
 * @param {string|ObjectId} postId - Post ID
 * @returns {Promise<Object|null>}
 */
export async function loadPostWithRelations(container, postId) {
  if (!postId) return null;
  
  const postModel = container.make('models/post');
  const userModel = container.make('models/user');
  const companyModel = container.make('models/company');
  
  // Get post
  const post = await postModel.findById(postId);
  if (!post) return null;
  
  // Load relations in parallel if they exist
  const promises = [];
  if (post.userId) {
    promises.push(userModel.findById(post.userId, { _id: 1, name: 1, photo: 1 }));
  } else {
    promises.push(Promise.resolve(null));
  }
  
  if (post.companyId) {
    promises.push(companyModel.findById(post.companyId, { _id: 1, name: 1, logo: 1 }));
  } else {
    promises.push(Promise.resolve(null));
  }
  
  const [user, company] = await Promise.all(promises);
  
  return { post, user, company };
}

/**
 * Load match with all related entities
 * @param {Object} container - DI container
 * @param {string|ObjectId} matchId - Match ID
 * @returns {Promise<Object|null>}
 */
export async function loadMatchWithRelations(container, matchId) {
  if (!matchId) return null;
  
  const matchModel = container.make('models/match');
  const userModel = container.make('models/user');
  const postModel = container.make('models/post');
  
  // Get match
  const match = await matchModel.findById(matchId);
  if (!match) return null;
  
  // Load relations in parallel
  const promises = [];
  if (match.candidateId) {
    promises.push(userModel.findById(match.candidateId));
  } else {
    promises.push(Promise.resolve(null));
  }
  
  if (match.recruiterId) {
    promises.push(userModel.findById(match.recruiterId));
  } else {
    promises.push(Promise.resolve(null));
  }
  
  if (match.postId) {
    promises.push(postModel.findById(match.postId));
  } else {
    promises.push(Promise.resolve(null));
  }
  
  const [candidate, recruiter, post] = await Promise.all(promises);
  
  return { match, candidate, recruiter, post };
}

/**
 * Load company with owner information
 * @param {Object} container - DI container
 * @param {string|ObjectId} companyId - Company ID
 * @returns {Promise<Object|null>}
 */
export async function loadCompanyWithOwner(container, companyId) {
  if (!companyId) return null;
  
  const companyModel = container.make('models/company');
  const userModel = container.make('models/user');
  
  // Get company
  const company = await companyModel.findById(companyId);
  if (!company) return null;
  
  // Load owner if exists
  let owner = null;
  if (company.profileOwnerId) {
    owner = await userModel.findById(company.profileOwnerId, {
      _id: 1,
      name: 1,
      email: 1
    });
  }
  
  return { company, owner };
}

/**
 * Batch load users by IDs
 * @param {Object} container - DI container
 * @param {Array<string|ObjectId>} userIds - Array of user IDs
 * @param {Object} projection - Fields to include
 * @returns {Promise<Array>}
 */
export async function batchLoadUsers(container, userIds, projection = {}) {
  if (!userIds || userIds.length === 0) return [];
  
  const userModel = container.make('models/user');
  const objectIds = userIds.map(id => toObjectId(id)).filter(id => id !== null);
  
  const users = await userModel.findMany({
    _id: { $in: objectIds }
  }, projection);
  
  return users;
}

/**
 * Batch load posts by IDs
 * @param {Object} container - DI container
 * @param {Array<string|ObjectId>} postIds - Array of post IDs
 * @param {Object} projection - Fields to include
 * @returns {Promise<Array>}
 */
export async function batchLoadPosts(container, postIds, projection = {}) {
  if (!postIds || postIds.length === 0) return [];
  
  const postModel = container.make('models/post');
  const objectIds = postIds.map(id => toObjectId(id)).filter(id => id !== null);
  
  const posts = await postModel.findMany({
    _id: { $in: objectIds }
  }, projection);
  
  return posts;
}
