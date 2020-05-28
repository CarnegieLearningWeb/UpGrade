import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { LogRepository } from '../repositories/LogRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { OPERATION_TYPES } from 'upgrade_types';

@Service()
export class DataLogService {
  constructor(
    @OrmRepository() private logRepository: LogRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public async analyse(
    experimentId: string,
    metrics: string[],
    operationTypes: OPERATION_TYPES,
    timeRange: any
  ): Promise<any> {
    this.log.info(
      `Get analysis of operation endpoint experimentId ${experimentId} metrics ${metrics} operationTypes ${operationTypes} timeRange ${timeRange}`
    );
    // convert metric json into string
    return await this.logRepository.analysis(experimentId, metrics, operationTypes, timeRange);
  }
}
