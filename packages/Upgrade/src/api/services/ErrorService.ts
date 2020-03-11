import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ErrorRepository } from '../repositories/ErrorRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentError } from '../models/ExperimentError';

@Service()
export class ErrorService {
  constructor(
    @OrmRepository() private errorRepository: ErrorRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public getTotalLogs(): Promise<number> {
    return this.errorRepository.count();
  }

  public getErrorLogs(limit: number, offset: number): Promise<ExperimentError[]> {
    return this.errorRepository.paginatedFind(limit, offset);
  }

  public create(error: ExperimentError): Promise<ExperimentError> {
    this.log.info(`Inserting an error => ${JSON.stringify(error)}`);
    return this.errorRepository.save(error).catch(errorMsg => {
      throw new Error(errorMsg);
    });
  }
}
