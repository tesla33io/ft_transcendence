import './types/fastify'
import Fastify from 'fastify';
import { MikroORM } from '@mikro-orm/core';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import mikroConfig from './mikro-orm.config';
import userRoutes from './routes/users';
import tournamentRoutes from './routes/tournament';
import { join } from 'path';
//import { setup2FARoutes } from './routes/2fa';

async function buildServer() {
    const app = Fastify();

    const orm = await MikroORM.init(mikroConfig as any);
    const em = orm.em.fork();

    app.decorate('orm', orm);
    app.decorate('em', em);

    app.addHook('onClose', async () => {
        await orm.close();
    });

    await app.register(fastifyStatic, {
        root: join(process.cwd(), 'public'),
        prefix: '/'
    });
    await app.register(multipart);
    await app.register(userRoutes, { prefix: '/users' });
    console.log('✅ User routes registered');
    await app.register(tournamentRoutes, { prefix: '/tournaments' });
    console.log('✅ Tournament routes registered');
    //await app.register(setup2FARoutes, { prefix: 'auth' });

    return app;
}

export default buildServer;

