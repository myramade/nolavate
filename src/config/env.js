import dotenv from 'dotenv';

dotenv.config();

function validateConfig() {
  const errors = [];
  const warnings = [];

  // Required: JWT Secret
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET environment variable is required');
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long for security');
  } else if (process.env.JWT_SECRET === 'your-secret-key-here') {
    errors.push('JWT_SECRET is set to the default example value. Change it immediately!');
  }

  // Required: Database URL
  if (!process.env.DATABASE_URL && !process.env.MONGODB_URL) {
    warnings.push('DATABASE_URL not set. Server will use mock data (not suitable for production)');
  }

  // Validate PORT
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a valid port number (1-65535)');
    }
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test', 'staging'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    warnings.push(`NODE_ENV="${process.env.NODE_ENV}" is not a standard value. Use: ${validEnvs.join(', ')}`);
  }

  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL && !process.env.MONGODB_URL) {
      errors.push('DATABASE_URL is required in production');
    }

    if (!process.env.ALLOWED_ORIGINS) {
      warnings.push('ALLOWED_ORIGINS not set. CORS will only allow requests from the server itself');
    }

    if (process.env.JWT_EXPIRES_IN === '24h' || !process.env.JWT_EXPIRES_IN) {
      warnings.push('JWT_EXPIRES_IN is set to 24h. Consider shorter expiry times for production');
    }
  }

  // OAuth warnings (optional features)
  if (!process.env.GOOGLE_CLIENT_ID) {
    warnings.push('GOOGLE_CLIENT_ID not set. Google OAuth will be disabled');
  }

  if (!process.env.APPLE_CLIENT_ID) {
    warnings.push('APPLE_CLIENT_ID not set. Apple Sign-In will be disabled');
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('');
  }

  // Display errors and exit if any
  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease set the required environment variables and restart the server.');
    process.exit(1);
  }

  // Success message
  if (warnings.length === 0) {
    console.log('✅ Environment configuration validated successfully');
  }
}

validateConfig();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || process.env.MONGODB_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  oauth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    appleClientId: process.env.APPLE_CLIENT_ID || null
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []
  },
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
};
