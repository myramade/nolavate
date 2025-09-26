import express from 'express';
import container from './container.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Use routers
app.use('/assessment', assessmentRoutes);
app.use('/auth', authRoutes);
app.use('/candidate', candidateRoutes);
app.use('/joboffers', jobOffersRoutes);
app.use('/matches', matchesRoutes);
app.use('/posts', postsRoutes);
app.use('/prospects', prospectsRoutes);
app.use('/recruiter', recruiterRoutes);
app.use('/web', webRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

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