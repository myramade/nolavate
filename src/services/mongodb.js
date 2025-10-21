import { MongoClient } from 'mongodb';
import { config } from '../config/env.js';

let db = null;
let client = null;

export async function connectToMongoDB() {
  try {
    const mongoUrl = process.env.MONGODB_URL || process.env.DATABASE_URL;
    
    if (!mongoUrl) {
      console.warn('No MongoDB URL found. Using mock database.');
      return null;
    }

    console.log('Attempting to connect to MongoDB...');

    const options = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    };

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
    console.error('Failed to connect to MongoDB:', error.message);
    console.error('Error details:', error);
    console.warn('Continuing without database connection. API will use mock data.');
    return null;
  }
}

export function getDatabase() {
  return db;
}

process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});

export { db };
