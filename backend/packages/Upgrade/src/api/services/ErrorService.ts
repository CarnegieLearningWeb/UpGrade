import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ErrorRepository } from '../repositories/ErrorRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentError } from '../models/ExperimentError';
import { SERVER_ERROR } from 'upgrade_types';

@Service()
export class ErrorService {
  constructor(
    @OrmRepository() private errorRepository: ErrorRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public getTotalLogs(filter: SERVER_ERROR): Promise<number> {
    if (filter) {
      return this.errorRepository.getTotalLogs(filter);
    }
    return this.errorRepository.count();
  }

  public getErrorLogs(limit: number, offset: number, filter: SERVER_ERROR): Promise<ExperimentError[]> {
    return this.errorRepository.paginatedFind(limit, offset, filter);
  }

  public create(error: ExperimentError): Promise<ExperimentError> {
    this.log.info(`Inserting an error => ${JSON.stringify(error)}`);
    return this.errorRepository.save(error).catch((err) => {
      err.type = SERVER_ERROR.QUERY_FAILED;
      throw err;
    });
  }
}
