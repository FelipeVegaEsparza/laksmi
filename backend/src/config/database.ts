import knex from 'knex';
import config from './index';

const knexConfig = {
  client: 'mysql2',
  connection: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password || undefined,
    database: config.database.name,
    charset: 'utf8mb4'
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './src/database/seeds'
  }
};

const db = knex(knexConfig);

export default db;