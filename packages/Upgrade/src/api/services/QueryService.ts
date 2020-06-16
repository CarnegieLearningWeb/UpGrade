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

  public async analyse(queryId: string): Promise<any> {
    this.log.info(`Get analysis of query with queryId ${queryId}`);
    const query = await this.queryRepository.findOne(queryId, {
      relations: ['metric', 'experiment'],
    });

    // convert metric json into string
    return await this.logRepository.analysis(query);
  }
}
