import { EntityManager } from '@mikro-orm/core';
import { User } from '../entities/User';
import { RecoveryCode } from '../entities/RecoveryCode';
import { CryptoUtils } from '../utils/ft_crypto';
import argon2 from 'argon2';

export class R2FA {
    constructor(private em: EntityManager) {}

    async setup2FA(userId: number): Promise<{ otpauth_url: string; secret: string }> {
        const user = await this.em.findOneOrFail(User, { id: userId });

        const secret = CryptoUtils.generateTOTPSecret();
        const encryptedSecret = CryptoUtils.encryptSecret(secret);

        user.twofaSecretEncrypted = encryptedSecret;
        user.twofaEnabled = false;

        await this.em.persistAndFlush(user);

        const otpauth_url = CryptoUtils.generateOTPAuthURL(secret, user.username);

        return { otpauth_url, secret };
    }

    async confirm2FA(userId: number, code: string): Promise<{ enabled: boolean; recoveryCodes: string[] }> {
        const user = await this.em.findOneOrFail(User, { id: userId });

        if (!user.twofaSecretEncrypted) {
            throw new Error('2FA setup not initiated');
        }

        const secret = CryptoUtils.decryptSecret(user.twofaSecretEncrypted);
        const isValid = CryptoUtils.verifyTOTP(secret, code);

        if (!isValid) {
            throw new Error('Invalid verification code');
        }

        user.twofaEnabled = true;

        const recoveryCodes = CryptoUtils.generateRecoveryCodes();

        await this.em.nativeDelete(RecoveryCode, { user: userId });

        for (const code of recoveryCodes) {
            const hashedCode = await CryptoUtils.hashRecoveryCode(code);
            const recoveryCode = new RecoveryCode();
            recoveryCode.user = user;
            recoveryCode.codeHash = hashedCode;
            this.em.persist(recoveryCode);
        }

        await this.em.persistAndFlush(user);

        return { enabled: true, recoveryCodes };
    }

    async disable2FA(userId: number, password: string, code: string): Promise<void> {
        const user = await this.em.findOneOrFail(User, { id: userId });

        if (!user.twofaEnabled || !user.twofaSecretEncrypted) {
            throw new Error('2FA is not enabled');
        }

        const passwordValid = await argon2.verify(user.pwdHash, password);
        if (!passwordValid) {
            throw new Error('Invalid password');
        }

        const secret = CryptoUtils.decryptSecret(user.twofaSecretEncrypted);
        const codeValid = CryptoUtils.verifyTOTP(secret, code);
        if (!codeValid) {
            throw new Error('Invalid 2FA code');
        }

        user.twofaSecretEncrypted = null;
        user.twofaEnabled = false;

        await this.em.nativeDelete(RecoveryCode, { user: userId });

        await this.em.persistAndFlush(user);
    }

    async verify2FACode(userId: number, code: string): Promise<boolean> {
        const user = await this.em.findOneOrFail(User, { id: userId });

        if (!user.twofaEnabled || !user.twofaSecretEncrypted) {
            return false;
        }

        const secret = CryptoUtils.decryptSecret(user.twofaSecretEncrypted);
        return CryptoUtils.verifyTOTP(secret, code);
    }

    async verifyRecoveryCode(userId: number, code: string): Promise<boolean> {
        const recoveryCodes = await this.em.find(RecoveryCode, {
            user: userId,
            used: false
        });

        for (const recoveryCode of recoveryCodes) {
            const isValid = await CryptoUtils.verifyRecoveryCode(code, recoveryCode.codeHash);
            if (isValid) {
                recoveryCode.used = true;
                await this.em.persistAndFlush(recoveryCode);
                return true;
            }
        }

        return false;
    }
}

