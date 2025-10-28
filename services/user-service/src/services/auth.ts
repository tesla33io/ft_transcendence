import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../entities/User.js';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN: SignOptions['expiresIn'] = 
(process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '24h';


export class AuthService {
  static async generateToken(user: User): Promise<string> {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
