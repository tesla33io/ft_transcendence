interface PendingRegistration {
    registrationToken: string;
    username: string;
    passwordHash: string;
    twoFactorSecret: string;
    twoFactorMethod: 'totp';
    createdAt: Date;
    expiresAt: Date;
}

class PendingRegistrationStore {
    private registrations = new Map<string, PendingRegistration>();
    private readonly EXPIRY_MINUTES = 15; // Registration must be completed within 15 minutes

    generateRegistrationToken(): string {
        return require('crypto').randomBytes(32).toString('hex');
    }

    store(
        username: string,
        passwordHash: string,
        twoFactorSecret: string,
        twoFactorMethod: 'totp' = 'totp'
    ): string {
        const registrationToken = this.generateRegistrationToken();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRY_MINUTES);

        this.registrations.set(registrationToken, {
            registrationToken,
            username,
            passwordHash,
            twoFactorSecret,
            twoFactorMethod,
            createdAt: new Date(),
            expiresAt
        });

        // Cleanup expired registrations
        setTimeout(() => {
            this.registrations.delete(registrationToken);
        }, this.EXPIRY_MINUTES * 60 * 1000);

        return registrationToken;
    }

    get(registrationToken: string): PendingRegistration | null {
        const registration = this.registrations.get(registrationToken);
        
        if (!registration) {
            return null;
        }

        if (registration.expiresAt < new Date()) {
            this.registrations.delete(registrationToken);
            return null;
        }

        return registration;
    }

    remove(registrationToken: string): boolean {
        return this.registrations.delete(registrationToken);
    }

    cleanup(): void {
        const now = new Date();
        for (const [token, registration] of this.registrations.entries()) {
            if (registration.expiresAt < now) {
                this.registrations.delete(token);
            }
        }
    }
}

export const pendingRegistrationStore = new PendingRegistrationStore();
