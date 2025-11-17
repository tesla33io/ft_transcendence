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

import userStatisticsRoutes from './routes/userStats';
import matchHistoryRoutes from './routes/matchHistory';
import { SessionManager, setupSessionMiddleware } from './utils/SessionManager';
import { setupGlobalErrorHandling } from './utils/ErrorHandling';

import cors from '@fastify/cors';
import { pendingRegistrationStore } from './utils/PendingRegistrationStore';

async function buildServer() {
  // Configure Fastify to trust proxy headers only from trusted sources
  const trustProxy = process.env.TRUSTED_PROXY_IPS 
    ? process.env.TRUSTED_PROXY_IPS.split(',').map(ip => ip.trim())
    : false; // Don't trust any proxy by default
    
  const app = Fastify({ 
      logger: true,
      trustProxy: trustProxy // Only trust headers from these IPs
  });

	//only for dev 
	await app.register(cors,{
		origin: true,
		credentials: true
	})


    /////////// DEBUG ////////
    if (process.env.NODE_ENV !== 'production') {
        const swagger = await import('@fastify/swagger');
        const swaggerUi = await import('@fastify/swagger-ui');
      
        await app.register(swagger.default, {
          openapi: {
            info: { title: 'ft_transcendence', description: 'Fastify API docs', version: '1.0.0' }
          }
        });
      
        await app.register(swaggerUi.default, { routePrefix: '/docs' });
      }

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
    console.log('✅ User routes registered');
    await app.register(tournamentRoutes, { prefix: '/tournaments' });
    console.log('✅ Tournament routes registered');
    await app.register(userStatisticsRoutes, { prefix: '/user-stats' });
    await app.register(matchHistoryRoutes, { prefix: '/match-history' });

    // Cleanup expired pending registrations every 5 minutes
    setInterval(() => {
        pendingRegistrationStore.cleanup();
    }, 5 * 60 * 1000);

    return app;
}

export default buildServer;
