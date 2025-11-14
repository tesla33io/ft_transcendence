import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import argon2 from 'argon2';

/**
 * TOTP verification window in time steps.
 * Each time step is 30 seconds, so window: 2 allows ±60 seconds of clock drift.
 * This accounts for:
 * - Clock synchronization differences between server and authenticator app
 * - Network latency
 * - User input delay
 */
const TOTP_VERIFICATION_WINDOW = 2;

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
            window: TOTP_VERIFICATION_WINDOW
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
        return JSON.stringify(hashedCodes);
    }

    // Verify backup code
    static async verifyBackupCode(code: string, hashedCodes: string): Promise<{ valid: boolean; matchedIndex: number }> {
        try {
            const storedHashes: string[] = JSON.parse(hashedCodes);

            if (!Array.isArray(storedHashes)) {
                console.error('Backup codes data is not an array');
                return { valid: false, matchedIndex: -1 };
            }
            
            // Hash the input code and compare with stored hashes
            for (let i = 0; i < storedHashes.length; i++) {
                const storedHash = storedHashes[i];
                try {
                    if (await argon2.verify(storedHash, code)) {
                        return { valid: true, matchedIndex: i };
                    }
                    // If verification returns false, continue to next hash (expected behavior)
                } catch (error: any) {
                    // argon2.verify can throw for corrupted hashes or system errors
                    // Log unexpected errors but don't expose details to caller
                    const errorMessage = error?.message || String(error);
                    
                    // Argon2 verification failures are expected for invalid codes
                    // Only log unexpected errors (corrupted hashes, system issues)
                    if (!errorMessage.includes('Argon2') && !errorMessage.includes('verification')) {
                        console.error('Unexpected error during backup code verification:', errorMessage);
                    }
                    // Continue to next hash
                    continue;
                }
            }
            return { valid: false, matchedIndex: -1 };
        } catch (error: any) {
            // JSON.parse failed - corrupted data structure
            const errorMessage = error?.message || String(error);
            console.error('Failed to parse backup codes JSON:', errorMessage);
            return { valid: false, matchedIndex: -1 };
        }
    }
}