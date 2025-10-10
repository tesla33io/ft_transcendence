import express from 'express';
import { Request, Response } from 'express';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../entities/User.js';
import { UserStatistics } from '../entities/UserStatistics.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to get EntityManager from request
declare global {
  namespace Express {
    interface Request {
      em: EntityManager;
      user?: User;
    }
  }
}

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded as User;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// GET /api/v1/users/me
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await req.em.findOne(User, { id: req.user!.id }, {
      populate: ['statistics']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const response = {
      id: user.id,
      username: user.username,
      role: user.role,
      profile: {
        avatarUrl: user.avatarUrl,
        onlineStatus: user.onlineStatus,
        activityType: user.activityType
      },
      stats: {
        totalGames: user.statistics.getItems()[0]?.totalGames || 0,
        wins: user.statistics.getItems()[0]?.wins || 0,
        losses: user.statistics.getItems()[0]?.losses || 0,
        draws: user.statistics.getItems()[0]?.draws || 0,
        averageGameDuration: user.statistics.getItems()[0]?.averageGameDuration || 0,
        longestGame: user.statistics.getItems()[0]?.longestGame || 0,
        bestWinStreak: user.statistics.getItems()[0]?.bestWinStreak || 0,
        currentRating: user.statistics.getItems()[0]?.currentRating || 1000,
        highestRating: user.statistics.getItems()[0]?.highestRating || 1000,
        ratingChange: user.statistics.getItems()[0]?.ratingChange || 0
      },
      twofa_enabled: user.twoFactorEnabled,
      last_login: user.lastLogin
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/users/me
router.patch('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { username, profile } = req.body;
    const user = await req.em.findOne(User, { id: req.user!.id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username is already taken (if changing username)
    if (username && username !== user.username) {
      const existingUser = await req.em.findOne(User, { username });
      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    // Update profile fields
    if (profile) {
      if (profile.avatarUrl !== undefined) user.avatarUrl = profile.avatarUrl;
      if (profile.onlineStatus !== undefined) user.onlineStatus = profile.onlineStatus;
      if (profile.activityType !== undefined) user.activityType = profile.activityType;
    }

    await req.em.persistAndFlush(user);

    res.json({ message: 'Profile updated successfully', user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/users/me/password
router.patch('/me/password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await req.em.findOne(User, { id: req.user!.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    user.passwordHash = newPasswordHash;

    await req.em.persistAndFlush(user);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/users/me/2fa/setup
router.post('/me/2fa/setup', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await req.em.findOne(User, { id: req.user!.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    // Generate cryptographically secure secret for 2FA
    const speakeasy = require('speakeasy');
    const tempSecret = speakeasy.generateSecret({
      name: `ft_transcendence (${user.username})`,
      issuer: 'ft_transcendence',
      length: 32
    });
    
    const otpauth_url = tempSecret.otpauth_url;
    
    // Generate cryptographically secure backup codes
    const crypto = require('crypto');
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store temporary secret and backup codes
    user.twoFactorSecret = tempSecret.base32;
    user.backupCodes = JSON.stringify(backupCodes);
    await req.em.persistAndFlush(user);

    res.json({
      otpauth_url,
      qr_data: `data:image/png;base64,${Buffer.from(otpauth_url).toString('base64')}`, // Simplified QR
      backup_codes: backupCodes
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/users/me/2fa/confirm
router.post('/me/2fa/confirm', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { otp, tempSecretToken } = req.body;

    if (!otp || !tempSecretToken) {
      return res.status(400).json({ error: 'OTP and temporary secret token are required' });
    }

    const user = await req.em.findOne(User, { id: req.user!.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify OTP using speakeasy
    const speakeasy = require('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otp,
      window: 2 // Allow 2 time steps before/after current time
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await req.em.persistAndFlush(user);

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Error confirming 2FA:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/users/me/2fa/disable
router.post('/me/2fa/disable', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { otp, recovery_code } = req.body;

    if (!otp && !recovery_code) {
      return res.status(400).json({ error: 'OTP or recovery code is required' });
    }

    const user = await req.em.findOne(User, { id: req.user!.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Verify OTP using speakeasy
    if (otp) {
      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: otp,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }
    }

    if (recovery_code) {
      const backupCodes = JSON.parse(user.backupCodes || '[]');
      if (!backupCodes.includes(recovery_code)) {
        return res.status(400).json({ error: 'Invalid recovery code' });
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.backupCodes = undefined;
    await req.em.persistAndFlush(user);

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/users/me
router.delete('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { password, otp } = req.body;

    if (!password && !otp) {
      return res.status(400).json({ error: 'Password or OTP is required' });
    }

    const user = await req.em.findOne(User, { id: req.user!.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    if (password) {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid password' });
      }
    }

    // Verify OTP if 2FA is enabled
    if (user.twoFactorEnabled && otp) {
      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: otp,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }
    }

    // Soft delete user (clear sensitive data and mark as deleted)
    user.username = `deleted_${user.id}_${Date.now()}`;
    user.passwordHash = '';
    user.twoFactorSecret = undefined;
    user.backupCodes = undefined;

    await req.em.persistAndFlush(user);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;