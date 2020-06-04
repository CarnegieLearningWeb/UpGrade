import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { QueryRepository } from '../repositories/QueryRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Query } from '../models/Query';
import { MetricRepository } from '../repositories/MetricRepository';
import { ExperimentService } from './ExperimentService';
import { Experiment } from '../models/Experiment';
import { Metric } from '../models/Metric';

@Service()
export class QueryService {
  constructor(
    @OrmRepository() private queryRepository: QueryRepository,
    @OrmRepository() private metricRepository: MetricRepository,
    private experimentService: ExperimentService,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public find(): Promise<Query[]> {
    this.log.info('Find all query');
    return this.queryRepository.find({
      relations: ['metric'],
    });
  }

  public async saveQuery(query: any, metric: string, experimentId: string): Promise<Query | any> {
    this.log.info('Save all query');
    const promiseResult = await Promise.all([
      this.experimentService.findOne(experimentId),
      this.metricRepository.findOne(metric),
    ]);

    const experiment: Experiment = promiseResult[0];
    const metricDoc: Metric = promiseResult[1];
    const queryDoc: any = {
      query,
      metric: metricDoc,
      experiment,
    };
    return this.queryRepository.save(queryDoc);
  }
}
