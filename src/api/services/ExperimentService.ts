import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Experiment } from '../models/Experiment';
import { getExperimentAssignment } from './ConditionAssignment';
import uuid from 'uuid/v4';
import { ExperimentConditionRepository } from '../repositories/ExperimentConditionRepository';
import { ExperimentSegmentRepository } from '../repositories/ExperimentSegmentRepository';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { ExperimentSegment } from '../models/ExperimentSegment';

@Service()
export class ExperimentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository() private experimentConditionRepository: ExperimentConditionRepository,
    @OrmRepository() private experimentSegmentRepository: ExperimentSegmentRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public find(): Promise<Experiment[]> {
    this.log.info(`Find all experiments`);
    return this.experimentRepository
      .createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.conditions', 'conditions')
      .innerJoinAndSelect('experiment.segments', 'segments')
      .getMany();
  }

  public findOne(id: string): Promise<Experiment | undefined> {
    this.log.info(`Find experiment by id => ${id}`);
    return this.experimentRepository
      .createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.conditions', 'conditions')
      .innerJoinAndSelect('experiment.segments', 'segments')
      .where({ id })
      .getOne();
  }

  public create(experiment: Experiment): Promise<Experiment> {
    this.log.info('Create a new experiment => ', experiment.toString());
    return this.addExperimentInDB(experiment);
  }

  public update(id: string, experiment: Experiment): Promise<Experiment> {
    this.log.info('Update an experiment => ', experiment.toString());
    return this.updateExperimentInDB(experiment);
  }

  public getExperimentalConditions(experimentId: string, experimentPoint: string): Promise<ExperimentSegment> {
    this.log.info('Get experimental conditions => ', experimentId, experimentPoint);
    return this.experimentSegmentRepository.findOne({
      where: {
        id: experimentId,
        point: experimentPoint,
      },
      relations: ['experiment', 'experiment.conditions'],
      select: ['id', 'point'],
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

  private async updateExperimentInDB(experiment: Experiment): Promise<Experiment> {
    // TODO add transaction over here
    const { conditions, segments, ...expDoc } = experiment;
    let experimentDoc: Experiment;
    try {
      experimentDoc = (await this.experimentRepository.updateExperiment(expDoc.id, expDoc))[0];
    } catch (error) {
      throw new Error(`Error in updating experiment document "updateExperimentInDB" ${error}`);
    }

    // creating condition docs
    const conditionDocToSave =
      conditions &&
      conditions.length > 0 &&
      conditions.map((condition: ExperimentCondition) => {
        condition.experiment = experimentDoc;
        return condition;
      });

    // creating segment docs
    const segmentDocToSave =
      segments &&
      segments.length > 0 &&
      segments.map(segment => {
        segment.experiment = experimentDoc;
        return segment;
      });

    // saving conditions and saving segments
    let conditionDocs: ExperimentCondition[];
    let segmentDocs: ExperimentSegment[];
    try {
      [conditionDocs, segmentDocs] = await Promise.all([
        Promise.all(
          conditionDocToSave.map(async conditionDoc => {
            return this.experimentConditionRepository.updateExperimentCondition(conditionDoc.id, conditionDoc);
          })
        ) as any,
        Promise.all(
          segmentDocToSave.map(async segmentDoc => {
            return this.experimentSegmentRepository.updateExperimentSegment(
              segmentDoc.id,
              segmentDoc.point,
              segmentDoc
            );
          })
        ) as any,
      ]);
    } catch (error) {
      throw new Error(`Error in creating conditions and segments "updateExperimentInDB" ${error}`);
    }

    const conditionDocToReturn = conditionDocs.map(conditionDoc => {
      return { ...conditionDoc, experiment: conditionDoc.experiment };
    });

    const segmentDocToReturn = segmentDocs.map(segmentDoc => {
      return { ...segmentDoc, experiment: segmentDoc.experiment };
    });

    return { ...experimentDoc, conditions: conditionDocToReturn as any, segments: segmentDocToReturn as any };
  }

  private async addExperimentInDB(experiment: Experiment): Promise<Experiment> {
    // TODO add transaction over here
    experiment.id = experiment.id || uuid();
    const { conditions, segments, ...expDoc } = experiment;
    // saving experiment doc
    let experimentDoc: Experiment;
    try {
      experimentDoc = (await this.experimentRepository.insertExperiment(expDoc as any))[0];
    } catch (error) {
      throw new Error(`Error in creating experiment document "addExperimentInDB" ${error}`);
    }

    // creating condition docs
    const conditionDocsToSave =
      conditions &&
      conditions.length > 0 &&
      conditions.map((condition: ExperimentCondition) => {
        condition.id = condition.id || uuid();
        condition.experiment = experimentDoc;
        return condition;
      });

    // creating segment docs
    const segmentDocsToSave =
      segments &&
      segments.length > 0 &&
      segments.map(segment => {
        segment.id = segment.id || uuid();
        segment.experiment = experimentDoc;
        return segment;
      });

    // saving conditions and saving segments
    let conditionDocs: ExperimentCondition[];
    let segmentDocs: ExperimentSegment[];
    try {
      [conditionDocs, segmentDocs] = await Promise.all([
        this.experimentConditionRepository.insertConditions(conditionDocsToSave),
        this.experimentSegmentRepository.insertSegments(segmentDocsToSave),
      ]);
    } catch (error) {
      throw new Error(`Error in creating conditions and segments "addExperimentInDB" ${error}`);
    }

    const conditionDocToReturn = conditionDocs.map(conditionDoc => {
      const { experimentId, ...rest } = conditionDoc as any;
      return rest;
    });

    const segmentDocToReturn = segmentDocs.map(segmentDoc => {
      const { experimentId, ...rest } = segmentDoc as any;
      return rest;
    });

    return { ...experimentDoc, conditions: conditionDocToReturn as any, segments: segmentDocToReturn as any };
  }
}
