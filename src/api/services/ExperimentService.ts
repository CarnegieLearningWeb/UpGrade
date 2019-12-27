import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Experiment } from '../models/Experiment';
import uuid from 'uuid/v4';
import { ExperimentConditionRepository } from '../repositories/ExperimentConditionRepository';
import { ExperimentSegmentRepository } from '../repositories/ExperimentSegmentRepository';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { ExperimentSegment } from '../models/ExperimentSegment';
import { ScheduledJobService } from './ScheduledJobService';

@Service()
export class ExperimentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository() private experimentConditionRepository: ExperimentConditionRepository,
    @OrmRepository() private experimentSegmentRepository: ExperimentSegmentRepository,
    public scheduledJobService: ScheduledJobService,
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

  public async getExperimentalConditions(experimentId: string): Promise<ExperimentCondition[]> {
    const experiment: Experiment = await this.findOne(experimentId);
    return experiment.conditions;
  }

  public async getExperimentSegments(experimentId: string): Promise<ExperimentSegment[]> {
    const experiment: Experiment = await this.findOne(experimentId);
    return experiment.segments;
  }

  private async updateExperimentInDB(experiment: Experiment): Promise<Experiment> {
    // get old experiment document
    const oldExperiment = await this.findOne(experiment.id);
    const oldConditions = oldExperiment.conditions;
    const oldSegments = oldExperiment.segments;

    // create schedules to start experiment and end experiment
    await this.scheduledJobService.updateExperimentSchedules(experiment);

    // TODO add transaction over here

    const { conditions, segments, versionNumber, createdAt, updatedAt, ...expDoc } = experiment;
    let experimentDoc: Experiment;
    try {
      experimentDoc = (await this.experimentRepository.updateExperiment(expDoc.id, expDoc))[0];
    } catch (error) {
      throw new Error(`Error in updating experiment document "updateExperimentInDB" ${error}`);
    }

    // creating condition docs
    const conditionDocToSave: Array<Partial<ExperimentCondition>> =
      (conditions &&
        conditions.length > 0 &&
        conditions.map((condition: ExperimentCondition) => {
          // tslint:disable-next-line:no-shadowed-variable
          const { createdAt, updatedAt, versionNumber, ...rest } = condition;
          rest.experiment = experimentDoc;
          rest.id = rest.id || uuid();
          return rest;
        })) ||
      [];

    // creating segment docs
    const segmentDocToSave =
      (segments &&
        segments.length > 0 &&
        segments.map(segment => {
          // tslint:disable-next-line:no-shadowed-variable
          const { createdAt, updatedAt, versionNumber, ...rest } = segment;
          if (rest.id && rest.id === `${rest.name}_${rest.point}`) {
            rest.id = rest.id;
          } else {
            rest.id = `${rest.name}_${rest.point}`;
          }
          rest.experiment = experimentDoc;
          return rest;
        })) ||
      [];

    // saving conditions and saving segments
    let conditionDocs: ExperimentCondition[];
    let segmentDocs: ExperimentSegment[];
    try {
      [conditionDocs, segmentDocs] = await Promise.all([
        Promise.all(
          conditionDocToSave.map(async conditionDoc => {
            return this.experimentConditionRepository.upsertExperimentCondition(conditionDoc);
          })
        ) as any,
        Promise.all(
          segmentDocToSave.map(async segmentDoc => {
            return this.experimentSegmentRepository.upsertExperimentSegment(segmentDoc);
          })
        ) as any,
      ]);
    } catch (error) {
      throw new Error(`Error in creating conditions and segments "updateExperimentInDB" ${error}`);
    }

    // TODO checking/storing revert condition in the experiment doc with conditionId

    // delete conditions which don't exist in new experiment document
    const toDeleteConditions = [];
    oldConditions.forEach(({ id }) => {
      if (
        !conditionDocs.find(doc => {
          return doc.id === id;
        })
      ) {
        toDeleteConditions.push(this.experimentConditionRepository.delete({ id }));
      }
    });

    // delete segments which don't exist in new experiment document
    const toDeleteSegments = [];
    oldSegments.forEach(({ id, point, name }) => {
      if (
        !segmentDocs.find(doc => {
          return doc.id === id && doc.point === point && doc.name === name;
        })
      ) {
        toDeleteSegments.push(this.experimentSegmentRepository.delete({ id, point }));
      }
    });

    // delete old segments and conditions
    await Promise.all([...toDeleteConditions, ...toDeleteSegments]);

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

    // create schedules to start experiment and end experiment
    await this.scheduledJobService.updateExperimentSchedules(experiment);

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
        segment.id = `${segment.name}_${segment.point}`;
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

    // TODO checking/storing revert condition in the experiment doc with conditionId

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
