import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { QueryRepository } from '../repositories/QueryRepository';
import { Query } from '../models/Query';
import { LogRepository } from '../repositories/LogRepository';
import { EXPERIMENT_TYPE, SERVER_ERROR } from 'upgrade_types';
import { ErrorService } from './ErrorService';
import { ExperimentError } from '../models/ExperimentError';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { Experiment } from '../models/Experiment';

interface queryResult {
  conditionId?: string;
  levelId?: string;
  result: number;
  participantsLogged: number;
}

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
        relations: [
          'metric',
          'experiment',
          'experiment.conditions',
          'experiment.partitions',
          'experiment.factors',
          'experiment.factors.levels',
        ],
      })
    );

    const promiseResult = await Promise.all(promiseArray);
    const experiments: Experiment[] = [];
    const analyzePromise = promiseResult.map((query) => {
      experiments.push(query.experiment);
      if (query.experiment?.type === EXPERIMENT_TYPE.FACTORIAL) {
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
      const [mainEffect, interactionEffect] = this.addZeroDataToResults(experiments[index], res[0], res[1]);
      return { id: queryIds[index], mainEffect: mainEffect, interactionEffect: interactionEffect || null };
    });
    return modifiedResponseToReturn;
  }

  public addZeroDataToResults(
    experiment: Experiment,
    mainEffect: queryResult[],
    interactionEffect: queryResult[]
  ): [queryResult[], queryResult[]] {
    const conditionIds = experiment?.conditions.map((condition) => condition.id) || [];

    if (interactionEffect) {
      conditionIds.forEach((conditionId) => {
        if (!interactionEffect.some((result) => result.conditionId === conditionId)) {
          interactionEffect.push({ conditionId, result: 0, participantsLogged: 0 });
        }
      });

      experiment.factors.forEach((factor) => {
        factor.levels.forEach((level) => {
          if (!mainEffect.some((result) => result.levelId === level.id)) {
            mainEffect.push({ levelId: level.id, result: 0, participantsLogged: 0 });
          }
        });
      });
    } else {
      conditionIds.forEach((conditionId) => {
        if (!mainEffect.some((result) => result.conditionId === conditionId)) {
          mainEffect.push({ conditionId, result: 0, participantsLogged: 0 });
        }
      });
    }

    return [mainEffect, interactionEffect];
  }
}
