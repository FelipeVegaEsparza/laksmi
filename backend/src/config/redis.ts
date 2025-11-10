import { createClient } from 'redis';
import config from './index';
import logger from '../utils/logger';

let redisClient: any = null;

const createRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port
      },
      password: config.redis.password || undefined
    });

    redisClient.on('error', (err: any) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });
  }
  return redisClient;
};

export const connectRedis = async () => {
  try {
    const client = createRedisClient();
    if (!client.isOpen) {
      await client.connect();
    }
    logger.info('Redis connected successfully');
    return client;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    logger.info('Continuing without Redis - some features may be limited');
    return null;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export default createRedisClient;