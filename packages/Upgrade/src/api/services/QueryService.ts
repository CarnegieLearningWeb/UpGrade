import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { QueryRepository } from '../repositories/QueryRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Query } from '../models/Query';
import { MetricRepository } from '../repositories/MetricRepository';
import { ExperimentService } from './ExperimentService';
import { Experiment } from '../models/Experiment';
import { Metric } from '../models/Metric';
import uuid from 'uuid/v4';
import { LogRepository } from '../repositories/LogRepository';

@Service()
export class QueryService {
  constructor(
    @OrmRepository() private queryRepository: QueryRepository,
    @OrmRepository() private metricRepository: MetricRepository,
    @OrmRepository() private logRepository: LogRepository,
    private experimentService: ExperimentService,
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

  // TODO: Remove save query method
  public async saveQuery(query: any, metric: string, experimentId: string): Promise<Query | any> {
    this.log.info('Save all query');
    const promiseResult = await Promise.all([
      this.experimentService.findOne(experimentId),
      this.metricRepository.findOne(metric),
    ]);

    const experiment: Experiment = promiseResult[0];
    const metricDoc: Metric = promiseResult[1];
    const queryDoc: any = {
      id: uuid(),
      name: '', // TODO: Fix this
      query,
      metric: metricDoc,
      experiment,
    };
    return this.queryRepository.save(queryDoc);
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
