import './types/fastify'
import Fastify from 'fastify';
import { MikroORM } from '@mikro-orm/core';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import mikroConfig from './mikro-orm.config';
import userRoutes from './routes/users';
import tournamentRoutes from './routes/tournament';
import { initializeServices } from './services/initialization';
import { join } from 'path';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
//import { setup2FARoutes } from './routes/2fa';

async function buildServer() {
    const app = Fastify();

    await app.register(swagger, {
        openapi: {
          info: {
            title: 'ft_transcendence API',
            description: 'User and tournament endpoints',
            version: '1.0.0',
          },
          servers: [{ url: 'http://127.0.0.1:8000', description: 'Local dev' }],
        },
      });
   
      await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: true,
        },
        staticCSP: true,
      });

    const orm = await MikroORM.init(mikroConfig as any);
    const em = orm.em.fork();

    app.decorate('orm', orm);
    app.decorate('em', em);

    app.addHook('onClose', async () => {
        await orm.close();
    });

    // Initialize external services (dependency injection)
    initializeServices();
    console.log('✅ External services initialized');

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

