import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ErrorRepository } from '../repositories/ErrorRepository';
import { ExperimentError } from '../models/ExperimentError';
import { SERVER_ERROR } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

@Service()
export class ErrorService {
  constructor(@OrmRepository() private errorRepository: ErrorRepository) {}

  public getTotalLogs(filter: SERVER_ERROR): Promise<number> {
    if (filter) {
      return this.errorRepository.getTotalLogs(filter);
    }
    return this.errorRepository.count();
  }

  public getErrorLogs(limit: number, offset: number, filter: SERVER_ERROR): Promise<ExperimentError[]> {
    return this.errorRepository.paginatedFind(limit, offset, filter);
  }

  public create(error: ExperimentError, logger?: UpgradeLogger): Promise<ExperimentError> {
    if (logger) {
      logger.info({ message: 'Inserting an error', details: error });
    }
    return this.errorRepository.save(error).catch((err) => {
      err.type = SERVER_ERROR.QUERY_FAILED;
      logger.error(err);
      throw err;
    });
  }
}
