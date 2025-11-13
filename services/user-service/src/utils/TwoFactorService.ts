import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import argon2 from 'argon2';

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
    static async hashBackupCodes(codes: string[]): Promise<string> {
        // Hash each code individually
        const hashedCodes = await Promise.all(
            codes.map(code => argon2.hash(code))
        );
        return JSON.stringify(hashedCodes); // In production, hash these with argon2
    }

    // Verify backup code
    static async verifyBackupCode(code: string, hashedCodes: string): Promise<boolean> {
        try {
            const storedHashes: string[] = JSON.parse(hashedCodes);
            
            // Hash the input code and compare with stored hashes
            for (const storedHash of storedHashes) {
                try {
                    if (await argon2.verify(storedHash, code)) {
                        return true;
                    }
                } catch {
                    // If verification fails, continue to next hash
                    continue;
                }
            }
            return false;
        } catch {
            return false;
        }
    }
}