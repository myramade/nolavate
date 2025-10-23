# MongoDB Migration Playbook
**Purpose:** Guide for converting Prisma ORM syntax to MongoDB native driver  
**Target:** Culture Forward API Controllers

## Core Principles

### 1. No Nested Relations
MongoDB native driver does NOT support Prisma's nested queries. Always use **separate queries + manual joins**.

### 2. ObjectId Handling
- **Input:** Convert strings to ObjectId for queries: `new ObjectId(stringId)`
- **Output:** Convert ObjectId to strings for JSON: `objectId.toString()`

### 3. Explicit Over Implicit
- Make all database queries explicit
- No magic relation loading
- Manual data shaping for responses

## Common Patterns & Solutions

### Pattern 1: Nested Select → Separate Queries

#### ❌ BEFORE (Prisma)
```javascript
const post = await postModel.findOne({
  id: postId
}, {
  id: true,
  title: true,
  user: {
    select: {
      id: true,
      name: true,
      photo: {
        select: {
          streamUrl: true
        }
      }
    }
  }
});
```

#### ✅ AFTER (MongoDB)
```javascript
import { ObjectId } from 'mongodb';

// Query 1: Get post
const post = await postModel.findById(postId, {
  _id: 1,
  title: 1,
  userId: 1
});

// Query 2: Get related user (if needed)
let user = null;
if (post && post.userId) {
  user = await userModel.findById(post.userId, {
    _id: 1,
    name: 1,
    photo: 1
  });
}

// Manual join
const result = {
  id: post._id.toString(),
  title: post.title,
  user: user ? {
    id: user._id.toString(),
    name: user.name,
    photo: user.photo?.streamUrl || null
  } : null
};
```

### Pattern 2: Connect Relations → Direct Field Assignment

#### ❌ BEFORE (Prisma)
```javascript
await postModel.create({
  title: 'Job Title',
  user: {
    connect: {
      id: userId
    }
  }
});
```

#### ✅ AFTER (MongoDB)
```javascript
import { ObjectId } from 'mongodb';

await postModel.create({
  title: 'Job Title',
  userId: new ObjectId(userId),  // Direct field assignment
  createdTime: new Date()
});
```

### Pattern 3: Filter with 'is' → MongoDB Operators

#### ❌ BEFORE (Prisma)
```javascript
const posts = await postModel.findMany({
  user: {
    is: {
      id: userId
    }
  }
}, {
  id: true,
  title: true
});
```

#### ✅ AFTER (MongoDB)
```javascript
import { ObjectId } from 'mongodb';

const posts = await postModel.findMany({
  userId: new ObjectId(userId)  // Direct field comparison
}, {
  _id: 1,
  title: 1
});

// Serialize ObjectIds for response
const results = posts.map(post => ({
  id: post._id.toString(),
  title: post.title
}));
```

### Pattern 4: Complex Where Clauses → MongoDB Query Operators

#### ❌ BEFORE (Prisma)
```javascript
const matches = await matchModel.findMany({
  AND: {
    candidate: {
      is: {
        id: candidateId
      }
    },
    recruiter: {
      is: {
        id: recruiterId
      }
    },
    accepted: true
  }
});
```

#### ✅ AFTER (MongoDB)
```javascript
import { ObjectId } from 'mongodb';

const matches = await matchModel.findMany({
  candidateId: new ObjectId(candidateId),
  recruiterId: new ObjectId(recruiterId),
  accepted: true
});
```

### Pattern 5: Count Relations → Separate Count Query

#### ❌ BEFORE (Prisma)
```javascript
const post = await postModel.findOne({
  id: postId
}, {
  id: true,
  title: true,
  _count: {
    select: {
      matches: true
    }
  }
});
```

#### ✅ AFTER (MongoDB)
```javascript
import { ObjectId } from 'mongodb';

// Query 1: Get post
const post = await postModel.findById(postId, {
  _id: 1,
  title: 1
});

// Query 2: Count related matches
const matchCount = await matchModel.count({
  postId: new ObjectId(postId)
});

// Combine results
const result = {
  id: post._id.toString(),
  title: post.title,
  matchCount: matchCount
};
```

## Helper Utilities

### Create: `src/utils/mongoHelpers.js`

```javascript
import { ObjectId } from 'mongodb';

/**
 * Convert string ID to ObjectId, handling nulls and ObjectId instances
 */
export function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  return new ObjectId(id);
}

/**
 * Convert ObjectId to string, handling nulls
 */
export function toString(objectId) {
  if (!objectId) return null;
  if (typeof objectId === 'string') return objectId;
  return objectId.toString();
}

/**
 * Serialize document for JSON response (converts all _id fields to strings)
 */
export function serializeDocument(doc) {
  if (!doc) return null;
  if (Array.isArray(doc)) {
    return doc.map(serializeDocument);
  }
  if (typeof doc === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(doc)) {
      if (key === '_id') {
        serialized.id = toString(value);
      } else if (value instanceof ObjectId) {
        serialized[key] = toString(value);
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
 * Load user with related profile data
 */
export async function loadUserWithProfile(container, userId) {
  if (!userId) return null;
  const userModel = container.make('models/user');
  return await userModel.findById(userId, {
    _id: 1,
    name: 1,
    email: 1,
    photo: 1,
    role: 1,
    roleSubtype: 1
  });
}

/**
 * Load post with related company and user
 */
export async function loadPostWithRelations(container, postId) {
  if (!postId) return null;
  
  const postModel = container.make('models/post');
  const userModel = container.make('models/user');
  const companyModel = container.make('models/company');
  
  // Get post
  const post = await postModel.findById(postId);
  if (!post) return null;
  
  // Load relations in parallel
  const [user, company] = await Promise.all([
    post.userId ? userModel.findById(post.userId, { _id: 1, name: 1, photo: 1 }) : null,
    post.companyId ? companyModel.findById(post.companyId, { _id: 1, name: 1, logo: 1 }) : null
  ]);
  
  return { post, user, company };
}

/**
 * Load match with all related entities
 */
export async function loadMatchWithRelations(container, matchId) {
  if (!matchId) return null;
  
  const matchModel = container.make('models/match');
  const userModel = container.make('models/user');
  const postModel = container.make('models/post');
  
  // Get match
  const match = await matchModel.findById(matchId);
  if (!match) return null;
  
  // Load relations
  const [candidate, recruiter, post] = await Promise.all([
    match.candidateId ? userModel.findById(match.candidateId) : null,
    match.recruiterId ? userModel.findById(match.recruiterId) : null,
    match.postId ? postModel.findById(match.postId) : null
  ]);
  
  return { match, candidate, recruiter, post };
}
```

## Controller Refactoring Checklist

For each controller:

### 1. Pre-Refactor Analysis
- [ ] List all Prisma syntax patterns used
- [ ] Identify all relations being queried
- [ ] Document expected input/output shape

### 2. Code Changes
- [ ] Replace nested `select:` with separate queries
- [ ] Replace `connect:` with direct field assignment using ObjectId
- [ ] Replace `is:` filters with direct field comparisons
- [ ] Replace `where:`, `skip:`, `take:` with BaseModel parameters
- [ ] Add ObjectId imports: `import { ObjectId } from 'mongodb'`
- [ ] Convert string IDs to ObjectId for queries
- [ ] Serialize ObjectId to strings in responses

### 3. Testing
- [ ] Server starts without errors
- [ ] Endpoint returns 200/201 status
- [ ] Response shape matches expected format
- [ ] All fields present (no undefined/null where unexpected)
- [ ] Test with valid data
- [ ] Test with invalid data (404, 400 errors)

### 4. Verification
- [ ] No Prisma syntax remains (`select:`, `connect:`, `is:`, `where:`)
- [ ] All `_id` fields serialized to strings
- [ ] Error handling preserved
- [ ] Logging preserved
- [ ] No console errors in logs

## Priority Order

### Phase 1: Critical (Week 1)
1. Post controllers (create, update, view, like)
2. Match controllers (get matches, create match)
3. Company controllers (create, update, view)

### Phase 2: Important (Week 2)
4. Job offer controllers
5. Metrics controllers
6. Recruiter prospect/match controllers

### Phase 3: Nice-to-Have (Week 3)
7. Remaining post utilities
8. Additional match features
9. Analytics endpoints

## Common Pitfalls

### ❌ Forgetting ObjectId Conversion
```javascript
// WRONG - string comparison won't match ObjectId in database
const user = await userModel.findOne({ _id: userId });

// CORRECT
const user = await userModel.findOne({ _id: new ObjectId(userId) });
```

### ❌ Not Serializing Response
```javascript
// WRONG - ObjectId instances cause JSON errors
res.json({ user: { id: user._id } });

// CORRECT
res.json({ user: { id: user._id.toString() } });
```

### ❌ Assuming Relations Exist
```javascript
// WRONG - will fail if post.userId is null
const user = await userModel.findById(post.userId);
const userName = user.name;

// CORRECT - defensive coding
const user = post.userId ? await userModel.findById(post.userId) : null;
const userName = user?.name || 'Unknown';
```

## Testing Strategy

### 1. Unit Tests (Per Controller)
```javascript
describe('POST /api/v1/posts/create', () => {
  it('should create post with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/posts/create')
      .send({ title: 'Test', description: 'Test' })
      .expect(201);
    
    expect(response.body.data).toHaveProperty('id');
    expect(typeof response.body.data.id).toBe('string');
  });
});
```

### 2. Integration Tests (End-to-End)
```javascript
describe('Job Posting Flow', () => {
  it('should create post, view post, like post', async () => {
    // Create
    const createRes = await createPost(token);
    const postId = createRes.body.data.id;
    
    // View
    const viewRes = await viewPost(postId);
    expect(viewRes.status).toBe(200);
    
    // Like
    const likeRes = await likePost(postId, token);
    expect(likeRes.status).toBe(200);
  });
});
```

## Success Metrics

- ✅ Zero Prisma syntax in codebase
- ✅ All endpoints return proper status codes
- ✅ All ObjectId fields serialized to strings
- ✅ No MongoDB query errors in logs
- ✅ Response times < 500ms for simple queries
- ✅ All core user flows functional

---

**Next Steps:** Start with Phase 1 controllers, use helper utilities, test thoroughly before moving to next phase.
