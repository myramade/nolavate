import express from 'express';
import { getDatabase } from '../services/mongodb.js';
import { ApiResponse } from '../utils/response.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    const db = getDatabase();
    
    if (db) {
      try {
        await db.command({ ping: 1 });
        health.services.database = {
          status: 'connected',
          type: 'MongoDB'
        };
      } catch (error) {
        health.status = 'degraded';
        health.services.database = {
          status: 'error',
          type: 'MongoDB',
          error: error.message
        };
      }
    } else {
      health.status = 'degraded';
      health.services.database = {
        status: 'disconnected',
        type: 'MongoDB',
        message: 'Using mock data'
      };
    }
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
  }

  if (health.status === 'healthy') {
    return ApiResponse.success(res, health, 'Service is healthy', 200);
  } else {
    return ApiResponse.error(res, `Service is ${health.status}`, 503, [health]);
  }
});

router.get('/ready', async (req, res) => {
  try {
    const db = getDatabase();
    
    if (!db) {
      return ApiResponse.error(res, 'Database not ready', 503);
    }

    await db.command({ ping: 1 });
    
    return ApiResponse.success(res, { ready: true }, 'Service is ready');
  } catch (error) {
    return ApiResponse.error(res, 'Service not ready', 503);
  }
});

router.get('/live', (req, res) => {
  return ApiResponse.success(res, { live: true }, 'Service is live');
});

export default router;
