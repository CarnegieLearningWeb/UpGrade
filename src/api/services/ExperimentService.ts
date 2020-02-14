import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Experiment, SearchParams, SEARCH_KEY, SortParams } from '../models/Experiment';
import uuid from 'uuid/v4';
import { ExperimentConditionRepository } from '../repositories/ExperimentConditionRepository';
import { ExperimentPartitionRepository } from '../repositories/ExperimentPartitionRepository';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { ExperimentPartition } from '../models/ExperimentPartition';
import { ScheduledJobService } from './ScheduledJobService';
import { getConnection } from 'typeorm';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { diffString } from 'json-diff';
import { EXPERIMENT_LOG_TYPE } from 'ees_types';
import { IndividualAssignmentRepository } from '../repositories/IndividualAssignmentRepository';
import { GroupAssignmentRepository } from '../repositories/GroupAssignmentRepository';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { MonitoredExperimentPointRepository } from '../repositories/MonitoredExperimentPointRepository';
import { ScheduledJobRepository } from '../repositories/ScheduledJobRepository';
import { User } from '../models/User';
import { AuditLogData } from 'ees_types/dist/Experiment/interfaces';

@Service()
export class ExperimentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository() private experimentConditionRepository: ExperimentConditionRepository,
    @OrmRepository() private experimentPartitionRepository: ExperimentPartitionRepository,
    @OrmRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
    @OrmRepository() private individualAssignmentRepository: IndividualAssignmentRepository,
    @OrmRepository() private groupAssignmentRepository: GroupAssignmentRepository,
    @OrmRepository() private individualExclusionRepository: IndividualExclusionRepository,
    @OrmRepository() private groupExclusionRepository: GroupExclusionRepository,
    @OrmRepository() private monitoredExperimentPointRepository: MonitoredExperimentPointRepository,
    @OrmRepository() private scheduledJobRepository: ScheduledJobRepository,

    public scheduledJobService: ScheduledJobService,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public find(): Promise<Experiment[]> {
    this.log.info(`Find all experiments`);
    return this.experimentRepository
      .createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.conditions', 'conditions')
      .innerJoinAndSelect('experiment.partitions', 'partitions')
      .getMany();
  }

  public findPaginated(
    skip: number,
    take: number,
    searchParams?: SearchParams,
    sortParams?: SortParams
  ): Promise<Experiment[]> {
    this.log.info(`Find paginated experiments`);

    let queryBuilder = this.experimentRepository
      .createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.conditions', 'conditions')
      .innerJoinAndSelect('experiment.partitions', 'partitions');

    if (searchParams) {
      // add search query
      const postgresSearchString = this.postgresSearchString(searchParams.key);
      queryBuilder = queryBuilder
        .addSelect(`ts_rank_cd(to_tsvector('english',${postgresSearchString}), to_tsquery(:query))`, 'rank')
        .orderBy('rank', 'DESC')
        .setParameter('query', `${searchParams.string}:*`);
    }

    if (sortParams) {
      queryBuilder = queryBuilder.orderBy(`experiment.${sortParams.key}`, sortParams.sortAs);
    }

    queryBuilder = queryBuilder.skip(skip).take(take);

    return queryBuilder.getMany();
  }

  public findOne(id: string): Promise<Experiment | undefined> {
    this.log.info(`Find experiment by id => ${id}`);
    return this.experimentRepository
      .createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.conditions', 'conditions')
      .innerJoinAndSelect('experiment.partitions', 'partitions')
      .where({ id })
      .getOne();
  }

  public getTotalCount(): Promise<number> {
    return this.experimentRepository.count();
  }

  public create(experiment: Experiment, currentUser: User): Promise<Experiment> {
    this.log.info('Create a new experiment => ', experiment.toString());
    // TODO add entry in audit log of creating experiment
    return this.addExperimentInDB(experiment, currentUser);
  }

  public async delete(experimentId: string, currentUser: User): Promise<Experiment | undefined> {
    this.log.info('Delete experiment => ', experimentId);

    return getConnection().transaction(async transactionalEntityManager => {
      const experiment = await this.findOne(experimentId);

      if (experiment) {
        // delete conditions and partitions
        const conditionIds = experiment.conditions.map(condition => condition.id);
        const partitionIds = experiment.partitions.map(partition => partition.id);

        // monitoredIds
        const monitoredIds = experiment.partitions.map(partition => {
          return partition.id;
        });

        // deleting data related to experiment
        await Promise.all([
          this.groupAssignmentRepository.deleteByExperimentId(experimentId, transactionalEntityManager),
          this.groupExclusionRepository.deleteByExperimentId(experimentId, transactionalEntityManager),
          this.individualAssignmentRepository.deleteByExperimentId(experimentId, transactionalEntityManager),
          this.individualExclusionRepository.deleteByExperimentId(experimentId, transactionalEntityManager),
          this.monitoredExperimentPointRepository.deleteById(monitoredIds, transactionalEntityManager),
          this.scheduledJobRepository.deleteByExperimentId(experimentId, transactionalEntityManager),
        ]);

        // deleting partitions and conditions
        await Promise.all([
          this.experimentConditionRepository.deleteByIds(conditionIds, transactionalEntityManager),
          this.experimentPartitionRepository.deleteByIds(partitionIds, transactionalEntityManager),
        ]);

        const deletedExperiment = await this.experimentRepository.deleteById(experimentId, transactionalEntityManager);

        // adding entry in audit log
        const deleteAuditLogData = {
          experimentName: experiment.name,
        };
        await this.experimentAuditLogRepository.saveRawJson(
          EXPERIMENT_LOG_TYPE.EXPERIMENT_DELETED,
          deleteAuditLogData,
          currentUser
        );

        return deletedExperiment;
      }

      return undefined;
    });
  }

  public update(id: string, experiment: Experiment, currentUser: User): Promise<Experiment> {
    this.log.info('Update an experiment => ', experiment.toString());
    // TODO add entry in audit log of updating experiment
    return this.updateExperimentInDB(experiment, currentUser);
  }

  public async getExperimentalConditions(experimentId: string): Promise<ExperimentCondition[]> {
    const experiment: Experiment = await this.findOne(experimentId);
    return experiment.conditions;
  }

  public async getExperimentPartitions(experimentId: string): Promise<ExperimentPartition[]> {
    const experiment: Experiment = await this.findOne(experimentId);
    return experiment.partitions;
  }

  private async updateExperimentInDB(experiment: Experiment, user: User): Promise<Experiment> {
    // get old experiment document
    const oldExperiment = await this.findOne(experiment.id);
    const oldConditions = oldExperiment.conditions;
    const oldPartitions = oldExperiment.partitions;

    // create schedules to start experiment and end experiment
    this.scheduledJobService.updateExperimentSchedules(experiment);

    return getConnection().transaction(async transactionalEntityManager => {
      const { conditions, partitions, versionNumber, createdAt, updatedAt, ...expDoc } = experiment;
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

      // creating partition docs
      const partitionDocToSave =
        (partitions &&
          partitions.length > 0 &&
          partitions.map(partition => {
            // tslint:disable-next-line:no-shadowed-variable
            const { createdAt, updatedAt, versionNumber, ...rest } = partition;
            if (rest.id && rest.id === `${rest.name}_${rest.point}`) {
              rest.id = rest.id;
            } else {
              rest.id = `${rest.name}_${rest.point}`;
            }
            rest.experiment = experimentDoc;
            return rest;
          })) ||
        [];

      // saving conditions and saving partitions
      let conditionDocs: ExperimentCondition[];
      let partitionDocs: ExperimentPartition[];
      try {
        [conditionDocs, partitionDocs] = await Promise.all([
          Promise.all(
            conditionDocToSave.map(async conditionDoc => {
              return this.experimentConditionRepository.upsertExperimentCondition(
                conditionDoc,
                transactionalEntityManager
              );
            })
          ) as any,
          Promise.all(
            partitionDocToSave.map(async partitionDoc => {
              return this.experimentPartitionRepository.upsertExperimentPartition(
                partitionDoc,
                transactionalEntityManager
              );
            })
          ) as any,
        ]);
      } catch (error) {
        throw new Error(`Error in creating conditions and partitions "updateExperimentInDB" ${error}`);
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

      // delete partitions which don't exist in new experiment document
      const toDeletePartitions = [];
      oldPartitions.forEach(({ id, point, name }) => {
        if (
          !partitionDocs.find(doc => {
            return doc.id === id && doc.point === point && doc.name === name;
          })
        ) {
          toDeletePartitions.push(this.experimentPartitionRepository.deletePartition(id, transactionalEntityManager));
        }
      });

      // delete old partitions and conditions
      await Promise.all([...toDeleteConditions, ...toDeletePartitions]);

      const conditionDocToReturn = conditionDocs.map(conditionDoc => {
        return { ...conditionDoc, experiment: conditionDoc.experiment };
      });

      const partitionDocToReturn = partitionDocs.map(partitionDoc => {
        return { ...partitionDoc, experiment: partitionDoc.experiment };
      });

      const newExperiment = {
        ...experimentDoc,
        conditions: conditionDocToReturn as any,
        partitions: partitionDocToReturn as any,
      };

      // removing unwanted params for diff
      const oldExperimentClone: Experiment = JSON.parse(JSON.stringify(oldExperiment));
      delete oldExperimentClone.versionNumber;
      delete oldExperimentClone.updatedAt;
      delete oldExperimentClone.createdAt;
      oldExperimentClone.partitions.map(partition => {
        delete partition.versionNumber;
        delete partition.updatedAt;
        delete partition.createdAt;
        delete (partition as any).experimentId;
      });
      oldExperimentClone.conditions.map(condition => {
        delete condition.versionNumber;
        delete condition.updatedAt;
        delete condition.createdAt;
        delete (condition as any).experimentId;
      });

      // removing unwanted params for diff
      const newExperimentClone = JSON.parse(JSON.stringify(newExperiment));
      delete newExperimentClone.versionNumber;
      delete newExperimentClone.updatedAt;
      delete newExperimentClone.createdAt;
      newExperimentClone.partitions.map(partition => {
        delete partition.versionNumber;
        delete partition.updatedAt;
        delete partition.createdAt;
        delete (partition as any).experimentId;
      });
      newExperimentClone.conditions.map(condition => {
        delete condition.versionNumber;
        delete condition.updatedAt;
        delete condition.createdAt;
        delete (condition as any).experimentId;
      });

      // add AuditLogs here
      const updateAuditLog: AuditLogData = {
        experimentId: experiment.id,
        experimentName: experiment.name,
        diff: diffString(oldExperimentClone, newExperimentClone),
      };

      await this.experimentAuditLogRepository.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED, updateAuditLog, user);
      return newExperiment;
    });
  }

  private async addExperimentInDB(experiment: Experiment, user: User): Promise<Experiment> {
    // create schedules to start experiment and end experiment
    this.scheduledJobService.updateExperimentSchedules(experiment);

    const createdExperiment = await getConnection().transaction(async transactionalEntityManager => {
      experiment.id = experiment.id || uuid();
      const { conditions, partitions, ...expDoc } = experiment;
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

      // creating partition docs
      const partitionDocsToSave =
        partitions &&
        partitions.length > 0 &&
        partitions.map(partition => {
          partition.id = `${partition.name}_${partition.point}`;
          partition.experiment = experimentDoc;
          return partition;
        });

      // saving conditions and saving partitions
      let conditionDocs: ExperimentCondition[];
      let partitionDocs: ExperimentPartition[];
      try {
        [conditionDocs, partitionDocs] = await Promise.all([
          this.experimentConditionRepository.insertConditions(conditionDocsToSave, transactionalEntityManager),
          this.experimentPartitionRepository.insertPartitions(partitionDocsToSave, transactionalEntityManager),
        ]);
      } catch (error) {
        throw new Error(`Error in creating conditions and partitions "addExperimentInDB" ${error}`);
      }

      const conditionDocToReturn = conditionDocs.map(conditionDoc => {
        const { experimentId, ...rest } = conditionDoc as any;
        return rest;
      });

      const partitionDocToReturn = partitionDocs.map(partitionDoc => {
        const { experimentId, ...rest } = partitionDoc as any;
        return rest;
      });

      return { ...experimentDoc, conditions: conditionDocToReturn as any, partitions: partitionDocToReturn as any };
    });

    // add auditLog here
    const createAuditLogData: AuditLogData = {
      experimentId: createdExperiment.id,
      experimentName: createdExperiment.name,
    };
    this.experimentAuditLogRepository.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED, createAuditLogData, user);

    return createdExperiment;
  }

  private postgresSearchString(type: string): string {
    const searchString: string[] = [];
    switch (type) {
      case SEARCH_KEY.NAME:
        searchString.push("coalesce(experiment.name::TEXT,'')");
        searchString.push("coalesce(partitions.name::TEXT,'')");
        break;
      case SEARCH_KEY.STATUS:
        searchString.push("coalesce(experiment.state::TEXT,'')");
        break;
      case SEARCH_KEY.TAG:
        searchString.push("coalesce(experiment.tags::TEXT,'')");
        break;
      default:
        searchString.push("coalesce(experiment.name::TEXT,'')");
        searchString.push("coalesce(partitions.name::TEXT,'')");
        searchString.push("coalesce(experiment.state::TEXT,'')");
        searchString.push("coalesce(experiment.tags::TEXT,'')");
        break;
    }
    const stringConcat = searchString.join(',');
    const searchStringConcatenated = `concat_ws(' ', ${stringConcat})`;
    return searchStringConcatenated;
  }
}
