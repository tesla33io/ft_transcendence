import express from 'express';
import { Request, Response } from 'express';
import { EntityManager } from '@mikro-orm/core';
import { User, UserRole } from '../entities/User.js';
import { AuthService } from '../services/auth.js';

const router = express.Router();

// Middleware to get EntityManager from request
declare global {
  namespace Express {
    interface Request {
      em: EntityManager;
    }
  }
}

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await req.em.findOne(User, { username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await AuthService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await req.em.persistAndFlush(user);

    const token = await AuthService.generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, avatarUrl } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters'});
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long'});
    }

    // Check if user already exists
    const existingUser = await req.em.findOne(User, { username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create new user
    const user = new User();
    user.username = username;
    user.passwordHash = await AuthService.hashPassword(password);
    user.avatarUrl = avatarUrl; // Optional avatar URL
    user.role = UserRole.USER;
    user.twoFactorEnabled = false;

    await req.em.persistAndFlush(user);

    const token = await AuthService.generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;