import './types/fastify'
import Fastify from 'fastify';
import { MikroORM } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import userRoutes from './routes/users';
import userStatisticsRoutes from './routes/userStats';
import matchHistoryRoutes from './routes/matchHistory';
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

    await app.register(userRoutes, { prefix: '/users' });
    await app.register(userStatisticsRoutes, { prefix: '/user-stats' });
    await app.register(matchHistoryRoutes, { prefix: '/match-history' });
    //await app.register(setup2FARoutes, { prefix: 'auth' });

    return app;
}

export default buildServer;

