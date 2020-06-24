import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { QueryRepository } from '../repositories/QueryRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Query } from '../models/Query';
import { LogRepository } from '../repositories/LogRepository';

@Service()
export class QueryService {
  constructor(
    @OrmRepository() private queryRepository: QueryRepository,
    @OrmRepository() private logRepository: LogRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public async find(): Promise<Query[]> {
    this.log.info('Find all query');
    const queries = await this.queryRepository.find({
      relations: ['metric', 'experiment'],
    });
    return queries.map(query => {
      const { experiment, ...rest } = query;
      return { ...rest, experiment: { id: experiment.id, name: experiment.name } } as any;
    });
  }

  public async analyse(queryIds: string[]): Promise<any> {
    this.log.info(`Get analysis of query with queryIds ${queryIds}`);
    const promiseArray = queryIds.map(queryId =>
      this.queryRepository.findOne(queryId, {
        relations: ['metric', 'experiment'],
      })
    );

    const promiseResult = await Promise.all(promiseArray);
    const analysePromise = promiseResult.map(query => this.logRepository.analysis(query));
    let response = await Promise.all(analysePromise);
    response = response.map((res, index) => {
      return {
        id: queryIds[index],
        result: res,
      };
    });
    return response;
  }
}
