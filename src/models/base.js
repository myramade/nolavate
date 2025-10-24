import { ObjectId } from 'mongodb';
import { safeObjectId } from '../utils/safeObjectId.js';

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
    try {
      const result = await this.db.collection(this.collection).insertOne(data);
      return { ...data, _id: result.insertedId };
    } catch (error) {
      console.error(`Database error in ${this.collection}.create:`, error.message);
      throw error;
    }
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
    try {
      return await this.db.collection(this.collection).findOne(query);
    } catch (error) {
      console.error(`Database error in ${this.collection}.findOne:`, error.message);
      throw error;
    }
  }

  async findById(id, select = {}) {
    if (!this.db) return null;
    
    // Safe ObjectId conversion
    const result = safeObjectId(id);
    if (!result.success) {
      console.error(`Invalid ID in findById: ${result.error}`);
      return null;
    }
    
    return await this.db.collection(this.collection).findOne(
      { _id: result.value },
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

  async findManyAnd(whereArray, select = {}, sortBy = null, limit = -1, skip = 0) {
    if (!this.db) return [];
    
    const query = this.db.collection(this.collection).find({
      $and: whereArray
    });
    
    if (Object.keys(select).length > 0) {
      query.project(select);
    }
    
    if (sortBy) {
      query.sort(sortBy);
    }
    
    if (skip > 0) {
      query.skip(skip);
    }
    
    if (limit > 0) {
      query.limit(limit);
    }
    
    return await query.toArray();
  }

  async update(query, updateData) {
    if (!this.db) return { ...updateData, _id: query };
    
    try {
      // Handle both ID and query object for backward compatibility
      let filter;
      if (typeof query === 'string' || query instanceof ObjectId) {
        // Simple ID - convert to ObjectId
        const result = safeObjectId(query);
        if (!result.success) {
          console.error(`Invalid ID in update: ${result.error}`);
          return null;
        }
        filter = { _id: result.value };
      } else if (typeof query === 'object') {
        // Query object - normalize _id field if present
        filter = { ...query };
        if (filter._id && typeof filter._id === 'string') {
          const result = safeObjectId(filter._id);
          if (!result.success) {
            console.error(`Invalid _id in filter: ${result.error}`);
            return null;
          }
          filter._id = result.value;
        }
      } else {
        console.error(`Invalid query type in update: ${typeof query}`);
        return null;
      }
      
      const updateResult = await this.db.collection(this.collection).updateOne(
        filter,
        { $set: updateData }
      );
      
      if (updateResult.modifiedCount > 0) {
        // Return updated document
        return await this.db.collection(this.collection).findOne(filter);
      }
      return null;
    } catch (error) {
      console.error(`Database error in ${this.collection}.update:`, error.message);
      throw error;
    }
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

  async deleteMany(query = {}) {
    if (!this.db) {
      const storage = memoryStorage.get(this.collection);
      // Delete matching records from memory storage
      let deletedCount = 0;
      for (const [id, record] of storage.entries()) {
        let matches = true;
        for (const [key, value] of Object.entries(query)) {
          if (record[key] !== value) {
            matches = false;
            break;
          }
        }
        if (matches) {
          storage.delete(id);
          deletedCount++;
        }
      }
      return { deletedCount };
    }
    try {
      const result = await this.db.collection(this.collection).deleteMany(query);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      console.error(`Database error in ${this.collection}.deleteMany:`, error.message);
      throw error;
    }
  }

  async count(where = {}) {
    if (!this.db) return 0;
    return await this.db.collection(this.collection).countDocuments(where);
  }

  async findFirst(where = {}, select = {}, sortBy = null, order = 'asc', limit = 1) {
    if (!this.db) return null;
    const query = this.db.collection(this.collection).find(where);
    
    if (Object.keys(select).length > 0) {
      query.project(select);
    }
    
    if (sortBy) {
      query.sort({ [sortBy]: order === 'desc' ? -1 : 1 });
    }
    
    query.limit(limit);
    
    const results = await query.toArray();
    return results.length > 0 ? results[0] : null;
  }

  async createMany(records) {
    if (!this.db) {
      const storage = memoryStorage.get(this.collection);
      const insertedRecords = [];
      for (const record of records) {
        const id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRecord = { ...record, _id: id };
        storage.set(id, newRecord);
        insertedRecords.push(newRecord);
      }
      return { insertedCount: insertedRecords.length, insertedRecords };
    }
    try {
      const result = await this.db.collection(this.collection).insertMany(records);
      return { insertedCount: result.insertedCount, insertedIds: result.insertedIds };
    } catch (error) {
      console.error(`Database error in ${this.collection}.createMany:`, error.message);
      throw error;
    }
  }

  async increment(where, field, amount = 1) {
    if (!this.db) return null;
    try {
      const result = await this.db.collection(this.collection).updateOne(
        where,
        { $inc: { [field]: amount } }
      );
      if (result.modifiedCount > 0) {
        return await this.findOne(where);
      }
      return null;
    } catch (error) {
      console.error(`Database error in ${this.collection}.increment:`, error.message);
      throw error;
    }
  }

  async decrement(where, field, amount = 1) {
    if (!this.db) return null;
    try {
      const result = await this.db.collection(this.collection).updateOne(
        where,
        { $inc: { [field]: -amount } }
      );
      if (result.modifiedCount > 0) {
        return await this.findOne(where);
      }
      return null;
    } catch (error) {
      console.error(`Database error in ${this.collection}.decrement:`, error.message);
      throw error;
    }
  }
}
