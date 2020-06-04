import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { QueryRepository } from '../repositories/QueryRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Query } from '../models/Query';
import { MetricRepository } from '../repositories/MetricRepository';

@Service()
export class QueryService {
  constructor(
    @OrmRepository() private queryRepository: QueryRepository,
    @OrmRepository() private metricRepository: MetricRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public find(): Promise<Query[]> {
    this.log.info('Find all query');
    return this.queryRepository.find({
      relations: ['metric'],
    });
  }

  public async saveQuery(query: any, metric: string): Promise<Query | any> {
    this.log.info('Save all query');
    const metricDoc = this.metricRepository.findOne(metric);
    const queryDoc: any = {
      query,
      metric: metricDoc,
      experiments: [],
    };
    return this.queryRepository.save(queryDoc);
  }
}
