
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import container from '../../container.js';
import validateRequest from '../../middleware/validateRequest.js';

const router = express.Router();

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
    const token = jwt.sign(
      { 
        sub: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleSubtype: user.roleSubtype
      },
      process.env.JWT_SECRET || 'your-secret-key',
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
    const token = jwt.sign(
      { 
        sub: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleSubtype: user.roleSubtype
      },
      process.env.JWT_SECRET || 'your-secret-key',
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
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
