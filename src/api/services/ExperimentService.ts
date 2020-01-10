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
import { getConnection } from 'typeorm';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { EXPERIMENT_LOG_TYPE } from '../models/ExperimentAuditLog';
import { diffString } from 'json-diff';

@Service()
export class ExperimentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository() private experimentConditionRepository: ExperimentConditionRepository,
    @OrmRepository() private experimentSegmentRepository: ExperimentSegmentRepository,
    @OrmRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
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

  public findPaginated(skip: number, take: number): Promise<Experiment[]> {
    this.log.info(`Find paginated experiments`);
    return this.experimentRepository
      .createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.conditions', 'conditions')
      .innerJoinAndSelect('experiment.segments', 'segments')
      .skip(skip)
      .take(take)
      .orderBy('experiment.createdAt', 'DESC')
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

  public getTotalCount(): Promise<number> {
    return this.experimentRepository.count();
  }

  public create(experiment: Experiment): Promise<Experiment> {
    this.log.info('Create a new experiment => ', experiment.toString());
    // TODO add entry in audit log of creating experiment
    return this.addExperimentInDB(experiment);
  }

  public update(id: string, experiment: Experiment): Promise<Experiment> {
    this.log.info('Update an experiment => ', experiment.toString());
    // TODO add entry in audit log of updating experiment
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
    this.scheduledJobService.updateExperimentSchedules(experiment);

    // add AuditLogs here
    const updateAuditLog = {
      diff: diffString(experiment, oldExperiment),
    };

    this.experimentAuditLogRepository.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED, updateAuditLog);

    return getConnection().transaction(async transactionalEntityManager => {
      const { conditions, segments, versionNumber, createdAt, updatedAt, ...expDoc } = experiment;
      let experimentDoc: Experiment;
      try {
        experimentDoc = (await this.experimentRepository.updateExperiment(expDoc, transactionalEntityManager))[0];
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
              return this.experimentConditionRepository.upsertExperimentCondition(
                conditionDoc,
                transactionalEntityManager
              );
            })
          ) as any,
          Promise.all(
            segmentDocToSave.map(async segmentDoc => {
              return this.experimentSegmentRepository.upsertExperimentSegment(segmentDoc, transactionalEntityManager);
            })
          ) as any,
        ]);
      } catch (error) {
        throw new Error(`Error in creating conditions and segments "updateExperimentInDB" ${error}`);
      }

      // delete conditions which don't exist in new experiment document
      const toDeleteConditions = [];
      oldConditions.forEach(({ id }) => {
        if (
          !conditionDocs.find(doc => {
            return doc.id === id;
          })
        ) {
          toDeleteConditions.push(this.experimentConditionRepository.deleteCondition(id, transactionalEntityManager));
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
          toDeleteSegments.push(this.experimentSegmentRepository.deleteSegment(id, transactionalEntityManager));
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
    });
  }

  private async addExperimentInDB(experiment: Experiment): Promise<Experiment> {
    // create schedules to start experiment and end experiment
    this.scheduledJobService.updateExperimentSchedules(experiment);

    const createdExperiment = await getConnection().transaction(async transactionalEntityManager => {
      experiment.id = experiment.id || uuid();
      const { conditions, segments, ...expDoc } = experiment;
      // saving experiment doc
      let experimentDoc: Experiment;
      try {
        experimentDoc = (
          await this.experimentRepository.insertExperiment(expDoc as any, transactionalEntityManager)
        )[0];
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
          segment.id = `${segment.name}_${segment.point}`;
          segment.experiment = experimentDoc;
          return segment;
        });

      // saving conditions and saving segments
      let conditionDocs: ExperimentCondition[];
      let segmentDocs: ExperimentSegment[];
      try {
        [conditionDocs, segmentDocs] = await Promise.all([
          this.experimentConditionRepository.insertConditions(conditionDocsToSave, transactionalEntityManager),
          this.experimentSegmentRepository.insertSegments(segmentDocsToSave, transactionalEntityManager),
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
    });

    // add auditLog here
    const createAuditLogData = {
      experimentId: createdExperiment.id,
    };
    this.experimentAuditLogRepository.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED, createAuditLogData);

    return createdExperiment;
  }
}
