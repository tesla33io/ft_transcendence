import * as argon2 from 'argon2';
import { Database } from '../Database';
import { User, AuditEvent } from '../entities/index';

export class UserService {
    private db = Database.getInstance();

    async createUser(username: string, password: string, role: string = 'user'): Promise<User> {
        const em = this.db.em;

        // Check if user already exists
        const existingUser = await em.findOne(User, { username });
    if (existingUser) {
        throw new Error('Username already exists');
    }

    const pwdHash = await argon2.hash(password);
    const user = new User();
    user.username = username;
    user.pwdHash = pwdHash;
    user.role = role;

    await em.persistAndFlush(user);

    // Log audit event
    await this.logAuditEvent(user.id, 'user_created', { username, role });

    return user;
    }

    async validateUser(username: string, password: string): Promise<User | null> {
        const em = this.db.em;
        const user = await em.findOne(User, { username });

        if (!user) {
            await this.logAuditEvent(null, 'login_failed', { username, reason: 'user_not_found' });
            return null;
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            await this.logAuditEvent(user.id, 'login_failed', { username, reason: 'account_locked' });
            return null;
        }

        const isValid = await argon2.verify(user.pwdHash, password);

        if (isValid) {
            // Reset failed login attempts and update last login
            user.failedLogins = 0;
            user.lockedUntil = undefined;
            user.lastLogin = new Date();
            await em.flush();

            await this.logAuditEvent(user.id, 'login_success', { username });
            return user;
        } else {
            // Increment failed login attempts
            user.failedLogins += 1;

            // Lock account after 5 failed attempts for 30 minutes
            if (user.failedLogins >= 5) {
                user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            }

            await em.flush();
            await this.logAuditEvent(user.id, 'login_failed', { 
                username, 
                reason: 'invalid_password',
                failedAttempts: user.failedLogins 
            });

            return null;
        }
    }

    async getUserById(id: number): Promise<User | null> {
        const em = this.db.em;
        return await em.findOne(User, { id });
    }

    async getUserByUsername(username: string): Promise<User | null> {
        const em = this.db.em;
        return await em.findOne(User, { username });
    }

    async updateUserProfile(userId: number, profile: Record<string, any>): Promise<User | null> {
        const em = this.db.em;
        const user = await em.findOne(User, { id: userId });

        if (!user) return null;

        user.profile = { ...user.profile, ...profile };
        user.version += 1;
        await em.flush();

        await this.logAuditEvent(userId, 'profile_updated', { changes: profile });
        return user;
    }

    async updateUserSettings(userId: number, settings: Record<string, any>): Promise<User | null> {
        const em = this.db.em;
        const user = await em.findOne(User, { id: userId });

        if (!user) return null;

        user.settings = { ...user.settings, ...settings };
        user.version += 1;
        await em.flush();

        await this.logAuditEvent(userId, 'settings_updated', { changes: settings });
        return user;
    }

    private async logAuditEvent(userId: number | null, eventType: string, data: Record<string, any>): Promise<void> {
        const em = this.db.em;
        const event = new AuditEvent();
        event.eventType = eventType;
        event.data = data;

        if (userId) {
            const user = await em.getReference(User, userId);
            event.user = user;
        }

        await em.persistAndFlush(event);
    }
}
