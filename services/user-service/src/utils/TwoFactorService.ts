import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

export class TwoFactorService {
    // Generate TOTP secret for authenticator apps
    static async generateTOTPSecret(username: string, issuer: string = 'Pong Game'): Promise<{
        secret: string;
        qrCodeUrl: string;
    }> {
        const secret = speakeasy.generateSecret({
            name: `${issuer} (${username})`,
            issuer: issuer,
            length: 32
        });

        // Generate QR code image as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

        return {
            secret: secret.base32,
            qrCodeUrl: qrCodeDataUrl  // This is now a data URL like "data:image/png;base64,..."
        };
    }

    // Verify TOTP code
    static verifyTOTP(token: string, secret: string): boolean {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps (60 seconds) of drift
        });
    }

    // Generate 6-digit email/SMS code
    static generateCode(): string {
        return crypto.randomInt(100000, 999999).toString();
    }

    // Generate backup codes (8 codes, 8 digits each)
    static generateBackupCodes(count: number = 8): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            codes.push(crypto.randomInt(10000000, 99999999).toString());
        }
        return codes;
    }

    // Hash backup codes for storage
    static hashBackupCodes(codes: string[]): string {
        return JSON.stringify(codes); // In production, hash these with argon2
    }

    // Verify backup code
    static verifyBackupCode(code: string, hashedCodes: string): boolean {
        try {
            const codes: string[] = JSON.parse(hashedCodes);
            return codes.includes(code);
        } catch {
            return false;
        }
    }
}