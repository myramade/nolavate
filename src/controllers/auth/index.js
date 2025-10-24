
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import container from '../../container.js';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { config } from '../../config/env.js';
import { authRateLimiter, passwordResetRateLimiter } from '../../middleware/rateLimiter.js';
import { 
  validateSchema,
  registerSchema,
  loginSchema,
  googleOAuthSchema,
  appleOAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../../utils/validation.js';
import { requireObjectId } from '../../utils/safeObjectId.js';
import { generateAccessToken, generateRefreshToken, generatePasswordResetToken } from '../../utils/tokenManager.js';
import refreshToken from './refresh.js';
import logout from './logout.js';
import jwtAuth from '../../middleware/jwtAuth.js';

const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client();

// Config endpoint - Provides OAuth client IDs to frontend
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    appleClientId: process.env.APPLE_CLIENT_ID || null,
    appleRedirectUri: `${req.protocol}://${req.get('host')}/auth/apple/callback`
  });
});

// Register endpoint
router.post('/register', authRateLimiter, validateSchema(registerSchema), async (req, res) => {
  try {
    const { email, password, name, roleSubtype } = req.validatedBody;

    // Check if user already exists
    const existingUser = await container.make('models/user').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user - roleSubtype is validated, so safe to use
    const user = await container.make('models/user').create({
      _id: new ObjectId(),
      email,
      password: hashedPassword,
      name,
      role: 'USER',
      roleSubtype,  // Use validated roleSubtype from request
      createdTime: new Date(),
      isActive: true,
      isVerified: false
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      roleSubtype: user.roleSubtype
    });

    const refreshToken = generateRefreshToken();

    // Create session
    const sessionModel = container.make('models/session');
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    await sessionModel.createSession(user._id, refreshToken, deviceInfo);

    res.status(201).json({
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          roleSubtype: user.roleSubtype
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', authRateLimiter, validateSchema(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    // Find user
    const user = await container.make('models/user').findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      roleSubtype: user.roleSubtype
    });

    const refreshTokenValue = generateRefreshToken();

    // Create session
    const sessionModel = container.make('models/session');
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    await sessionModel.createSession(user._id, refreshTokenValue, deviceInfo);

    res.json({
      data: {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          roleSubtype: user.roleSubtype
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google OAuth Login
router.post('/google', authRateLimiter, validateSchema(googleOAuthSchema), async (req, res) => {
  try {
    const { idToken, state, nonce } = req.validatedBody;

    // Get Google Client ID from environment
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json({ message: 'Google OAuth not configured' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: googleClientId,
    });
    
    const payload = ticket.getPayload();
    
    // Verify nonce if provided (CSRF protection)
    if (nonce && payload.nonce !== nonce) {
      return res.status(401).json({ message: 'Invalid nonce - potential CSRF attack' });
    }
    
    const googleUserId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const picture = payload['picture'];

    // Find or create user
    let user = await container.make('models/user').findOne({ email });
    
    if (!user) {
      // Create new user with default role (SECURITY: Never trust client-supplied roles)
      user = await container.make('models/user').create({
        _id: new ObjectId(),
        email,
        name,
        googleId: googleUserId,
        profilePicture: picture,
        role: 'USER',
        roleSubtype: 'CANDIDATE',
        createdTime: new Date(),
        isActive: true,
        isVerified: true,
        authProvider: 'google'
      });
    } else {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        await container.make('models/user').update(
          { _id: user._id },
          { 
            googleId: googleUserId,
            profilePicture: picture,
            authProvider: 'google'
          }
        );
        user.googleId = googleUserId;
        user.profilePicture = picture;
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      roleSubtype: user.roleSubtype
    });

    const refreshTokenValue = generateRefreshToken();

    // Create session
    const sessionModel = container.make('models/session');
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    await sessionModel.createSession(user._id, refreshTokenValue, deviceInfo);

    res.json({
      data: {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          roleSubtype: user.roleSubtype,
          profilePicture: user.profilePicture
        }
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

// Apple Sign-In
router.post('/apple', authRateLimiter, validateSchema(appleOAuthSchema), async (req, res) => {
  try {
    const { idToken, code, nonce } = req.validatedBody;

    // Get Apple credentials from environment
    const appleClientId = process.env.APPLE_CLIENT_ID;
    if (!appleClientId) {
      return res.status(500).json({ message: 'Apple Sign-In not configured' });
    }

    let appleUserId, email, name;

    // Verify ID token
    if (idToken) {
      try {
        const appleData = await appleSignin.verifyIdToken(idToken, {
          audience: appleClientId,
          ignoreExpiration: false,
          nonce: nonce
        });
        
        appleUserId = appleData.sub;
        email = appleData.email;
        name = appleData.name;
      } catch (verifyError) {
        console.error('Apple ID token verification failed:', verifyError);
        return res.status(401).json({ message: 'Invalid Apple ID token' });
      }
    }

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Apple Sign-In' });
    }

    // Find or create user
    let user = await container.make('models/user').findOne({ email });
    
    if (!user) {
      // Create new user with default role (SECURITY: Never trust client-supplied roles)
      user = await container.make('models/user').create({
        _id: new ObjectId(),
        email,
        name: name || email.split('@')[0],
        appleId: appleUserId,
        role: 'USER',
        roleSubtype: 'CANDIDATE',
        createdTime: new Date(),
        isActive: true,
        isVerified: true,
        authProvider: 'apple'
      });
    } else {
      // Update existing user with Apple ID if not set
      if (!user.appleId) {
        await container.make('models/user').update(
          { _id: user._id },
          { 
            appleId: appleUserId,
            authProvider: 'apple'
          }
        );
        user.appleId = appleUserId;
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      roleSubtype: user.roleSubtype
    });

    const refreshTokenValue = generateRefreshToken();

    // Create session
    const sessionModel = container.make('models/session');
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    await sessionModel.createSession(user._id, refreshTokenValue, deviceInfo);

    res.json({
      data: {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          roleSubtype: user.roleSubtype
        }
      }
    });
  } catch (error) {
    console.error('Apple Sign-In error:', error);
    res.status(401).json({ message: 'Apple authentication failed' });
  }
});

// Forgot Password - Generate reset token
router.post('/forgot-password', passwordResetRateLimiter, validateSchema(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.validatedBody;

    // Find user
    const user = await container.make('models/user').findOne({ email });
    
    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return res.json({
        message: 'If an account exists with that email, a reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken({
      sub: user._id.toString(),
      email: user.email
    });

    // Store reset token and expiry in user record
    await container.make('models/user').update(
      user._id,
      {
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
      }
    );

    // Generate reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
    
    // TODO: Send reset URL via email in production
    // For development/testing, log to console (DO NOT return in response for security)
    // Show reset link in development or Replit environment (when no email service is configured)
    const isReplit = process.env.REPL_ID || process.env.REPLIT_DB_URL;
    if (process.env.NODE_ENV === 'development' || isReplit) {
      console.log('\n=== PASSWORD RESET LINK ===');
      console.log(`Email: ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Expires in: 1 hour`);
      console.log('===========================\n');
    }
    
    // Always return generic success message for security
    res.json({
      message: 'If an account exists with that email, a password reset link has been sent. Please check your email.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

// Reset Password - Verify token and update password
router.post('/reset-password', passwordResetRateLimiter, validateSchema(resetPasswordSchema), async (req, res) => {
  try {
    const { token, password } = req.validatedBody;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    // Verify token type
    if (decoded.type !== 'password_reset') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Find user and verify token matches (with safe ObjectId conversion)
    const userId = requireObjectId(decoded.sub, 'user ID');
    const user = await container.make('models/user').findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordToken !== token) {
      return res.status(401).json({ message: 'Token has already been used or is invalid' });
    }

    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
      return res.status(401).json({ message: 'Reset token has expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await container.make('models/user').update(
      user._id,
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    );

    res.json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Token refresh endpoint
router.post('/refresh', authRateLimiter, refreshToken);

// Logout endpoint
router.post('/logout', logout);

// Get active sessions endpoint
router.get('/sessions', jwtAuth(container.make('roles').user), async (req, res) => {
  try {
    const sessionModel = container.make('models/session');
    const sessions = await sessionModel.getUserActiveSessions(req.token.sub);
    
    res.json({
      data: sessions.map(session => ({
        id: session._id.toString(),
        deviceInfo: session.deviceInfo,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt
      }))
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Failed to retrieve sessions' });
  }
});

// Revoke all sessions endpoint (useful for "logout from all devices")
router.post('/sessions/revoke-all', jwtAuth(container.make('roles').user), async (req, res) => {
  try {
    const sessionModel = container.make('models/session');
    await sessionModel.revokeAllUserSessions(req.token.sub);
    
    res.json({ message: 'All sessions have been revoked' });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    res.status(500).json({ message: 'Failed to revoke sessions' });
  }
});

export default router;
