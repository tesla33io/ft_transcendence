import { TwoFactorService } from './TwoFactorService';

interface CodeEntry {
    code: string;
    userId: number;
    expiresAt: Date;
    method: 'email' | 'sms';
}

class TwoFactorCodeStore {
    private codes = new Map<string, CodeEntry>();
    private readonly EXPIRY_MINUTES = 10;

    generateCode(userId: number, method: 'email' | 'sms'): string {
        const code = TwoFactorService.generateCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRY_MINUTES);

        this.codes.set(code, { code, userId, expiresAt, method });
        
        // Cleanup expired codes
        setTimeout(() => this.codes.delete(code), this.EXPIRY_MINUTES * 60 * 1000);
        
        return code;
    }

    verifyCode(code: string, userId: number): boolean {
        const entry = this.codes.get(code);
        if (!entry) return false;
        if (entry.userId !== userId) return false;
        if (entry.expiresAt < new Date()) {
            this.codes.delete(code);
            return false;
        }
        this.codes.delete(code); // One-time use
        return true;
    }
}

export const codeStore = new TwoFactorCodeStore();