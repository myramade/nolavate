import { MongoClient } from 'mongodb';
import { config } from '../config/env.js';

let db = null;
let client = null;

export async function connectToMongoDB(maxRetries = 3, initialDelay = 2000) {
  const mongoUrl = process.env.MONGODB_URL || process.env.DATABASE_URL;
  
  if (!mongoUrl) {
    console.warn('No MongoDB URL found. Using mock database.');
    return null;
  }

  const options = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
  };

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to connect to MongoDB (attempt ${attempt}/${maxRetries})...`);
      
      client = new MongoClient(mongoUrl, options);
      await client.connect();
      
      // Extract database name from connection string or use default
      const dbName = mongoUrl.split('/').pop().split('?')[0] || 'culture_forward';
      db = client.db(dbName);
      
      // Test the connection
      await db.command({ ping: 1 });
      
      console.log(`Successfully connected to MongoDB database: ${dbName}`);
      return db;
    } catch (error) {
      console.error(`Connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      // Clean up failed client
      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          // Ignore close errors
        }
        client = null;
      }
      
      // If this was the last attempt, give up
      if (attempt === maxRetries) {
        console.error('All connection attempts failed. Error details:', error);
        console.warn('Continuing without database connection. API will use mock data.');
        return null;
      }
      
      // Wait before retrying with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

export function getDatabase() {
  return db;
}

export function getClient() {
  return client;
}

export async function closeConnection() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
    db = null;
    client = null;
  }
}

export { db, client };
