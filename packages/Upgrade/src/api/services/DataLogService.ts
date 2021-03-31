import { Service } from 'typedi';
import { Logger, LoggerInterface } from '../../decorators/Logger';

@Service()
export class DataLogService {
  constructor(@Logger(__filename) private log: LoggerInterface) {
    this.log.info('test');
  }
}
