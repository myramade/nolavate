
import { Client, Pool } from 'pg';

class DatabaseService {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }
    return this.pool;
  }

  async query(text, params) {
    const pool = await this.connect();
    return pool.query(text, params);
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

export default new DatabaseService();
