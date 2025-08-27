import { FtDatabase } from '../../src/index';
import * as argon2 from 'argon2';

describe('UserService', () => {
    let gameDb: FtDatabase;

    beforeAll(() => {
        gameDb = FtDatabase.getInstance();
    });

    describe('createUser', () => {
        it('should create a new user successfully', async () => {
            const user = await gameDb.userService.createUser('testuser', 'password123');

            expect(user.id).toBeDefined();
            expect(user.username).toBe('testuser');
            expect(user.pwdHash).toBeDefined();
            expect(user.role).toBe('user');
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.failedLogins).toBe(0);
        });

        it('should hash password correctly', async () => {
            const user = await gameDb.userService.createUser('hashtest', 'mypassword');

            const isValid = await argon2.verify(user.pwdHash, 'mypassword');
            expect(isValid).toBe(true);

            const isInvalid = await argon2.verify(user.pwdHash, 'wrongpassword');
            expect(isInvalid).toBe(false);
        });

        it('should create user with custom role', async () => {
            const admin = await gameDb.userService.createUser('admin', 'adminpass', 'admin');
            expect(admin.role).toBe('admin');
        });

        it('should throw error for duplicate username', async () => {
            await gameDb.userService.createUser('duplicate', 'pass1');

            await expect(
                gameDb.userService.createUser('duplicate', 'pass2')
            ).rejects.toThrow('Username already exists');
        });

        it('should create audit event for user creation', async () => {
            const user = await gameDb.userService.createUser('audituser', 'password');

            const auditEvents = await gameDb.repositories.auditEvent.find({
                user: user.id,
                eventType: 'user_created'
            });

            expect(auditEvents).toHaveLength(1);
            expect(auditEvents[0].data).toEqual({
                username: 'audituser',
                role: 'user'
            });
        });
    });

    describe('validateUser', () => {
        beforeEach(async () => {
            await gameDb.userService.createUser('validuser', 'correctpass');
        });

        it('should validate user with correct credentials', async () => {
            const user = await gameDb.userService.validateUser('validuser', 'correctpass');

            expect(user).toBeDefined();
            expect(user!.username).toBe('validuser');
            expect(user!.lastLogin).toBeInstanceOf(Date);
            expect(user!.failedLogins).toBe(0);
        });

        it('should return null for non-existent user', async () => {
            const user = await gameDb.userService.validateUser('nonexistent', 'password');
            expect(user).toBeNull();
        });

        it('should return null for incorrect password', async () => {
            const user = await gameDb.userService.validateUser('validuser', 'wrongpass');
            expect(user).toBeNull();

            // Check that failed login count increased
            const userRecord = await gameDb.userService.getUserByUsername('validuser');
            expect(userRecord!.failedLogins).toBe(1);
        });

        it('should lock account after 5 failed attempts', async () => {
            // Try 5 failed logins
            for (let i = 0; i < 5; i++) {
                await gameDb.userService.validateUser('validuser', 'wrongpass');
            }

            const userRecord = await gameDb.userService.getUserByUsername('validuser');
            expect(userRecord!.failedLogins).toBe(5);
            expect(userRecord!.lockedUntil).toBeInstanceOf(Date);
            expect(userRecord!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
        });

        it('should not validate locked user even with correct password', async () => {
            // Lock the account
            for (let i = 0; i < 5; i++) {
                await gameDb.userService.validateUser('validuser', 'wrongpass');
            }

            // Try with correct password
            const user = await gameDb.userService.validateUser('validuser', 'correctpass');
            expect(user).toBeNull();
        });

        it('should reset failed attempts on successful login', async () => {
            // Make some failed attempts
            await gameDb.userService.validateUser('validuser', 'wrongpass');
            await gameDb.userService.validateUser('validuser', 'wrongpass');

            // Successful login
            const user = await gameDb.userService.validateUser('validuser', 'correctpass');
            expect(user).toBeDefined();
            expect(user!.failedLogins).toBe(0);
            expect(user!.lockedUntil).toBeUndefined();
        });
    });

    describe('getUserById', () => {
        it('should return user by ID', async () => {
            const created = await gameDb.userService.createUser('findbyid', 'password');
            const found = await gameDb.userService.getUserById(created.id);

            expect(found).toBeDefined();
            expect(found!.id).toBe(created.id);
            expect(found!.username).toBe('findbyid');
        });

        it('should return null for non-existent ID', async () => {
            const found = await gameDb.userService.getUserById(99999);
            expect(found).toBeNull();
        });
    });

    describe('getUserByUsername', () => {
        it('should return user by username', async () => {
            await gameDb.userService.createUser('findbyname', 'password');
            const found = await gameDb.userService.getUserByUsername('findbyname');

            expect(found).toBeDefined();
            expect(found!.username).toBe('findbyname');
        });

        it('should return null for non-existent username', async () => {
            const found = await gameDb.userService.getUserByUsername('nonexistent');
            expect(found).toBeNull();
        });
    });

    describe('updateUserProfile', () => {
        let user: any;

        beforeEach(async () => {
            user = await gameDb.userService.createUser('profileuser', 'password');
        });

        it('should update user profile', async () => {
            const profileData = { avatar: 'avatar.jpg', displayName: 'Profile User' };
            const updated = await gameDb.userService.updateUserProfile(user.id, profileData);

            expect(updated).toBeDefined();
            expect(updated!.profile).toEqual(profileData);
            expect(updated!.version).toBe(2);
        });

        it('should merge with existing profile data', async () => {
            await gameDb.userService.updateUserProfile(user.id, { avatar: 'first.jpg' });
            const updated = await gameDb.userService.updateUserProfile(user.id, { displayName: 'User' });

            expect(updated!.profile).toEqual({
                avatar: 'first.jpg',
                displayName: 'User'
            });
        });

        it('should return null for non-existent user', async () => {
            const result = await gameDb.userService.updateUserProfile(99999, { avatar: 'test.jpg' });
            expect(result).toBeNull();
        });

        it('should create audit event for profile update', async () => {
            const profileData = { avatar: 'test.jpg' };
            await gameDb.userService.updateUserProfile(user.id, profileData);

            const auditEvents = await gameDb.repositories.auditEvent.find({
                user: user.id,
                eventType: 'profile_updated'
            });

            expect(auditEvents).toHaveLength(1);
            expect(auditEvents[0].data).toEqual({ changes: profileData });
        });
    });

    describe('updateUserSettings', () => {
        let user: any;

        beforeEach(async () => {
            user = await gameDb.userService.createUser('settingsuser', 'password');
        });

        it('should update user settings', async () => {
            const settings = { theme: 'dark', notifications: true };
            const updated = await gameDb.userService.updateUserSettings(user.id, settings);

            expect(updated).toBeDefined();
            expect(updated!.settings).toEqual(settings);
            expect(updated!.version).toBe(2);
        });

        it('should merge with existing settings', async () => {
            await gameDb.userService.updateUserSettings(user.id, { theme: 'dark' });
            const updated = await gameDb.userService.updateUserSettings(user.id, { sound: false });

            expect(updated!.settings).toEqual({
                theme: 'dark',
                sound: false
            });
        });

        it('should return null for non-existent user', async () => {
            const result = await gameDb.userService.updateUserSettings(99999, { theme: 'dark' });
            expect(result).toBeNull();
        });
    });
});
