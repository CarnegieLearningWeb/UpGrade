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
    return this.experimentRepository
      .createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.conditions', 'conditions')
      .innerJoinAndSelect('experiment.segments', 'segments')
      .innerJoinAndSelect('segments.segmentConditions', 'segmentConditions')
      .getMany();
  }

  public findOne(id: string): Promise<Experiment | undefined> {
    this.log.info(`Find experiment by id => ${id}`);
    return this.experimentRepository
      .createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.conditions', 'conditions')
      .innerJoinAndSelect('experiment.segments', 'segments')
      .innerJoinAndSelect('segments.segmentConditions', 'segmentConditions')
      .where({ id })
      .getOne();
  }

  public create(experiment: Experiment): Promise<Experiment> {
    this.log.info('Create a new experiment => ', experiment.toString());
    experiment.id = uuid();
    // adding random id for experimental conditions
    if (experiment.conditions && experiment.conditions.length > 0) {
      experiment.conditions.forEach(condition => {
        condition.id = uuid();
        condition.experiment = experiment.id as any;
      });
    }
    // adding random id for experimental segments
    if (experiment.segments && experiment.segments.length > 0) {
      experiment.segments.forEach(segment => {
        segment.id = uuid();
        segment.experiment = experiment.id as any;
        segment.segmentConditions.forEach((segmentCondition, index) => {
          segmentCondition.id = uuid();
          segmentCondition.experimentSegment = segment.id as any;
          segmentCondition.experimentConditionId = experiment.conditions[index].id;
        });
      });
    }
    return this.experimentRepository.save(experiment);
  }

  public update(id: string, experiment: Experiment): Promise<Experiment> {
    this.log.info('Update a new experiment => ', experiment.toString());
    experiment.id = id;
    return this.experimentRepository.save(experiment);
  }
}
