import { Service } from 'typedi';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

@Service()
export class DataLogService {
  constructor() {
    const logger = new UpgradeLogger();
    logger.info({ message: 'test logger' });
  }
}
