import * as dotenv from 'dotenv';
import * as path from 'path';

import * as pkg from '../package.json';

import { getOsEnv, getOsPath, getOsPaths, normalizePort, toBool } from './lib/env';
import { getOsEnvOptional, toNumber, parseContext, parseAdminUsers } from './lib/env/utils';

/**
 * Load .env file or for tests the .env.test file.
 */
dotenv.config({
  path: path.join(process.cwd(), `.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`),
});

/**
 * Environment variables
 */
export const env = {
  node: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  isDevelopment: process.env.NODE_ENV === 'development',
  app: {
    name: getOsEnv('APP_NAME'),
    version: (pkg as any).version,
    description: (pkg as any).description,
    host: getOsEnv('APP_HOST'),
    schema: getOsEnv('APP_SCHEMA'),
    routePrefix: getOsEnv('APP_ROUTE_PREFIX'),
    port: normalizePort(process.env.PORT || getOsEnv('APP_PORT')),
    banner: toBool(getOsEnv('APP_BANNER')),
    dirs: {
      migrations: getOsPaths('TYPEORM_MIGRATIONS'),
      migrationsDir: getOsPath('TYPEORM_MIGRATIONS_DIR'),
      entities: getOsPaths('TYPEORM_ENTITIES'),
      entitiesDir: getOsPath('TYPEORM_ENTITIES_DIR'),
      controllers: getOsPaths('CONTROLLERS'),
      middlewares: getOsPaths('MIDDLEWARES'),
      interceptors: getOsPaths('INTERCEPTORS'),
    },
  },
  log: {
    level: getOsEnv('LOG_LEVEL'),
    json: toBool(getOsEnvOptional('LOG_JSON')),
    output: getOsEnv('LOG_OUTPUT'),
  },
  db: {
    type: getOsEnv('TYPEORM_CONNECTION'),
    host: getOsEnvOptional('TYPEORM_HOST') || getOsEnvOptional('RDS_HOSTNAME'),
    port: toNumber(getOsEnvOptional('TYPEORM_PORT') || getOsEnvOptional('RDS_PORT')),
    username: getOsEnvOptional('TYPEORM_USERNAME') || getOsEnvOptional('RDS_USERNAME'),
    password: getOsEnvOptional('TYPEORM_PASSWORD') || getOsEnvOptional('RDS_PASSWORD'),
    database: getOsEnvOptional('TYPEORM_DATABASE') || getOsEnvOptional('RDS_DB_NAME'),
    synchronize: toBool(getOsEnvOptional('TYPEORM_SYNCHRONIZE')),
    logging: getOsEnv('TYPEORM_LOGGING'),
  },
  swagger: {
    enabled: toBool(getOsEnv('SWAGGER_ENABLED')),
    route: getOsEnv('SWAGGER_ROUTE'),
    api: getOsEnv('SWAGGER_API'),
  },
  monitor: {},
  email: {
    from: getOsEnv('EMAIL_FROM'),
    expireAfterSeconds: toNumber(getOsEnv('EMAIL_EXPIRE_AFTER_SECONDS')),
    emailBucket: getOsEnv('EMAIL_BUCKET'),
  },
  google: {
    clientId: getOsEnv('GOOGLE_CLIENT_ID'),
    domainName: getOsEnvOptional('DOMAIN_NAME'),
  },
  auth: {
    authCheck: toBool(getOsEnvOptional('AUTH_CHECK')),
  },
  schedular: {
    stepFunctionArn: getOsEnv('SCHEDULER_STEP_FUNCTION'),
  },
  aws: {
    region: getOsEnv('AWS_REGION'),
  },
  initialization: {
    context: parseContext(getOsEnv('CONTEXT')),
    adminUsers: parseAdminUsers(getOsEnv('ADMIN_USERS')),
  },
  hostUrl: getOsEnv('HOST_URL'),
  tokenSecretKey: getOsEnv('TOKEN_SECRET_KEY'),
};
