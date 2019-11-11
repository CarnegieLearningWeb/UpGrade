import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Experiment } from '../models/Experiment';
import { getExperimentAssignment } from './ConditionAssignment';
import uuid from 'uuid/v4';
import { ExperimentConditionRepository } from '../repositories/ExperimentConditionRepository';
import { ExperimentSegmentConditionRepository } from '../repositories/ExperimentSegmentConditionRepository';
import { ExperimentSegmentRepository } from '../repositories/ExperimentSegmentRepository';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { ExperimentSegment } from '../models/ExperimentSegment';

@Service()
export class ExperimentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository() private experimentConditionRepository: ExperimentConditionRepository,
    @OrmRepository() private experimentSegmentRepository: ExperimentSegmentRepository,
    @OrmRepository() private experimentSegmentConditionRepository: ExperimentSegmentConditionRepository,
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
    return this.addExperimentInDB(experiment);
  }

  public update(id: string, experiment: Experiment): Promise<Experiment> {
    this.log.info('Update an experiment => ', experiment.toString());
    return this.addExperimentInDB(experiment);
  }

  public getExperimentalConditions(experimentId: string, experimentPoint: string): Promise<ExperimentSegment> {
    this.log.info('Get experimental conditions => ', experimentId, experimentPoint);
    return this.experimentSegmentRepository.findOne({
      where: {
        id: experimentId,
        point: experimentPoint,
      },
      select: ['id', 'point'],
      relations: ['segmentConditions'],
    });
  }

  public getExperimentAssignment(data: any): string {
    const {
      userId,
      userEnvironment,
      experiment,
      individualAssignment,
      groupAssignment,
      isExcluded,
      individualExclusion,
      groupExclusion,
    } = data;
    return getExperimentAssignment(
      userId,
      userEnvironment,
      experiment,
      individualAssignment,
      groupAssignment,
      individualExclusion,
      groupExclusion,
      isExcluded
    );
  }

  private async addExperimentInDB(experiment: Experiment): Promise<Experiment> {
    // TODO add transaction over here
    experiment.id = experiment.id || uuid();
    // save the experiment over here
    const { conditions, segments, ...expDoc } = experiment;
    // saving experiment doc
    const experimentDoc = await this.experimentRepository.save(expDoc);

    // adding random id for experimental conditions
    if (conditions && conditions.length > 0) {
      const conditionDoc = conditions.map((condition: ExperimentCondition) => {
        condition.id = condition.id || uuid();
        condition.experiment = experimentDoc;
        return condition;
      });

      // saving conditions
      await this.experimentConditionRepository.save(conditionDoc);
    }
    // adding random id for experimental segments
    if (segments && segments.length > 0) {
      const segmentDocTpSave = segments.map(segment => {
        segment.id = segment.id || uuid();
        segment.experiment = experimentDoc;
        const { segmentConditions, ...segmentDoc } = segment;
        return segmentDoc;
      });

      // saving segments
      const segmentSavedDocs = await this.experimentSegmentRepository.save(segmentDocTpSave);

      segmentSavedDocs.map(async (segmentSaved, segmentIndex) => {
        const segmentConditionDocs = [
          ...segments[segmentIndex].segmentConditions.map((segmentCondition, segmentConditionIndex) => {
            segmentCondition.id = segmentCondition.id || uuid();
            segmentCondition.experimentSegment = segmentSaved;
            segmentCondition.experimentConditionId = conditions[segmentConditionIndex].id;
            return segmentCondition;
          }),
        ];
        // saving segment conditions
        await this.experimentSegmentConditionRepository.save(segmentConditionDocs);
      });
    }

    return experimentDoc;
  }
}
