import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { R2FA } from '../repos/R2FA';
import { User } from '../entities/User';
import { CryptoUtils } from '../utils/ft_crypto';

interface AuthenticatedRequest<B = unknown> extends FastifyRequest<{ Body: B }> {
    user?: {
        id: number;
        username: string;
        role: string;
    };
}

interface Setup2FABody {}

interface Confirm2FABody {
    code: string;
}

interface Disable2FABody {
    password: string;
    code: string;
}

interface SignIn2FABody {
    twofaToken: string;
    code: string;
}

export async function setup2FARoutes(fastify: FastifyInstance) {
    const twoFARepo = new R2FA(fastify.orm.em);

    // Middleware to verify access token
    fastify.register(async () => {
        fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                reply.code(401).send({ error: 'Authorization required' });
                return;
            }

            const token = authHeader.substring(7);
            const decoded = CryptoUtils.verifyAccessToken(token);

            if (!decoded || decoded.type !== 'access') {
                reply.code(401).send({ error: 'Invalid token' });
                return;
            }

            (request as AuthenticatedRequest).user = {
                id: decoded.userId,
                username: decoded.username,
                role: decoded.role
            };
        });

        fastify.post<{ Body: Setup2FABody }>('/2fa/setup', async (request, reply) => {
            try {
                const result = await twoFARepo.setup2FA(request.user!.id);
                reply.send(result);
            } catch (error) {
                reply.code(500).send({ error: (error as Error).message });
            }
        });

        // POST /2fa/confirm
        fastify.post<{ Body: Confirm2FABody }>('/2fa/confirm', async (request, reply) => {
            try {
                const { code } = request.body;

                if (!code || !/^\d{6}$/.test(code)) {
                    reply.code(400).send({ error: 'Invalid code format' });
                    return;
                }

                const result = await twoFARepo.confirm2FA(request.user!.id, code);
                reply.send(result);
            } catch (error) {
                reply.code(400).send({ error: (error as Error).message });
            }
        });

        // POST /2fa/disable
        fastify.post<{ Body: Disable2FABody }>('/2fa/disable', async (request, reply) => {
            try {
                const { password, code } = request.body;

                if (!password || !code) {
                    reply.code(400).send({ error: 'Password and code required' });
                    return;
                }

                await twoFARepo.disable2FA(request.user!.id, password, code);
                reply.send({ disabled: true });
            } catch (error) {
                reply.code(400).send({ error: (error as Error).message });
            }
        });
    });

    // POST /signin/2fa
    fastify.post<{ Body: SignIn2FABody }>('/signin/2fa', async (request, reply) => {
        try {
            const { twofaToken, code } = request.body;

            if (!twofaToken || !code) {
                reply.code(400).send({ error: 'Token and code required' });
                return;
            }

            // Verify 2FA challenge token
            const tokenData = CryptoUtils.verifyTwoFAToken(twofaToken);
            if (!tokenData || tokenData.type !== 'twofa_challenge') {
                reply.code(400).send({ error: 'Invalid or expired token' });
                return;
            }

            const userId = tokenData.userId;

            // Get user data
            const user = await fastify.orm.em.findOneOrFail(User, { id: userId });

            // Verify TOTP code or recovery code
            const totpValid = await twoFARepo.verify2FACode(userId, code);
            const recoveryValid = !totpValid ? await twoFARepo.verifyRecoveryCode(userId, code) : false;

            if (!totpValid && !recoveryValid) {
                reply.code(400).send({ error: 'Invalid verification code' });
                return;
            }

            // Update last login
            user.lastLogin = new Date();
            user.failedLogins = 0;
            await fastify.orm.em.persistAndFlush(user);

            // Issue tokens
            const accessToken = CryptoUtils.signAccessToken(user.id, user.username, user.role);
            const refreshToken = CryptoUtils.signRefreshToken(user.id);

            reply.send({
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                expires_in: 900, // 15 minutes
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } catch (error) {
            reply.code(500).send({ error: (error as Error).message });
        }
    });
}


