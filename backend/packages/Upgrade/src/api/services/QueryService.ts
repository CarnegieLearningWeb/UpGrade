import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { QueryRepository } from '../repositories/QueryRepository';
import { Query } from '../models/Query';
import { LogRepository } from '../repositories/LogRepository';
import { EXPERIMENT_TYPE, SERVER_ERROR } from 'upgrade_types';
import { ErrorService } from './ErrorService';
import { ExperimentError } from '../models/ExperimentError';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

@Service()
export class QueryService {
  constructor(
    @OrmRepository() private queryRepository: QueryRepository,
    @OrmRepository() private logRepository: LogRepository,
    public errorService: ErrorService
  ) {}

  public async find(logger: UpgradeLogger): Promise<Query[]> {
    logger.info({ message: 'Find all query' });
    const queries = await this.queryRepository.find({
      relations: ['metric', 'experiment'],
    });
    return queries.map((query) => {
      const { experiment, ...rest } = query;
      return { ...rest, experiment: { id: experiment.id, name: experiment.name } } as any;
    });
  }

  public async analyze(queryIds: string[], logger: UpgradeLogger): Promise<any> {
    logger.info({ message: `Get analysis of query with queryIds ${queryIds}` });
    const promiseArray = queryIds.map((queryId) =>
      this.queryRepository.findOne(queryId, {
        relations: ['metric', 'experiment'],
      })
    );

    const modifiedQueryIds = [];
    const promiseResult = await Promise.all(promiseArray);
    const analyzePromise = promiseResult
      .map((query) => {
        modifiedQueryIds.push(query.id);
        if (query.experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
          modifiedQueryIds.push(query.id);
          return [
            this.logRepository.analysis({
              ...query,
              experiment: { ...query.experiment, type: EXPERIMENT_TYPE.SIMPLE },
            }),
            this.logRepository.analysis(query),
          ];
        }
        return [this.logRepository.analysis(query)];
      })
      .flat();
    const response = await Promise.allSettled(analyzePromise);

    const failedQuery = Array<Promise<any>>();

    let modifiedResponse = response.map((query, index) => {
      if (query.status === 'fulfilled') {
        return query.value;
      } else {
        logger.error({ message: `Error in Query Id ${queryIds[index]}` });
        failedQuery.push(
          this.errorService.create(
            {
              endPoint: '/api/query/analyse',
              errorCode: 500,
              message: `Query Failed error: ${JSON.stringify(queryIds[index], undefined, 2)}`,
              name: 'Query Failed error',
              type: SERVER_ERROR.QUERY_FAILED,
            } as ExperimentError,
            logger
          )
        );
        return [query.status];
      }
    });

    if (failedQuery.length) {
      await Promise.all(failedQuery);
    }
    modifiedResponse = modifiedResponse.map((res, index) => {
      return { id: modifiedQueryIds[index], result: res };
    });
    return modifiedResponse;
  }
}
