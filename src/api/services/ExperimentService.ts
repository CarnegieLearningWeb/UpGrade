import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Experiment } from '../models/Experiment';
import uuid from 'uuid/v4';

@Service()
export class ExperimentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public find(): Promise<Experiment[]> {
    this.log.info(`Find all experiments`);
    return this.experimentRepository.find();
  }

  public findOne(id: string): Promise<Experiment | undefined> {
    this.log.info(`Find experiment by id => ${id}`);
    return this.experimentRepository.findOne({ id });
  }

  public create(experiment: Experiment): Promise<Experiment> {
    this.log.info('Create a new experiment => ', experiment.toString());
    experiment.id = uuid();
    return this.experimentRepository.save(experiment);
  }

  public update(id: string, experiment: Experiment): Promise<Experiment> {
    this.log.info('Update a new experiment => ', experiment.toString());
    experiment.id = id;
    return this.experimentRepository.save(experiment);
  }
}
