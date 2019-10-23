import 'reflect-metadata';

import { bootstrapMicroframework } from 'microframework';
import { expressLoader } from './loaders/expressLoader';
import { banner } from './lib/banner';
import { Logger } from './lib/logger/Logger';
import { winstonLoader } from './loaders/winstonLoader';
import { homeLoader } from './loaders/homeLoader';
import { publicLoader } from './loaders/publicLoader';
import { iocLoader } from './loaders/iocLoader';
import { typeormLoader } from './loaders/typeormLoader';

/*
 * EXPRESS TYPESCRIPT BOILERPLATE
 * ----------------------------------------
 */

const log = new Logger(__filename);

bootstrapMicroframework({
  loaders: [winstonLoader, iocLoader, typeormLoader, expressLoader, homeLoader, publicLoader],
}).then(() => {
  banner(log);
});
