import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import {
  Experiment,
  IExperimentSearchParams,
  EXPERIMENT_SEARCH_KEY,
  IExperimentSortParams,
} from '../models/Experiment';
import uuid from 'uuid/v4';
import { ExperimentConditionRepository } from '../repositories/ExperimentConditionRepository';
import { ExperimentPartitionRepository } from '../repositories/ExperimentPartitionRepository';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { ExperimentPartition, getExperimentPartitionID } from '../models/ExperimentPartition';
import { ScheduledJobService } from './ScheduledJobService';
import { getConnection, In } from 'typeorm';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { diffString } from 'json-diff';
import { EXPERIMENT_LOG_TYPE, EXPERIMENT_STATE, CONSISTENCY_RULE, ENROLLMENT_CODE, SERVER_ERROR } from 'upgrade_types';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { MonitoredExperimentPointRepository } from '../repositories/MonitoredExperimentPointRepository';
import { User } from '../models/User';
import { ASSIGNMENT_TYPE } from '../../types/index';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import { PreviewUserService } from './PreviewUserService';
import { AuditLogData } from 'upgrade_types/dist/Experiment/interfaces';
import { ExperimentInput } from '../../types/ExperimentInput';
import { Query } from '../models/Query';
import { MetricRepository } from '../repositories/MetricRepository';
import { QueryRepository } from '../repositories/QueryRepository';
import { env } from '../../env';
import { ErrorService } from './ErrorService';
import { StateTimeLogsRepository } from '../repositories/StateTimeLogsRepository';
// import { StateTimeLog } from '../models/StateTimeLogs';

@Service()
export class ExperimentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository() private experimentConditionRepository: ExperimentConditionRepository,
    @OrmRepository() private experimentPartitionRepository: ExperimentPartitionRepository,
    @OrmRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
    @OrmRepository() private individualExclusionRepository: IndividualExclusionRepository,
    @OrmRepository() private groupExclusionRepository: GroupExclusionRepository,
    @OrmRepository() private monitoredExperimentPointRepository: MonitoredExperimentPointRepository,
    @OrmRepository() private userRepository: ExperimentUserRepository,
    @OrmRepository() private metricRepository: MetricRepository,
    @OrmRepository() private queryRepository: QueryRepository,
    @OrmRepository() private stateTimeLogsRepository: StateTimeLogsRepository,
    public previewUserService: PreviewUserService,
    public scheduledJobService: ScheduledJobService,
    public errorService: ErrorService,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public async find(): Promise<Experiment[]> {
    this.log.info(`Find all experiments`);
    return this.experimentRepository.findAllExperiments();
  }

  public findAllName(): Promise<Array<Pick<Experiment, 'id' | 'name'>>> {
    this.log.info(`Find all names`);
    return this.experimentRepository.findAllName();
  }

  public async findPaginated(
    skip: number,
    take: number,
    searchParams?: IExperimentSearchParams,
    sortParams?: IExperimentSortParams
  ): Promise<Experiment[]> {
    this.log.info(`Find paginated experiments`);

    let queryBuilder = this.experimentRepository
      .createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.queries', 'queries')
      .leftJoinAndSelect('experiment.stateTimeLogs', 'stateTimeLogs')
      .leftJoinAndSelect('queries.metric', 'metric');
    if (searchParams) {
      const customSearchString = searchParams.string.split(' ').join(`:*&`);
      // add search query
      const postgresSearchString = this.postgresSearchString(searchParams.key);
      queryBuilder = queryBuilder
        .addSelect(`ts_rank_cd(to_tsvector('english',${postgresSearchString}), to_tsquery(:query))`, 'rank')
        .addOrderBy('rank', 'DESC')
        .setParameter('query', `${customSearchString}:*`);
    }
    if (sortParams) {
      queryBuilder = queryBuilder.addOrderBy(`experiment.${sortParams.key}`, sortParams.sortAs);
    }

    queryBuilder = queryBuilder.skip(skip).take(take);

    return queryBuilder.getMany();
  }

  public async findOne(id: string): Promise<Experiment | undefined> {
    this.log.info(`Find experiment by id => ${id}`);
    const experiment = await this.experimentRepository
      .createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.queries', 'queries')
      .leftJoinAndSelect('experiment.stateTimeLogs', 'stateTimeLogs')
      .leftJoinAndSelect('queries.metric', 'metric')
      .where({ id })
      .getOne();

    return experiment;
  }

  public getTotalCount(): Promise<number> {
    return this.experimentRepository.count();
  }

  public getContext(): string[] {
    return env.initialization.context;
  }

  public getExpPointsAndIds(): object {
    return {
      expPoints: env.initialization.expPoints,
      expIds: env.initialization.expIds
    };
  }

  public create(experiment: ExperimentInput, currentUser: User): Promise<Experiment> {
    this.log.info('Create a new experiment => ', experiment.toString());
    // TODO add entry in audit log of creating experiment
    return this.addExperimentInDB(experiment, currentUser);
  }

  public createMultipleExperiments(experiment: ExperimentInput[]): Promise<Experiment[]> {
    this.log.info('Generating test experiments => ', experiment.toString());
    return this.addBulkExperiments(experiment);
  }

  public async delete(experimentId: string, currentUser: User): Promise<Experiment | undefined> {
    this.log.info('Delete experiment => ', experimentId);

    return getConnection().transaction(async (transactionalEntityManager) => {
      const experiment = await this.findOne(experimentId);

      if (experiment) {
        // monitoredIds
        const monitoredIds = experiment.partitions.map((partition) => {
          return getExperimentPartitionID(partition.expPoint, partition.expId);
        });

        const promiseArray = [];
        // deleting data related to experiment
        promiseArray.push(
          this.monitoredExperimentPointRepository.deleteByExperimentId(monitoredIds, transactionalEntityManager)
        );
        promiseArray.push(this.experimentRepository.deleteById(experimentId, transactionalEntityManager));

        // adding entry in audit log
        const deleteAuditLogData = {
          experimentName: experiment.name,
        };
        promiseArray.push(
          this.experimentAuditLogRepository.saveRawJson(
            EXPERIMENT_LOG_TYPE.EXPERIMENT_DELETED,
            deleteAuditLogData,
            currentUser
          )
        );

        const promiseResult = await Promise.all(promiseArray);

        return promiseResult[1];
      }

      return undefined;
    });
  }

  public update(id: string, experiment: Experiment, currentUser: User): Promise<Experiment> {
    this.log.info('Update an experiment => ', experiment.toString());
    // TODO add entry in audit log of updating experiment
    return this.updateExperimentInDB(experiment as any, currentUser);
  }

  public async getExperimentalConditions(experimentId: string): Promise<ExperimentCondition[]> {
    const experiment: Experiment = await this.findOne(experimentId);
    return experiment.conditions;
  }

  public async getExperimentPartitions(experimentId: string): Promise<ExperimentPartition[]> {
    const experiment: Experiment = await this.findOne(experimentId);
    return experiment.partitions;
  }

  public async getAllExperimentPartitions(): Promise<Array<Pick<ExperimentPartition, 'expId' | 'expPoint'>>> {
    return this.experimentPartitionRepository.partitionPointAndName();
  }

  public async getAllUniqueIdentifiers(): Promise<string[]> {
    const conditionsUniqueIdentifier = this.experimentConditionRepository.getAllUniqueIdentifier();
    const partitionsUniqueIdentifier = this.experimentPartitionRepository.getAllUniqueIdentifier();
    const [conditionIds, partitionsIds] = await Promise.all([conditionsUniqueIdentifier, partitionsUniqueIdentifier]);
    return [...conditionIds, ...partitionsIds];
  }

  public async updateState(
    experimentId: string,
    state: EXPERIMENT_STATE,
    user: User,
    scheduleDate?: Date
  ): Promise<Experiment> {

    return getConnection().transaction(async (transactionalEntityManager) => {

      if (state === EXPERIMENT_STATE.ENROLLING || state === EXPERIMENT_STATE.PREVIEW) {
        await this.populateExclusionTable(experimentId, state);
      }

      const oldExperiment = await this.experimentRepository.findOne(
        { id: experimentId },
        { relations: ['stateTimeLogs'] }
      );
      let data: AuditLogData = {
        experimentId,
        experimentName: oldExperiment.name,
        previousState: oldExperiment.state,
        newState: state,
      };
      if (scheduleDate) {
        data = { ...data, startOn: scheduleDate };
      }
      // add experiment audit logs
      this.experimentAuditLogRepository.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_STATE_CHANGED, data, user);

      const updatedState = await this.experimentRepository.updateState(
        experimentId,
        state,
        scheduleDate,
        transactionalEntityManager
      );

      // updating experiment schedules here
      await this.updateExperimentSchedules(experimentId);

      // updating state time logs here
      const timeLogDate = new Date();

      const updatedStateTimeLog = await this.stateTimeLogsRepository.insertStateTimeLog(
        oldExperiment.state,
        state,
        timeLogDate,
        oldExperiment,
        transactionalEntityManager
      );

      return {
        ...oldExperiment,
        state: updatedState[0].state,
        stateTimeLogs: [...oldExperiment.stateTimeLogs, updatedStateTimeLog[0]]
      };
    });
  }

  public async importExperiment(experiment: ExperimentInput, user: User): Promise<any> {
    const duplicateExperiment = await this.experimentRepository.findOne(experiment.id);
    if (duplicateExperiment && experiment.id !== undefined) {
      throw new Error(JSON.stringify({ type: SERVER_ERROR.QUERY_FAILED, message: 'Duplicate experiment' }));
    }
    let experimentPartitions = experiment.partitions;

    // Remove the partitions which are already exist
    for (const partition of experimentPartitions) {
      const partitionExist = await this.experimentPartitionRepository.findOne(partition.id);
      if (partitionExist) {
        if (experimentPartitions.indexOf(partition) >= 0) {
          experimentPartitions.splice(experimentPartitions.indexOf(partition), 1);
        }
      }
    }

    if (experimentPartitions.length === 0) {
      throw new Error(JSON.stringify({ type: SERVER_ERROR.QUERY_FAILED, message: 'Duplicate partition' }));
    }

    // Generate new twoCharacterId if it is already exist for conditions
    let uniqueIdentifiers = await this.getAllUniqueIdentifiers();
    experiment.conditions = experiment.conditions.map((condition) => {
      let twoCharacterId = condition.twoCharacterId;
      if (uniqueIdentifiers.indexOf(twoCharacterId) !== -1) {
        twoCharacterId = this.getUniqueIdentifier(uniqueIdentifiers);
        condition.twoCharacterId = twoCharacterId;
      }
      uniqueIdentifiers = [...uniqueIdentifiers, twoCharacterId];
      return condition;
    });

    // Generate new twoCharacterId if it is already exist for partitions
    experimentPartitions = experimentPartitions.map((partition) => {
      let twoCharacterId = partition.twoCharacterId;
      if (uniqueIdentifiers.indexOf(twoCharacterId) !== -1) {
        twoCharacterId = this.getUniqueIdentifier(uniqueIdentifiers);
        partition.twoCharacterId = twoCharacterId;
      }
      uniqueIdentifiers = [...uniqueIdentifiers, twoCharacterId];
      return partition;
    });

    experiment.partitions = experimentPartitions;
    experiment.endOn = null;
    experiment.createdAt = new Date();
    experiment.state = EXPERIMENT_STATE.INACTIVE;
    return this.create(experiment, user);
  }

  private async updateExperimentSchedules(experimentId: string): Promise<void> {
    const experiment = await this.experimentRepository.findByIds([experimentId]);
    if (experiment.length > 0 && this.scheduledJobService) {
      await this.scheduledJobService.updateExperimentSchedules(experiment[0]);
    }
  }

  private async populateExclusionTable(experimentId: string, state: EXPERIMENT_STATE): Promise<void> {
    // query all sub-experiment
    const experiment: Experiment = await this.experimentRepository.findOne({
      where: { id: experimentId },
      relations: ['partitions'],
    });

    const { consistencyRule, group } = experiment;
    const subExperiments = experiment.partitions.map(({ id }) => {
      return id;
    });

    // get all preview usersData
    const previewUsers = await this.previewUserService.find();

    // query all monitored experiment point for this experiment Id
    let monitoredExperimentPoints: MonitoredExperimentPoint[] = [];
    if (state === EXPERIMENT_STATE.ENROLLING) {
      monitoredExperimentPoints = await this.monitoredExperimentPointRepository.find({
        relations: ['user'],
        where: { experimentId: In(subExperiments) },
      });
    } else if (state === EXPERIMENT_STATE.PREVIEW) {
      const previewUsersIds = previewUsers.map((user) => user.id);

      if (previewUsersIds.length > 0) {
        const monitoredPointsToSearch = previewUsersIds.reduce((acc, userId) => {
          const monitoredIds = subExperiments.map((id) => {
            return `${id}_${userId}`;
          });
          return [...acc, ...monitoredIds];
        }, []);
        monitoredExperimentPoints = await this.monitoredExperimentPointRepository.findByIds(monitoredPointsToSearch, {
          relations: ['user'],
        });
      }
    }

    const uniqueUserIds = new Set(
      monitoredExperimentPoints.map((monitoredPoint: MonitoredExperimentPoint) => monitoredPoint.user.id)
    );

    // end the loop if no users
    if (uniqueUserIds.size === 0) {
      return;
    }

    // update document of monitoredExperimentPoints to ENROLLMENT CODE STUDENT EXCLUDED
    if (experiment.consistencyRule !== CONSISTENCY_RULE.EXPERIMENT) {
      const monitoredExperimentIds = monitoredExperimentPoints.map((monitoredPoint) => monitoredPoint.id);

      await this.monitoredExperimentPointRepository.updateEnrollmentCode(
        ENROLLMENT_CODE.STUDENT_EXCLUDED,
        monitoredExperimentIds
      );
    }

    const userDetails = await this.userRepository.findByIds([...uniqueUserIds]);
    // populate Individual and Group Exclusion Table
    if (consistencyRule === CONSISTENCY_RULE.GROUP) {
      // query all user information
      const groupsToExclude = new Set(
        userDetails.map((userDetail) => {
          return userDetail.workingGroup[group];
        })
      );

      // group exclusion documents
      const groupExclusionDocs = [...groupsToExclude].map((groupId) => {
        return {
          experiment,
          groupId,
        };
      });

      await this.groupExclusionRepository.saveRawJson(groupExclusionDocs);
    }

    if (consistencyRule === CONSISTENCY_RULE.INDIVIDUAL || consistencyRule === CONSISTENCY_RULE.GROUP) {
      // individual exclusion document
      const individualExclusionDocs = [...uniqueUserIds].map((userId) => {
        const user = userDetails.find((userDetail) => userDetail.id === userId);
        const isPreviewUser = previewUsers.find((previewUser) => previewUser.id === userId);
        return {
          user,
          experiment,
          assignmentType: isPreviewUser ? ASSIGNMENT_TYPE.MANUAL : ASSIGNMENT_TYPE.ALGORITHMIC,
        };
      });
      await this.individualExclusionRepository.saveRawJson(individualExclusionDocs);
    }
  }

  private async updateExperimentInDB(experiment: ExperimentInput, user: User): Promise<Experiment> {
    // get old experiment document
    const oldExperiment = await this.findOne(experiment.id);
    const oldConditions = oldExperiment.conditions;
    const oldPartitions = oldExperiment.partitions;
    const oldQueries = oldExperiment.queries;

    console.log(' old experiment data ', oldExperiment);
    // create schedules to start experiment and end experiment
    if (this.scheduledJobService) {
      this.scheduledJobService.updateExperimentSchedules(experiment as any);
    }

    return getConnection()
      .transaction(async (transactionalEntityManager) => {
        experiment.context = experiment.context.map((context) => context.toLocaleLowerCase());
        let uniqueIdentifiers = await this.getAllUniqueIdentifiers();
        if (experiment.conditions.length) {
          const response = this.setConditionOrPartitionIdentifiers(experiment.conditions, uniqueIdentifiers);
          experiment.conditions = response[0];
          uniqueIdentifiers = response[1];
        }
        if (experiment.partitions.length) {
          const response = this.setConditionOrPartitionIdentifiers(experiment.partitions, uniqueIdentifiers);
          experiment.partitions = response[0];
          uniqueIdentifiers = response[1];
        }
        const { conditions, partitions, queries, versionNumber, createdAt, updatedAt, ...expDoc } = experiment;

        let experimentDoc: Experiment;
        try {
          experimentDoc = await transactionalEntityManager.getRepository(Experiment).save(expDoc);
          // here
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
            partitions.map((partition) => {
              // tslint:disable-next-line:no-shadowed-variable
              const { createdAt, updatedAt, versionNumber, ...rest } = partition;
              const joinedForId = getExperimentPartitionID(rest.expPoint, rest.expId);
              if (rest.id && rest.id === joinedForId) {
                rest.id = rest.id;
              } else {
                rest.id = getExperimentPartitionID(rest.expPoint, rest.expId);
              }
              rest.experiment = experimentDoc;
              return rest;
            })) ||
          [];

        // creating queries docs
        const promiseArray = [];
        let queriesDocToSave =
          (queries &&
            queries.length > 0 &&
            queries.map((query: any) => {
              promiseArray.push(this.metricRepository.findOne(query.metric.key));
              // tslint:disable-next-line:no-shadowed-variable
              const { createdAt, updatedAt, versionNumber, metric, ...rest } = query;
              rest.experiment = experimentDoc;
              rest.id = rest.id || uuid();
              return rest;
            })) ||
          [];

        if (promiseArray.length) {
          const metricsDocs = await Promise.all([...promiseArray]);
          queriesDocToSave = queriesDocToSave.map((queryDoc, index) => {
            queryDoc.metric = metricsDocs[index];
            return queryDoc;
          });
        }

        // delete conditions which don't exist in new experiment document
        const toDeleteConditions = [];
        oldConditions.forEach(({ id }) => {
          if (
            !conditionDocToSave.find((doc) => {
              return doc.id === id;
            })
          ) {
            toDeleteConditions.push(this.experimentConditionRepository.deleteCondition(id, transactionalEntityManager));
          }
        });

        // delete partitions which don't exist in new experiment document
        const toDeletePartitions = [];
        oldPartitions.forEach(({ id, expPoint, expId }) => {
          if (
            !partitionDocToSave.find((doc) => {
              return doc.id === id && doc.expPoint === expPoint && doc.expId === expId;
            })
          ) {
            toDeletePartitions.push(this.experimentPartitionRepository.deletePartition(id, transactionalEntityManager));
          }
        });

        // delete queries which don't exist in new experiment document
        const toDeleteQueries = [];
        const toDeleteQueriesDoc = [];
        oldQueries.forEach((queryDoc) => {
          if (
            !queriesDocToSave.find((doc) => {
              return doc.id === queryDoc.id;
            })
          ) {
            toDeleteQueries.push(this.queryRepository.deleteQuery(queryDoc.id, transactionalEntityManager));
            toDeleteQueriesDoc.push(queryDoc);
          }
        });

        // delete old partitions, conditions and queries
        await Promise.all([...toDeleteConditions, ...toDeletePartitions, ...toDeleteQueries]);

        // saving conditions, saving partitions and saving queries
        let conditionDocs: ExperimentCondition[];
        let partitionDocs: ExperimentPartition[];
        let queryDocs: Query[];
        try {
          [conditionDocs, partitionDocs, queryDocs] = await Promise.all([
            Promise.all(
              conditionDocToSave.map(async (conditionDoc) => {
                return this.experimentConditionRepository.upsertExperimentCondition(
                  conditionDoc,
                  transactionalEntityManager
                );
              })
            ) as any,
            Promise.all(
              partitionDocToSave.map(async (partitionDoc) => {
                return this.experimentPartitionRepository.upsertExperimentPartition(
                  partitionDoc,
                  transactionalEntityManager
                );
              })
            ) as any,
            Promise.all(
              queriesDocToSave.map(async (queryDoc) => {
                return this.queryRepository.upsertQuery(queryDoc, transactionalEntityManager);
              })
            ) as any,
          ]);
        } catch (error) {
          throw new Error(`Error in creating conditions, partitions, queries "updateExperimentInDB" ${error}`);
        }

        const conditionDocToReturn = conditionDocs.map((conditionDoc) => {
          return { ...conditionDoc, experiment: conditionDoc.experiment };
        });

        const partitionDocToReturn = partitionDocs.map((partitionDoc) => {
          return { ...partitionDoc, experiment: partitionDoc.experiment };
        });

        const queryDocToReturn =
          !!queryDocs &&
          queryDocs.map((queryDoc, index) => {
            const { metricKey, ...rest } = queryDoc as any;
            return { ...rest, metric: queriesDocToSave[index].metric };
          });

        const newExperiment = {
          ...experimentDoc,
          conditions: conditionDocToReturn as any,
          partitions: partitionDocToReturn as any,
          queries: (queryDocToReturn as any) || [],
        };

        // removing unwanted params for diff
        const oldExperimentClone: Experiment = JSON.parse(JSON.stringify(oldExperiment));
        delete oldExperimentClone.versionNumber;
        delete oldExperimentClone.updatedAt;
        delete oldExperimentClone.createdAt;
        delete oldExperimentClone.queries; // TODO: Remove comment if we want to consider queries in diff

        // Sort based on createdAt to make correct diff
        oldExperimentClone.partitions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        oldExperimentClone.conditions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        oldExperimentClone.partitions.map((partition) => {
          delete partition.versionNumber;
          delete partition.updatedAt;
          delete partition.createdAt;
          delete (partition as any).experimentId;
        });
        oldExperimentClone.conditions.map((condition) => {
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
        delete newExperimentClone.queries;

        // Sort based on createdAt to make correct diff
        newExperimentClone.partitions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        newExperimentClone.conditions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        newExperimentClone.partitions.map((partition) => {
          delete partition.versionNumber;
          delete partition.updatedAt;
          delete partition.createdAt;
          delete (partition as any).experimentId;
        });
        newExperimentClone.conditions.map((condition) => {
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

        await this.experimentAuditLogRepository.saveRawJson(
          EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED,
          updateAuditLog,
          user
        );
        return { newExperiment, toDeleteQueriesDoc };
      })
      .then(async ({ newExperiment, toDeleteQueriesDoc }) => {
        // check if logs need to be deleted for metric query
        // if (toDeleteQueriesDoc.length > 0) {
        //   await this.cleanLogsForQuery(toDeleteQueriesDoc);
        // }
        return newExperiment;
      });
  }

  // private async cleanLogsForQuery(query: Query[]): Promise<void> {
  //   const result = await Promise.all(
  //     query.map(({ metric: { key } }) => {
  //       return this.queryRepository.checkIfQueryExists(key);
  //     })
  //   );

  //   for (let i = 0; i < result.length; i++) {
  //     const value = result[i];
  //     if (!value) {
  //       await this.logRepository.deleteByMetricId(query[i].metric.key);
  //     }
  //   }
  // }

  // Used to generate twoCharacterId for condition and partition
  private getUniqueIdentifier(uniqueIdentifiers: string[]): string {
    let identifier;
    while (true) {
      identifier = Math.random().toString(36).substring(2, 4).toUpperCase();
      if (uniqueIdentifiers.indexOf(identifier) === -1) {
        break;
      }
    }
    return identifier;
  }

  private setConditionOrPartitionIdentifiers(
    data: ExperimentCondition[] | ExperimentPartition[],
    uniqueIdentifiers: string[]
  ): any[] {
    const updatedData = (data as any).map((conditionOrPartition) => {
      if (!conditionOrPartition.twoCharacterId) {
        const twoCharacterId = this.getUniqueIdentifier(uniqueIdentifiers);
        uniqueIdentifiers = [...uniqueIdentifiers, twoCharacterId];
        return {
          ...conditionOrPartition,
          twoCharacterId,
        };
      }
      return conditionOrPartition;
    });
    return [updatedData, uniqueIdentifiers];
  }

  private async addExperimentInDB(experiment: ExperimentInput, user: User): Promise<Experiment> {
    const createdExperiment = await getConnection().transaction(async (transactionalEntityManager) => {
      experiment.id = experiment.id || uuid();
      experiment.context = experiment.context.map((context) => context.toLocaleLowerCase());
      let uniqueIdentifiers = await this.getAllUniqueIdentifiers();
      if (experiment.conditions.length) {
        const response = this.setConditionOrPartitionIdentifiers(experiment.conditions, uniqueIdentifiers);
        experiment.conditions = response[0];
        uniqueIdentifiers = response[1];
      }
      if (experiment.partitions.length) {
        const response = this.setConditionOrPartitionIdentifiers(experiment.partitions, uniqueIdentifiers);
        experiment.partitions = response[0];
        uniqueIdentifiers = response[1];
      }
      const { conditions, partitions, ...expDoc } = experiment;

      // saving experiment docs
      let experimentDoc: Experiment;
      try {
        experimentDoc = await transactionalEntityManager.getRepository(Experiment).save(expDoc);
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
        partitions.map((partition) => {
          partition.id = getExperimentPartitionID(partition.expPoint, partition.expId);
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
      const conditionDocToReturn = conditionDocs.map((conditionDoc) => {
        const { experimentId, ...restDoc } = conditionDoc as any;
        return restDoc;
      });
      const partitionDocToReturn = partitionDocs.map((partitionDoc) => {
        const { experimentId, ...restDoc } = partitionDoc as any;
        return restDoc;
      });
      return { ...experimentDoc, conditions: conditionDocToReturn as any, partitions: partitionDocToReturn as any };
    });
    // create schedules to start experiment and end experiment
    if (this.scheduledJobService) {
      await this.scheduledJobService.updateExperimentSchedules(createdExperiment);
    }

    // add auditLog here
    const createAuditLogData: AuditLogData = {
      experimentId: createdExperiment.id,
      experimentName: createdExperiment.name,
    };
    await this.experimentAuditLogRepository.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED, createAuditLogData, user);
    return createdExperiment;
  }

  private postgresSearchString(type: string): string {
    const searchString: string[] = [];
    switch (type) {
      case EXPERIMENT_SEARCH_KEY.NAME:
        searchString.push("coalesce(experiment.name::TEXT,'')");
        searchString.push("coalesce(partitions.id::TEXT,'')");
        break;
      case EXPERIMENT_SEARCH_KEY.STATUS:
        searchString.push("coalesce(experiment.state::TEXT,'')");
        break;
      case EXPERIMENT_SEARCH_KEY.TAG:
        searchString.push("coalesce(experiment.tags::TEXT,'')");
        break;
      case EXPERIMENT_SEARCH_KEY.CONTEXT:
        searchString.push("coalesce(experiment.context::TEXT,'')");
        break;
      default:
        searchString.push("coalesce(experiment.name::TEXT,'')");
        searchString.push("coalesce(partitions.id::TEXT,'')");
        searchString.push("coalesce(experiment.state::TEXT,'')");
        searchString.push("coalesce(experiment.tags::TEXT,'')");
        searchString.push("coalesce(experiment.context::TEXT,'')");
        break;
    }
    const stringConcat = searchString.join(',');
    const searchStringConcatenated = `concat_ws(' ', ${stringConcat})`;
    return searchStringConcatenated;
  }

  private arrayGroupBy(docsArray: any, key: string): any {
    return docsArray.reduce((result, currentValue) => {
      (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
      return result;
    }, {});
  }

  private async addBulkExperiments(experiments: ExperimentInput[]): Promise<Experiment[]> {
    // Create data to be entered in experiments table
    const expDocs = experiments.map((experiment) => {
      experiment.id = experiment.id || uuid();
      experiment.context = experiment.context.map((context) => context.toLocaleLowerCase());

      // adding a experiment id to experiment conditions
      experiment.conditions =
        experiment.conditions &&
        experiment.conditions.length > 0 &&
        experiment.conditions.map((condition: ExperimentCondition) => {
          condition.id = condition.id || uuid();
          condition.experiment = experiment as any;
          return condition;
        });

      // adding a experiment id to experiment partitions
      experiment.partitions =
        experiment.partitions &&
        experiment.partitions.length > 0 &&
        experiment.partitions.map((partition) => {
          partition.id = getExperimentPartitionID(partition.expPoint, partition.expId);
          partition.experiment = experiment as any;
          return partition;
        });

      return experiment;
    });

    // Fetch all the conditions from array of experiments and flatten it to get new conditions
    const allConditionDocs = expDocs.map((experiment) => {
      return experiment.conditions;
    });
    let conditionDocsToSave = [].concat(...allConditionDocs);

    // Fetch all the partitions from array of experiments and flatten it to get new partitions
    const allPartitionDocs = expDocs.map((experiment) => {
      return experiment.partitions;
    });
    let partitionDocsToSave = [].concat(...allPartitionDocs);

    // add unique twoCharacterIds to experiment conditions and partitions
    let uniqueIdentifiers = await this.getAllUniqueIdentifiers();
    if (conditionDocsToSave.length) {
      const response = this.setConditionOrPartitionIdentifiers(conditionDocsToSave, uniqueIdentifiers);
      conditionDocsToSave = response[0];
      uniqueIdentifiers = response[1];
    }
    if (partitionDocsToSave.length) {
      const response = this.setConditionOrPartitionIdentifiers(partitionDocsToSave, uniqueIdentifiers);
      partitionDocsToSave = response[0];
      uniqueIdentifiers = response[1];
    }

    // create a transaction and add experiments, conditions & partitions
    const createdExperiment = await getConnection().transaction(async (transactionalEntityManager) => {
      let experimentDoc: Experiment[];
      try {
        // Saving experiment
        experimentDoc = await this.experimentRepository.insertBatchExps(expDocs as any, transactionalEntityManager);
      } catch (error) {
        throw new Error(`Error in creating experiment document "addBulkExperiments" ${error}`);
      }
      // saving conditions and saving partitions
      let conditionDocs: ExperimentCondition[];
      let partitionDocs: ExperimentPartition[];
      try {
        [conditionDocs, partitionDocs] = await Promise.all([
          this.experimentConditionRepository.insertConditions(conditionDocsToSave, transactionalEntityManager),
          this.experimentPartitionRepository.insertPartitions(partitionDocsToSave, transactionalEntityManager),
        ]);

        const conditionDocToReturn = this.arrayGroupBy(conditionDocs, 'experimentId');
        const partitionDocToReturn = this.arrayGroupBy(partitionDocs, 'experimentId');

        const experimentsToReturn = experimentDoc.map((experiment) => {
          const conditions = conditionDocToReturn[experiment.id].map((conditionDoc) => {
            const { experimentId, ...rest } = conditionDoc as any;
            return rest;
          });
          const partitions = partitionDocToReturn[experiment.id].map((partitionDoc) => {
            const { experimentId, ...rest } = partitionDoc as any;
            return rest;
          });
          return { ...experiment, conditions, partitions };
        });
        return experimentsToReturn;
      } catch (error) {
        throw new Error(`Error in creating conditions and partitions "addBulkExperiments" ${error}`);
      }
    });

    return createdExperiment;
  }
}
