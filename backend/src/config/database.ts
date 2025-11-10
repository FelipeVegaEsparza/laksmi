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
    charset: 'utf8mb4',
    connectTimeout: 60000,
    // Configuración adicional para producción
    typeCast: function (field: any, next: any) {
      if (field.type === 'TINY' && field.length === 1) {
        return field.string() === '1'; // Convertir TINYINT(1) a boolean
      }
      return next();
    }
  },
  pool: {
    min: 1,
    max: 5,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    // Configuración para manejar conexiones perdidas
    propagateCreateError: false
  },
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './src/database/seeds'
  },
  // Configuración para manejar errores de conexión
  acquireConnectionTimeout: 60000,
  // Log de queries en desarrollo
  debug: config.nodeEnv === 'development'
};

const db = knex(knexConfig);

// Manejar errores de conexión
db.on('query-error', (error: any) => {
  console.error('Database query error:', error);
});

export default db;