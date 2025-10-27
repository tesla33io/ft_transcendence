import './types/fastify'
import Fastify from 'fastify';
import { MikroORM } from '@mikro-orm/core';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import mikroConfig from './mikro-orm.config';
import userRoutes from './routes/users';
import { join } from 'path';

import userStatisticsRoutes from './routes/userStats';
import matchHistoryRoutes from './routes/matchHistory';
import { SessionManager, setupSessionMiddleware } from './utils/SessionManager';
import { setupGlobalErrorHandling } from './utils/ErrorHandling';

async function buildServer() {
    const app = Fastify({ logger: true });

    /////////// DEBUG ////////
    if (process.env.NODE_ENV !== 'production') {

        import('@fastify/swagger').then((swagger) => {app.register(swagger, {
            openapi: {
                info: {
                    title: 'ft_transcendence',
                    description: 'Fastify API docs',
                    version: '1.0.0'
                }
            }
        })});

        import('@fastify/swagger-ui').then((swaggerUI) => {
            app.register(swaggerUI, {
                routePrefix: '/docs'
            })});
    }
    //////////// DEBUG /////////

    const orm = await MikroORM.init(mikroConfig as any);
    const em = orm.em.fork();

    app.decorate('orm', orm);
    app.decorate('em', em);

    app.addHook('onClose', async () => {
        await orm.close();
    });

    setupGlobalErrorHandling(app);

    await app.register(fastifyStatic, {
        root: join(process.cwd(), 'public'),
        prefix: '/'
    });

    const sm = new SessionManager(orm);
    app.decorate('sm', sm);

    setInterval(() => sm.cleanup(), 3600000);

    await setupSessionMiddleware(app, sm);
    await app.register(multipart);
    await app.register(userRoutes, { prefix: '/users' });
    await app.register(userStatisticsRoutes, { prefix: '/user-stats' });
    await app.register(matchHistoryRoutes, { prefix: '/match-history' });

    return app;
}

export default buildServer;
