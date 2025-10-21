// In-memory storage for when database is not available
const memoryStorage = new Map();

export default class BaseModel {
  constructor(database, collectionName) {
    this.db = database;
    this.collection = collectionName;
    
    // Initialize memory storage for this collection
    if (!memoryStorage.has(collectionName)) {
      memoryStorage.set(collectionName, new Map());
    }
  }

  async create(data) {
    if (!this.db) {
      const id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const record = { ...data, _id: id };
      const storage = memoryStorage.get(this.collection);
      storage.set(id, record);
      return record;
    }
    const result = await this.db.collection(this.collection).insertOne(data);
    return { ...data, _id: result.insertedId };
  }

  async findOne(query) {
    if (!this.db) {
      const storage = memoryStorage.get(this.collection);
      // Simple query matching for common cases
      for (const [id, record] of storage.entries()) {
        let matches = true;
        for (const [key, value] of Object.entries(query)) {
          if (record[key] !== value) {
            matches = false;
            break;
          }
        }
        if (matches) return record;
      }
      return null;
    }
    return await this.db.collection(this.collection).findOne(query);
  }

  async findById(id, select = {}) {
    if (!this.db) return null;
    return await this.db.collection(this.collection).findOne(
      { _id: id },
      { projection: select }
    );
  }

  async findMany(where = {}, select = {}, limit = -1, skip = 0, sortBy = 'createdTime', order = 'desc') {
    if (!this.db) return [];
    
    const query = this.db.collection(this.collection).find(where);
    
    if (Object.keys(select).length > 0) {
      query.project(select);
    }
    
    if (sortBy) {
      query.sort({ [sortBy]: order === 'desc' ? -1 : 1 });
    }
    
    if (skip > 0) {
      query.skip(skip);
    }
    
    if (limit > 0) {
      query.limit(limit);
    }
    
    return await query.toArray();
  }

  async findManyOr(whereArray) {
    if (!this.db) return [];
    return await this.db.collection(this.collection).find({
      $or: whereArray
    }).toArray();
  }

  async update(id, updateData) {
    if (!this.db) return { ...updateData, _id: id };
    const result = await this.db.collection(this.collection).updateOne(
      { _id: id },
      { $set: updateData }
    );
    if (result.modifiedCount > 0) {
      return await this.findById(id);
    }
    return null;
  }

  async updateById(id, updateData) {
    return await this.update(id, updateData);
  }

  async delete(id) {
    if (!this.db) return { _id: id };
    const result = await this.db.collection(this.collection).deleteOne({ _id: id });
    return result.deletedCount > 0 ? { _id: id } : null;
  }

  async deleteById(id) {
    return await this.delete(id);
  }

  async count(where = {}) {
    if (!this.db) return 0;
    return await this.db.collection(this.collection).countDocuments(where);
  }
}
