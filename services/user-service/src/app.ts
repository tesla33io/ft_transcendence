import './types/fastify'
import Fastify from 'fastify';
import { MikroORM } from '@mikro-orm/core';
import mikroConfig from '../mikro-orm.config';
import userRoutes from './routes/users';
import { setup2FARoutes } from './routes/2fa';

async function buildServer() {
    const app = Fastify();

    const orm = await MikroORM.init(mikroConfig);
    const em = orm.em.fork();

    app.decorate('orm', orm);
    app.decorate('em', em);

    app.addHook('onClose', async () => {
        await orm.close();
    });

    await app.register(userRoutes, { prefix: '/users' });
    await app.register(setup2FARoutes, { prefix: 'auth' });

    return app;
}

export default buildServer;

