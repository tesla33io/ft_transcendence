import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { User } from './entities/User.js';
import { app } from './app.js';
import mikroOrmConfig from './mikro-orm.config.js';

const startServer = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up(); // Run migrations if needed

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error(err);
  process.exit(1);
});