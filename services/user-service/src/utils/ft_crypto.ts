import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TOTPGenerator, TwoFAToken } from './totp';
import * as argon2 from 'argon2';

export interface AccessToken {
    userId: number;
    username: string;
    role: string;
    type: 'access';
    iat: number;
    exp: number;
}

export class CryptoUtils {
    // TODO: hardcoded for now, will be changed in the future
    private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'testing_encryption_key';
    private static readonly JWT_SECRET = process.env.JWT_SECRET || 'testing_jwt_secret';
    private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'testing_jwt_refresh_secret';
    private static readonly IV_LENGTH = 16; // AES block size

    static generateTOTPSecret(): string {
        return TOTPGenerator.generateSecret(32);
    }

    static encryptSecret(secret: string): string {
        const iv = crypto.randomBytes(this.IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.ENCRYPTION_KEY, iv);
        cipher.setAutoPadding(true);

        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Prepend IV to encrypted data
        return iv.toString('hex') + ':' + encrypted;
    }

    static decryptSecret(encryptedData: string): string {
        const parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0]!, 'hex');
        const encryptedSecret: string = parts[1]!;

        const decipher = crypto.createDecipheriv('aes-256-cbc', this.ENCRYPTION_KEY, iv);
        decipher.setAutoPadding(true);

        let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    static verifyTOTP(secret: string, token: string): boolean {
        return TOTPGenerator.verifyTOTP(secret, token);
    }

    static generateOTPAuthURL(secret: string, username: string, issuer: string = 'marvin'): string {
        return TOTPGenerator.generateOTPAuthURL(secret, username, issuer);
    }

    static generateRecoveryCodes(count: number = 8): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            const code = `${this.randomDigits(4)}-${this.randomDigits(4)}`;
            codes.push(code);
        }
        return codes;
    }

    private static randomDigits(length: number): string {
        return crypto.randomInt(0, Math.pow(10, length))
        .toString()
        .padStart(length, '0');
    }

    static async hashRecoveryCode(code: string): Promise<string> {
        return await argon2.hash(code);
    }

    static async verifyRecoveryCode(code: string, hash: string): Promise<boolean> {
        return await argon2.verify(hash, code);
    }

    static signTwoFAToken(userId: number): string {
        const payload: Omit<TwoFAToken, 'iat' | 'exp'> = {
            userId,
            type: 'twofa_challenge'
        };

        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: '5m',  // minutes
            issuer: 'marvin'
        });
    }

    static signAccessToken(userId: number, username: string, role: string): string {
        const payload: Omit<AccessToken, 'iat' | 'exp'> = {
            userId,
            username,
            role,
            type: 'access'
        };

        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: '15m',  // minutes
            issuer: 'marvin'
        });
    }

    static signRefreshToken(userId: number): string {
        return jwt.sign(
            { userId, type: 'refresh' },
            this.JWT_REFRESH_SECRET,
            {
                expiresIn: '7d',
                issuer: 'marvin'
            }
        );
    }

    static verifyTwoFAToken(token: string): TwoFAToken | null {
        try {
            return jwt.verify(token, this.JWT_SECRET) as TwoFAToken;
        } catch {
            return null;
        }
    }

    static verifyAccessToken(token: string): AccessToken | null {
        try {
            return jwt.verify(token, this.JWT_SECRET) as AccessToken;
        } catch {
            return null;
        }
    }
}


