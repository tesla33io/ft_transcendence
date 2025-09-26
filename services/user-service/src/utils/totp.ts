import crypto from 'crypto';

export interface TwoFAToken {
    userId: number;
    type: 'twofa_challenge';
    iat: number;
    exp: number;
}

export class TOTPGenerator {
    private static readonly BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    private static readonly STEP_SIZE = 30; // seconds
    private static readonly DIGITS = 6;
    private static readonly WINDOW = 1; // Allow 1 step before/after current

    /**
        * Generate a random base32 secret
    */
    static generateSecret(length: number = 32): string {
        const bytes = crypto.randomBytes(length);
        let result = '';

        for (let i = 0; i < length; i++) {
            result += this.BASE32_CHARS[bytes[i]! % 32];
        }

        return result;
    }

    /**
        * Decode base32 string to buffer
    */
    private static base32Decode(base32: string): Buffer {
        base32 = base32.replace(/=+$/, '').toUpperCase();
        let bits = 0;
        let value = 0;
        let buffer = Buffer.alloc(Math.floor((base32.length * 5) / 8));
        let bufferIndex = 0;

        for (const char of base32) {
            const charIndex = this.BASE32_CHARS.indexOf(char);
            if (charIndex === -1) {
                throw new Error(`Invalid base32 character: ${char}`);
            }

            value = (value << 5) | charIndex;
            bits += 5;

            if (bits >= 8) {
                buffer[bufferIndex++] = (value >> (bits - 8)) & 0xff;
                bits -= 8;
            }
        }

        return buffer.subarray(0, bufferIndex);
    }

    /**
        * Generate HMAC-SHA1 hash
    */
    private static hmacSha1(key: Buffer, data: Buffer): Buffer {
        const hmac = crypto.createHmac('sha1', key);
        hmac.update(data);
        return hmac.digest();
    }

    /**
        * Convert number to 8-byte big-endian buffer
    */
    private static numberToBuffer(num: number): Buffer {
        const buffer = Buffer.alloc(8);
        buffer.writeBigUInt64BE(BigInt(num), 0);
        return buffer;
    }

    /**
        * Generate TOTP code for given time step
    */
    private static generateTOTPAtStep(secret: string, step: number): string {
        const secretBuffer = this.base32Decode(secret);
        const stepBuffer = this.numberToBuffer(step);

        // Generate HMAC
        const hmac = this.hmacSha1(secretBuffer, stepBuffer);

        // Dynamic truncation
        const offset = hmac[hmac.length - 1]! & 0x0f;
        const code = (
            ((hmac[offset]! & 0x7f) << 24) |
                ((hmac[offset + 1]! & 0xff) << 16) |
                ((hmac[offset + 2]! & 0xff) << 8) |
                (hmac[offset + 3]! & 0xff)
        ) % Math.pow(10, this.DIGITS);

        return code.toString().padStart(this.DIGITS, '0');
    }

    /**
        * Get current time step
    */
    private static getCurrentStep(timestamp?: number): number {
        const now = timestamp || Math.floor(Date.now() / 1000);
        return Math.floor(now / this.STEP_SIZE);
    }

    /**
        * Generate current TOTP code
    */
    static generateTOTP(secret: string, timestamp?: number): string {
        const step = this.getCurrentStep(timestamp);
        return this.generateTOTPAtStep(secret, step);
    }

    /**
        * Verify TOTP code with window tolerance
    */
    static verifyTOTP(secret: string, token: string, timestamp?: number): boolean {
        const currentStep = this.getCurrentStep(timestamp);

        // Check current step and steps within window
        for (let i = -this.WINDOW; i <= this.WINDOW; i++) {
            const stepToCheck = currentStep + i;
            const expectedToken = this.generateTOTPAtStep(secret, stepToCheck);

            if (this.constantTimeCompare(expectedToken, token)) {
                return true;
            }
        }

        return false;
    }

    /**
        * Constant time string comparison to prevent timing attacks
    */
    private static constantTimeCompare(a: string, b: string): boolean {
        if (a.length !== b.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }

        return result === 0;
    }

    /**
        * Generate OTP Auth URL for QR codes
    */
    static generateOTPAuthURL(secret: string, username: string, issuer: string = 'marvin'): string {
        const encodedIssuer = encodeURIComponent(issuer);
        const encodedUsername = encodeURIComponent(username);
        const encodedSecret = encodeURIComponent(secret);

        return `otpauth://totp/${encodedIssuer}:${encodedUsername}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${this.DIGITS}&period=${this.STEP_SIZE}`;
    }
}

