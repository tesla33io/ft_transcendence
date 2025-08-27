import { Options } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import * as entities from './entities/index';

export const dbConfig: Options = {
  driver: SqliteDriver,
  dbName: process.env.DB_NAME || 'database.sqlite',
  entities: Object.values(entities),
  debug: true,
  allowGlobalContext: false,
  forceEntityConstructor: true,
  driverOptions: {
    pragma: {
      journal_mode: 'WAL',
      foreign_keys: 'ON'
    }
  }
};
