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

    const promiseResult = await Promise.all(promiseArray);
    const analyzePromise = promiseResult.map((query) => {
      if (query.experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
        return [
          this.logRepository.analysis(query),
          this.logRepository.analysis({
            ...query,
            experiment: { ...query.experiment, type: EXPERIMENT_TYPE.SIMPLE },
          }),
        ];
      }
      return [this.logRepository.analysis(query)];
    });

    const response = await Promise.all(
      analyzePromise.map(async (queryArray) => {
        return await Promise.allSettled(queryArray);
      })
    );

    const failedQuery = Array<Promise<any>>();

    const modifiedResponse = response.map((queryArray, index) => {
      return queryArray.map((query) => {
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
    });

    if (failedQuery.length) {
      await Promise.all(failedQuery);
    }
    const modifiedResponseToReturn = modifiedResponse.map((res, index) => {
      return { id: queryIds[index], mainEffect: res[0], interactionEffect: res[1] || null };
    });
    return modifiedResponseToReturn;
  }
}
