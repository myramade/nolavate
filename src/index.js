import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import container from './container.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { connectToMongoDB } from './services/mongodb.js';
import { generalApiRateLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

// Initialize MongoDB connection and container
await connectToMongoDB();
await container.initialize();

// Trust proxy - needed for rate limiting behind reverse proxies (Replit, DigitalOcean, etc.)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = config.isDevelopment 
      ? ['http://localhost:5000', 'http://127.0.0.1:5000']
      : process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// General API rate limiting
app.use('/api', generalApiRateLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(7);
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Import routers
import assessmentRoutes from './controllers/assessment/index.js';
import authRoutes from './controllers/auth/index.js';
import candidateRoutes from './controllers/candidate/index.js';
import jobOffersRoutes from './controllers/jobOffers/index.js';
import matchesRoutes from './controllers/matches/index.js';
import postsRoutes from './controllers/posts/index.js';
import prospectsRoutes from './controllers/prospects/index.js';
import recruiterRoutes from './controllers/recruiter/index.js';
import webRoutes from './controllers/web/index.js';

// API info route (for programmatic access)
app.get('/api', (req, res) => {
  res.json({
    name: 'Culture Forward API',
    version: '1.0.0',
    status: 'running',
    message: 'Welcome to Culture Forward - Recruitment & Job Matching Platform',
    endpoints: {
      health: '/health',
      authentication: '/auth',
      assessments: '/assessment',
      candidates: '/candidate',
      recruiters: '/recruiter',
      posts: '/posts',
      matches: '/matches',
      jobOffers: '/joboffers',
      prospects: '/prospects',
      companies: '/web'
    },
    documentation: 'https://github.com/myramade/nolavate'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Use routers with /api/v1 prefix
app.use('/api/v1/assessment', assessmentRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/joboffers', jobOffersRoutes);
app.use('/api/v1/matches', matchesRoutes);
app.use('/api/v1/posts', postsRoutes);
app.use('/api/v1/prospects', prospectsRoutes);
app.use('/api/v1/recruiter', recruiterRoutes);
app.use('/api/v1/web', webRoutes);

// Backward compatibility - keep old routes working
app.use('/assessment', assessmentRoutes);
app.use('/auth', authRoutes);
app.use('/candidate', candidateRoutes);
app.use('/joboffers', jobOffersRoutes);
app.use('/matches', matchesRoutes);
app.use('/posts', postsRoutes);
app.use('/prospects', prospectsRoutes);
app.use('/recruiter', recruiterRoutes);
app.use('/web', webRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      details: err.message,
      generatedAt: new Date().toISOString()
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Unauthorized',
      details: err.message,
      generatedAt: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: statusCode === 500 ? 'Internal Server Error' : err.message,
    generatedAt: new Date().toISOString()
  });
});

// 404 handler - Express 5 compatible wildcard route
app.use('/*splat', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    generatedAt: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});