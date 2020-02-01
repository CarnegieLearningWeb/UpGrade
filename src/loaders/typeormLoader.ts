import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { createConnection, getConnectionOptions } from 'typeorm';

import { env } from '../env';
import { SERVER_ERROR } from 'ees_types';

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {
  const loadedConnectionOptions = await getConnectionOptions();

  const connectionOptions = Object.assign(loadedConnectionOptions, {
    type: env.db.type, // See createConnection options for valid types
    url: 'postgres://wcxepoml:aQXZRAalTVKbQR3douYDzwAGps_XUGeM@rajje.db.elephantsql.com:5432/wcxepoml',
    // host: 'ec2-174-129-227-80.compute-1.amazonaws.com',
    // port: '5432',
    // username: 'hmtgkxmqgnhhmz',
    // password: '8be3a3bd55291196dd5b59ce814cbafa008ea5dcf4031b3e891864064c1a7630',
    // database: 'd6br7c5rtnf93t',
    synchronize: env.db.synchronize,
    logging: env.db.logging,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
  });

  try {
    const connection = await createConnection(connectionOptions);

    if (settings) {
      settings.setData('connection', connection);
      settings.onShutdown(() => connection.close());
    }
  } catch (error) {
    console.log('error', error);
    if (error.code === 'ECONNREFUSED') {
      throw new Error(SERVER_ERROR.DB_UNREACHABLE);
    } else {
      throw new Error(SERVER_ERROR.DB_AUTH_FAIL);
    }
  }
};
