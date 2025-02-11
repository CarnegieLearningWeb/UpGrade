import dotenv from 'dotenv';
import path from 'path';
import pkg from '../package.json';

import { getOsEnv, getOsPath, getOsPaths, normalizePort, toBool } from './lib/env';
import { getOsEnvOptional, toNumber, parseAdminUsers, getOsEnvArray } from './lib/env/utils';

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
  useNewRelic: toBool(getOsEnvOptional('USE_NEW_RELIC')) || false,
  isECS: toBool(getOsEnvOptional('IS_ECS')) || false,
  app: {
    name: getOsEnv('APP_NAME'),
    version: (pkg as any).version,
    description: (pkg as any).description,
    host: getOsEnv('APP_HOST'),
    schema: getOsEnv('APP_SCHEMA'),
    routePrefix: getOsEnv('APP_ROUTE_PREFIX'),
    port: normalizePort(process.env.PORT || getOsEnv('APP_PORT')),
    banner: toBool(getOsEnv('APP_BANNER')),
    corsWhitelist: getOsEnvArray('CORS_WHITELIST'),
    dirs: {
      migrations: getOsPaths('TYPEORM_MIGRATIONS'),
      migrationsDir: getOsPath('TYPEORM_MIGRATIONS_DIR'),
      entities: getOsPaths('TYPEORM_ENTITIES'),
      entitiesDir: getOsPath('TYPEORM_ENTITIES_DIR'),
      controllers: getOsPaths('CONTROLLERS'),
      middlewares: getOsPaths('MIDDLEWARES'),
      interceptors: getOsPaths('INTERCEPTORS'),
    },
    demo: toBool(getOsEnvOptional('APP_DEMO')) || false,
  },
  log: {
    level: getOsEnv('LOG_LEVEL'),
    json: toBool(getOsEnvOptional('LOG_JSON')),
    output: getOsEnv('LOG_OUTPUT'),
  },
  // Use this when want log directly from the console
  splunk: {
    host: getOsEnvOptional('SPLUNK_HOST'),
    token: getOsEnvOptional('SPLUNK_TOKEN'),
    index: getOsEnvOptional('SPLUNK_INDEX'),
  },
  db: {
    type: getOsEnv('TYPEORM_CONNECTION'),
    host: getOsEnvOptional('TYPEORM_HOST') || getOsEnvOptional('RDS_HOSTNAME'),
    host_replica: getOsEnvOptional('TYPEORM_HOSTNAME_REPLICAS') || getOsEnvOptional('RDS_HOSTNAME_REPLICAS'),
    port: toNumber(getOsEnvOptional('TYPEORM_PORT') || getOsEnvOptional('RDS_PORT')),
    username: getOsEnvOptional('TYPEORM_USERNAME') || getOsEnvOptional('RDS_USERNAME'),
    password: getOsEnvOptional('TYPEORM_PASSWORD') || getOsEnvOptional('RDS_PASSWORD'),
    database: getOsEnvOptional('TYPEORM_DATABASE') || getOsEnvOptional('RDS_DB_NAME'),
    synchronize: toBool(getOsEnvOptional('TYPEORM_SYNCHRONIZE')),
    logging: getOsEnv('TYPEORM_LOGGING'),
    maxQueryExecutionTime: toNumber(getOsEnvOptional('TYPEORM_MAX_QUERY_EXECUTION_TIME')),
    maxConnectionPool: toNumber(getOsEnvOptional('TYPEORM_MAX_CONNECTION_POOL_SIZE')),
  },
  swagger: {
    enabled: toBool(getOsEnv('SWAGGER_ENABLED')),
    route: getOsEnv('SWAGGER_ROUTE'),
    api: getOsEnv('SWAGGER_API'),
    json: getOsEnv('SWAGGER_JSON'),
  },
  monitor: {},
  email: {
    from: getOsEnv('EMAIL_FROM'),
    expireAfterSeconds: toNumber(getOsEnv('EMAIL_EXPIRE_AFTER_SECONDS')),
    emailBucket: getOsEnv('EMAIL_BUCKET'),
  },
  google: {
    clientId: getOsEnvArray('GOOGLE_CLIENT_ID'),
    serviceAccountId: getOsEnvArray('GOOGLE_SERVICE_ACCOUNT_ID'),
    domainName: getOsEnvOptional('DOMAIN_NAME'),
    allowTestTokenService: toBool(getOsEnvOptional('ALLOW_SERVICE_ACCOUNT_TOKEN_SERVICE')),
    keyFilename: getOsEnvOptional('GOOGLE_SERVICE_ACCOUNT_CREDENTIAL_FILE'),
  },
  scheduler: {
    stepFunctionArn: getOsEnv('SCHEDULER_STEP_FUNCTION'),
  },
  aws: {
    region: getOsEnv('AWS_REGION'),
  },
  initialization: {
    contextMetadata: JSON.parse(getOsEnv('CONTEXT_METADATA')),
    adminUsers: parseAdminUsers(getOsEnv('ADMIN_USERS')),
    metrics: getOsEnvOptional('METRICS'),
  },
  hostUrl: getOsEnv('HOST_URL'),
  tokenSecretKey: getOsEnv('TOKEN_SECRET_KEY'),
  caching: {
    enabled: toBool(getOsEnvOptional('CACHING_ENABLED')),
    ttl: toNumber(getOsEnvOptional('CACHING_TTL')),
  },
  clientApi: {
    secret: getOsEnv('CLIENT_API_SECRET'),
    key: getOsEnv('CLIENT_API_KEY'),
  },
  mooclets: {
    enabled: toBool(getOsEnvOptional('MOOCLETS_ENABLED')) || false,
    hostUrl: getOsEnvOptional('MOOCLETS_HOST_URL') || '',
    apiRoute: getOsEnvOptional('MOOCLETS_API_ROUTE') || '',
    apiToken: getOsEnvOptional('MOOCLETS_API_TOKEN') || '',
  },
};
