
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import container from '../../container.js';
import validateRequest from '../../middleware/validateRequest.js';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';

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
router.post('/register', validateRequest, async (req, res) => {
  try {
    const { email, password, name, role, roleSubtype } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await container.make('models/user').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await container.make('models/user').create({
      _id: new ObjectId(),
      email,
      password: hashedPassword,
      name,
      role: role || 'USER',
      roleSubtype: roleSubtype || 'CANDIDATE',
      createdTime: new Date(),
      isActive: true,
      isVerified: false
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_TOKEN_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET or SESSION_TOKEN_SECRET must be configured');
    }
    
    const token = jwt.sign(
      { 
        sub: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleSubtype: user.roleSubtype
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      data: {
        accessToken: token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          roleSubtype: user.roleSubtype
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Return more helpful error in development
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error.message 
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

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

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_TOKEN_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET or SESSION_TOKEN_SECRET must be configured');
    }
    
    const token = jwt.sign(
      { 
        sub: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleSubtype: user.roleSubtype
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      data: {
        accessToken: token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          roleSubtype: user.roleSubtype
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Return more helpful error in development
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error.message 
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google OAuth Login
router.post('/google', validateRequest, async (req, res) => {
  try {
    const { idToken, roleSubtype } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ message: 'ID token required' });
    }

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
    const googleUserId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const picture = payload['picture'];

    // Find or create user
    let user = await container.make('models/user').findOne({ email });
    
    if (!user) {
      // Create new user
      user = await container.make('models/user').create({
        _id: new ObjectId(),
        email,
        name,
        googleId: googleUserId,
        profilePicture: picture,
        role: 'USER',
        roleSubtype: roleSubtype || 'CANDIDATE',
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
      }
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_TOKEN_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET or SESSION_TOKEN_SECRET must be configured');
    }
    
    const token = jwt.sign(
      { 
        sub: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleSubtype: user.roleSubtype
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      data: {
        accessToken: token,
        user: {
          id: user._id,
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
router.post('/apple', validateRequest, async (req, res) => {
  try {
    const { idToken, code, roleSubtype } = req.body;
    
    if (!idToken && !code) {
      return res.status(400).json({ message: 'ID token or authorization code required' });
    }

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
          ignoreExpiration: false
        });
        
        appleUserId = appleData.sub;
        email = appleData.email;
      } catch (verifyError) {
        console.error('Apple ID token verification failed:', verifyError);
        return res.status(401).json({ message: 'Invalid Apple ID token' });
      }
    }

    // Find or create user
    let user = await container.make('models/user').findOne({ email });
    
    if (!user) {
      // Create new user
      user = await container.make('models/user').create({
        _id: new ObjectId(),
        email,
        name: name || email.split('@')[0],
        appleId: appleUserId,
        role: 'USER',
        roleSubtype: roleSubtype || 'CANDIDATE',
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

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_TOKEN_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET or SESSION_TOKEN_SECRET must be configured');
    }
    
    const token = jwt.sign(
      { 
        sub: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleSubtype: user.roleSubtype
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      data: {
        accessToken: token,
        user: {
          id: user._id,
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

export default router;
