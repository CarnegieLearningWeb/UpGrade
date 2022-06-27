import { GroupExclusion } from './../models/GroupExclusion';
import { ErrorWithType } from './../errors/ErrorWithType';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import {
  Experiment,
  IExperimentSearchParams,
  EXPERIMENT_SEARCH_KEY,
  IExperimentSortParams,
} from '../models/Experiment';
import uuid from 'uuid/v4';
import { ExperimentConditionRepository } from '../repositories/ExperimentConditionRepository';
import { DecisionPointRepository } from '../repositories/DecisionPointRepository';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { DecisionPoint, getExperimentPartitionID } from '../models/DecisionPoint';
import { ScheduledJobService } from './ScheduledJobService';
import { getConnection, In, EntityManager } from 'typeorm';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { diffString } from 'json-diff';
import { EXPERIMENT_LOG_TYPE, EXPERIMENT_STATE, CONSISTENCY_RULE, SERVER_ERROR, EXCLUSION_CODE } from 'upgrade_types';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { MonitoredDecisionPointRepository } from '../repositories/MonitoredDecisionPointRepository';
import { User } from '../models/User';
import { ASSIGNMENT_TYPE } from '../../types/index';
import { MonitoredDecisionPoint } from '../models/MonitoredDecisionPoint';
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import { PreviewUserService } from './PreviewUserService';
import { AuditLogData } from 'upgrade_types';
import { ExperimentInput } from '../../types/ExperimentInput';
import { Query } from '../models/Query';
import { MetricRepository } from '../repositories/MetricRepository';
import { QueryRepository } from '../repositories/QueryRepository';
import { env } from '../../env';
import { ErrorService } from './ErrorService';
import { StateTimeLog } from '../models/StateTimeLogs';
import { BadRequestError } from 'routing-controllers';
import { StateTimeLogsRepository } from '../repositories/StateTimeLogsRepository';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { SegmentInputValidator } from '../controllers/validators/SegmentInputValidator';
import { Segment } from '../models/Segment';
import { SegmentService } from './SegmentService';
import { ExperimentSegmentInclusion } from '../models/ExperimentSegmentInclusion';
import { ExperimentSegmentInclusionRepository } from '../repositories/ExperimentSegmentInclusionRepository';
import { ExperimentSegmentExclusion } from '../models/ExperimentSegmentExclusion';
import { ExperimentSegmentExclusionRepository } from '../repositories/ExperimentSegmentExclusionRepository';

@Service()
export class ExperimentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository() private experimentConditionRepository: ExperimentConditionRepository,
    @OrmRepository() private decisionPointRepository: DecisionPointRepository,
    @OrmRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
    @OrmRepository() private individualExclusionRepository: IndividualExclusionRepository,
    @OrmRepository() private groupExclusionRepository: GroupExclusionRepository,
    @OrmRepository() private monitoredDecisionPointRepository: MonitoredDecisionPointRepository,
    @OrmRepository() private userRepository: ExperimentUserRepository,
    @OrmRepository() private metricRepository: MetricRepository,
    @OrmRepository() private queryRepository: QueryRepository,
    @OrmRepository() private stateTimeLogsRepository: StateTimeLogsRepository,
    @OrmRepository() private experimentSegmentInclusionRepository: ExperimentSegmentInclusionRepository,
    @OrmRepository() private experimentSegmentExclusionRepository: ExperimentSegmentExclusionRepository,
    public previewUserService: PreviewUserService,
    public segmentService: SegmentService,
    public scheduledJobService: ScheduledJobService,
    public errorService: ErrorService
  ) {}

  public async find(logger?: UpgradeLogger): Promise<Experiment[]> {
    if (logger) {
      logger.info({ message: `Find all experiments` });
    }
    return this.experimentRepository.findAllExperiments();
  }

  public findAllName(logger: UpgradeLogger): Promise<Array<Pick<Experiment, 'id' | 'name'>>> {
    logger.info({ message: `Find all experiment names` });
    return this.experimentRepository.findAllName();
  }

  public async findPaginated(
    skip: number,
    take: number,
    logger: UpgradeLogger,
    searchParams?: IExperimentSearchParams,
    sortParams?: IExperimentSortParams
  ): Promise<Experiment[]> {
    logger.info({ message: `Find paginated experiments` });

    let queryBuilder = this.experimentRepository
      .createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.queries', 'queries')
      .leftJoinAndSelect('experiment.stateTimeLogs', 'stateTimeLogs')
      .leftJoinAndSelect('experiment.experimentSegmentInclusion','experimentSegmentInclusion')
      .leftJoinAndSelect('experimentSegmentInclusion.segment','segmentInclusion')
      .leftJoinAndSelect('segmentInclusion.individualForSegment','individualForSegment')
      .leftJoinAndSelect('segmentInclusion.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment')
      .leftJoinAndSelect('experiment.experimentSegmentExclusion', 'experimentSegmentExclusion')
      .leftJoinAndSelect('experimentSegmentExclusion.segment', 'segmentExclusion')
      .leftJoinAndSelect('segmentExclusion.individualForSegment', 'individualForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.groupForSegment', 'groupForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion')
      .leftJoinAndSelect('queries.metric', 'metric')
      .addOrderBy('conditions.order', 'ASC')
      .addOrderBy('partitions.order', 'ASC');
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

  public async findOne(id: string, logger?: UpgradeLogger): Promise<Experiment | undefined> {
    if (logger) {
      logger.info({ message: `Find experiment by id => ${id}` });
    }
    const experiment = await this.experimentRepository
      .createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.queries', 'queries')
      .leftJoinAndSelect('experiment.stateTimeLogs', 'stateTimeLogs')
      .leftJoinAndSelect('experiment.experimentSegmentInclusion','experimentSegmentInclusion')
      .leftJoinAndSelect('experimentSegmentInclusion.segment','segmentInclusion')
      .leftJoinAndSelect('segmentInclusion.individualForSegment','individualForSegment')
      .leftJoinAndSelect('segmentInclusion.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment')
      .leftJoinAndSelect('experiment.experimentSegmentExclusion', 'experimentSegmentExclusion')
      .leftJoinAndSelect('experimentSegmentExclusion.segment', 'segmentExclusion')
      .leftJoinAndSelect('segmentExclusion.individualForSegment', 'individualForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.groupForSegment', 'groupForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion')
      .leftJoinAndSelect('queries.metric', 'metric')
      .where({ id })
      .getOne();

    return experiment;
  }

  public getTotalCount(): Promise<number> {
    return this.experimentRepository.count();
  }

  public getContextMetaData(logger: UpgradeLogger): object {
    logger.info({ message: `Get context metadata` });
    return {
      contextMetadata: env.initialization.contextMetadata,
    };
  }

  public create(experiment: ExperimentInput, currentUser: User, logger: UpgradeLogger): Promise<Experiment> {
    logger.info({ message: 'Create a new experiment =>', details: experiment });

    // order for condition
    experiment.conditions.forEach((condition, index) => {
      const newCondition = { ...condition, order: index + 1 };
      experiment.conditions[index] = newCondition;
    });

    // order for partition
    experiment.partitions.forEach((partition, index) => {
      const newPartition = { ...partition, order: index + 1 };
      experiment.partitions[index] = newPartition;
    });
    experiment.backendVersion = env.app.version;
    return this.addExperimentInDB(experiment, currentUser, logger);
  }

  public createMultipleExperiments(experiment: ExperimentInput[], logger: UpgradeLogger): Promise<Experiment[]> {
    logger.info({ message: `Generating test experiments`, details: experiment });
    return this.addBulkExperiments(experiment, logger);
  }

  public async delete(
    experimentId: string,
    currentUser: User,
    logger?: UpgradeLogger
  ): Promise<Experiment | undefined> {
    if (logger) {
      logger.info({ message: `Delete experiment =>  ${experimentId}` });
    }
    return getConnection().transaction(async (transactionalEntityManager) => {
      const experiment = await this.findOne(experimentId, logger);

      if (experiment) {
        const deletedExperiment = await this.experimentRepository.deleteById(experimentId, transactionalEntityManager);

        // adding entry in audit log
        const deleteAuditLogData = {
          experimentName: experiment.name,
        };

        // Add log for experiment deleted
        this.experimentAuditLogRepository.saveRawJson(
          EXPERIMENT_LOG_TYPE.EXPERIMENT_DELETED,
          deleteAuditLogData,
          currentUser
        );

        try {
          await transactionalEntityManager.getRepository(Segment).delete(experiment.experimentSegmentInclusion.segment.id)
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = 'Error in deleting Include Segment fron DB';
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }

        try {
          await transactionalEntityManager.getRepository(Segment).delete(experiment.experimentSegmentExclusion.segment.id)
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = 'Error in deleting Exclude Segment fron DB';
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }

        return deletedExperiment;
      }

      return undefined;
    });
  }

  public update(experiment: Experiment, currentUser: User, logger: UpgradeLogger): Promise<Experiment> {
    if (logger) {
      logger.info({ message: `Update the experiment`, details: experiment });
    }
    return this.updateExperimentInDB(experiment as any, currentUser, logger);
  }

  public async getExperimentalConditions(experimentId: string, logger: UpgradeLogger): Promise<ExperimentCondition[]> {
    logger.info({ message: `getExperimentalConditions experiment => ${experimentId}` });
    const experiment: Experiment = await this.findOne(experimentId, logger);
    return experiment.conditions;
  }

  public async getExperimentPartitions(experimentId: string, logger: UpgradeLogger): Promise<DecisionPoint[]> {
    logger.info({ message: `getExperimentPartitions experiment => ${experimentId}` });
    const experiment: Experiment = await this.findOne(experimentId, logger);
    return experiment.partitions;
  }

  public async getAllExperimentPartitions(
    logger: UpgradeLogger
  ): Promise<Array<Pick<DecisionPoint, 'site' | 'target'>>> {
    logger.info({ message: 'getAllExperimentPartitions experiment' });
    return this.decisionPointRepository.partitionPointAndName();
  }

  public async getAllUniqueIdentifiers(logger: UpgradeLogger): Promise<string[]> {
    logger.info({ message: 'getAllUniqueIdentifiers' });
    const conditionsUniqueIdentifier = this.experimentConditionRepository.getAllUniqueIdentifier();
    const partitionsUniqueIdentifier = this.decisionPointRepository.getAllUniqueIdentifier();
    const [conditionIds, partitionsIds] = await Promise.all([conditionsUniqueIdentifier, partitionsUniqueIdentifier]);
    return [...conditionIds, ...partitionsIds];
  }

  public async updateState(
    experimentId: string,
    state: EXPERIMENT_STATE,
    user: User,
    logger: UpgradeLogger,
    scheduleDate?: Date,
    entityManager?: EntityManager
  ): Promise<Experiment> {
    const oldExperiment = await this.experimentRepository.findOne(
      { id: experimentId },
      { relations: ['stateTimeLogs'] }
    );

    if (
      (state === EXPERIMENT_STATE.ENROLLING || state === EXPERIMENT_STATE.PREVIEW) &&
      oldExperiment.state !== EXPERIMENT_STATE.ENROLLMENT_COMPLETE
    ) {
      await this.populateExclusionTable(experimentId, state, logger);
    }

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
    await this.experimentAuditLogRepository.saveRawJson(
      EXPERIMENT_LOG_TYPE.EXPERIMENT_STATE_CHANGED,
      data,
      user,
      entityManager
    );

    const timeLogDate = new Date();

    const stateTimeLogDoc = new StateTimeLog();
    stateTimeLogDoc.id = uuid();
    stateTimeLogDoc.fromState = oldExperiment.state;
    stateTimeLogDoc.toState = state;
    stateTimeLogDoc.timeLog = timeLogDate;
    stateTimeLogDoc.experiment = oldExperiment;

    // updating the experiment and stateTimeLog
    const stateTimeLogRepo = entityManager ? entityManager.getRepository(StateTimeLog) : this.stateTimeLogsRepository;
    logger.info({ message: `stateTimeLogDoc =>`, details: stateTimeLogDoc });
    const [updatedState, updatedStateTimeLog] = await Promise.all([
      this.experimentRepository.updateState(experimentId, state, scheduleDate, entityManager),
      stateTimeLogRepo.save(stateTimeLogDoc),
    ]);

    // updating experiment schedules
    await this.updateExperimentSchedules(experimentId, logger, entityManager);

    return {
      ...oldExperiment,
      state: updatedState[0].state,
      stateTimeLogs: [...oldExperiment.stateTimeLogs, updatedStateTimeLog],
    };
  }

  public async importExperiment(experiment: ExperimentInput, user: User, logger: UpgradeLogger): Promise<any> {
    const duplicateExperiment = await this.experimentRepository.findOne(experiment.id);
    if (duplicateExperiment && experiment.id !== undefined) {
      const error = new Error('Duplicate experiment');
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      logger.error(error);
      throw error;
    }
    let experimentPartitions = experiment.partitions;

    // Remove the partitions which already exist
    for (const partition of experimentPartitions) {
      const partitionExist = await this.decisionPointRepository.findOne(partition.id);
      if (partitionExist) {
        if (experimentPartitions.indexOf(partition) >= 0) {
          experimentPartitions.splice(experimentPartitions.indexOf(partition), 1);
        }
      }
    }

    if (experimentPartitions.length === 0) {
      const error = new Error('Duplicate partition');
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      logger.error(error);
      throw error;
    }

    // Generate new twoCharacterId if it is already exist for conditions
    let uniqueIdentifiers = await this.getAllUniqueIdentifiers(logger);
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
        logger.info({ message: `Generate new twoCharacterId for partition =>`, details: twoCharacterId });
        partition.twoCharacterId = twoCharacterId;
      }
      uniqueIdentifiers = [...uniqueIdentifiers, twoCharacterId];
      return partition;
    });

    experiment.partitions = experimentPartitions;
    experiment.endOn = null;
    experiment.createdAt = new Date();
    experiment.state = EXPERIMENT_STATE.INACTIVE;
    experiment.stateTimeLogs = [];
    return this.create(experiment, user, logger);
  }

  public async exportExperiment(experimentId: string, user: User, logger: UpgradeLogger): Promise<Experiment> {
    logger.info({ message: `Inside export Experiment JSON ${experimentId}` });
    const experimentDetails = await this.experimentRepository.findOne({
      where: { id: experimentId },
      relations: ['partitions', 'conditions', 'stateTimeLogs', 'queries', 'queries.metric'],
    });
    experimentDetails.backendVersion = env.app.version;
    this.experimentAuditLogRepository.saveRawJson(
      EXPERIMENT_LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED,
      { experimentName: experimentDetails.name },
      user
    );
    return experimentDetails;
  }

  private async updateExperimentSchedules(
    experimentId: string,
    logger: UpgradeLogger,
    entityManager?: EntityManager
  ): Promise<void> {
    const experimentRepo = entityManager ? entityManager.getRepository(Experiment) : this.experimentRepository;
    logger.info({ message: `Updating experiment schedules for experiment ${experimentId}` });
    const experiment = await experimentRepo.findByIds([experimentId]);
    if (experiment.length > 0 && this.scheduledJobService) {
      await this.scheduledJobService.updateExperimentSchedules(experiment[0], logger, entityManager);
    }
  }

  private async populateExclusionTable(
    experimentId: string,
    state: EXPERIMENT_STATE,
    logger: UpgradeLogger
  ): Promise<void> {
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
    const previewUsers = await this.previewUserService.find(logger);

    // query all monitored experiment point for this experiment Id
    let monitoredDecisionPoints: MonitoredDecisionPoint[] = [];
    if (state === EXPERIMENT_STATE.ENROLLING) {
      monitoredDecisionPoints = await this.monitoredDecisionPointRepository.find({
        relations: ['user'],
        where: { decisionPoint: In(subExperiments) },
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
        monitoredDecisionPoints = await this.monitoredDecisionPointRepository.findByIds(monitoredPointsToSearch, {
          relations: ['user'],
        });
      }
    }

    const uniqueUserIds = new Set(
      monitoredDecisionPoints.map((monitoredPoint: MonitoredDecisionPoint) => monitoredPoint.user.id)
    );
    logger.info({
      message: `Found ${monitoredDecisionPoints.length} monitored experiment points`,
      details: monitoredDecisionPoints,
    });

    // end the loop if no users
    if (uniqueUserIds.size === 0) {
      return;
    }

    const userDetails = await this.userRepository.findByIds([...uniqueUserIds]);
    // populate Individual and Group Exclusion Table
    if (consistencyRule === CONSISTENCY_RULE.GROUP) {
      const workingGroups = userDetails
        .map((userDetail) => {
          return userDetail.workingGroup && userDetail.workingGroup[group];
        })
        .filter((groupName) => !!groupName);

      // query all user information
      const groupsToExclude = new Set(workingGroups);

      // group exclusion documents
      const groupExclusionDocs: Array<Omit<GroupExclusion, 'id' | 'createdAt' | 'updatedAt' | 'versionNumber'>> = [
        ...groupsToExclude,
      ].map((groupId) => {
        return {
          experiment,
          groupId,
          exclusionCode: EXCLUSION_CODE.REACHED_PRIOR,
        };
      });

      await this.groupExclusionRepository.saveRawJson(groupExclusionDocs);
    }

    if (consistencyRule === CONSISTENCY_RULE.INDIVIDUAL || consistencyRule === CONSISTENCY_RULE.GROUP) {
      // individual exclusion document
      const individualExclusionDocs: Array<
        Omit<IndividualExclusion, 'id' | 'createdAt' | 'updatedAt' | 'versionNumber'>
      > = [...uniqueUserIds].map((userId) => {
        const user = userDetails.find((userDetail) => userDetail.id === userId);
        const isPreviewUser = previewUsers.find((previewUser) => previewUser.id === userId);
        return {
          user,
          experiment,
          assignmentType: isPreviewUser ? ASSIGNMENT_TYPE.MANUAL : ASSIGNMENT_TYPE.ALGORITHMIC,
          exclusionCode: EXCLUSION_CODE.REACHED_PRIOR,
        };
      });
      await this.individualExclusionRepository.saveRawJson(individualExclusionDocs);
    }
  }

  private checkConditionCodeDefault(conditions: ExperimentCondition[]): any {
    // Check for conditionCode is 'default' then return error:
    const hasDefaultConditionCode = conditions.filter(
      (condition) => condition.conditionCode.toUpperCase() === 'DEFAULT'
    );
    if (hasDefaultConditionCode.length) {
      // TODO remove this validation in the class validator end
      throw new BadRequestError("'default' as ConditionCode is not allowed.");
    }
  }

  private async updateExperimentInDB(
    experiment: ExperimentInput,
    user: User,
    logger: UpgradeLogger
  ): Promise<Experiment> {
    // get old experiment document
    const oldExperiment = await this.findOne(experiment.id, logger);
    const oldConditions = oldExperiment.conditions;
    const oldPartitions = oldExperiment.partitions;
    const oldQueries = oldExperiment.queries;

    // create schedules to start experiment and end experiment
    if (this.scheduledJobService) {
      this.scheduledJobService.updateExperimentSchedules(experiment as any, logger);
    }

    return getConnection()
      .transaction(async (transactionalEntityManager) => {
        experiment.context = experiment.context.map((context) => context.toLocaleLowerCase());
        let uniqueIdentifiers = await this.getAllUniqueIdentifiers(logger);
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
        let { conditions, partitions, queries, versionNumber, createdAt, updatedAt, segmentInclude, segmentExclude, ...expDoc } = experiment;
        let experimentDoc: Experiment;
        try {
          experimentDoc = await transactionalEntityManager.getRepository(Experiment).save(expDoc);
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = `Error in updating experiment document "updateExperimentInDB"`;
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }

        experimentDoc.experimentSegmentInclusion = oldExperiment.experimentSegmentInclusion;
        experimentDoc.experimentSegmentExclusion = oldExperiment.experimentSegmentExclusion;

        if (!segmentInclude && experimentDoc.experimentSegmentInclusion.segment) {
          const oldIncludeSegment = experimentDoc.experimentSegmentInclusion.segment;
          segmentInclude = {
            type : oldIncludeSegment.type,
            userIds : oldIncludeSegment.individualForSegment.map(x => x.userId),
            groups : oldIncludeSegment.groupForSegment.map(x => {
              return {type: x.type, groupId: x.groupId}
            }),
            subSegmentIds : oldIncludeSegment.subSegments.map(x => x.id)
          }
        }

        if (!segmentExclude && experimentDoc.experimentSegmentExclusion.segment) {
          const oldExcludeSegment = experimentDoc.experimentSegmentExclusion.segment; 
          segmentExclude = {
            type : oldExcludeSegment.type,
            userIds : oldExcludeSegment.individualForSegment.map(x => x.userId),
            groups : oldExcludeSegment.groupForSegment.map(x => {
              return {type: x.type, groupId: x.groupId}
            }),
            subSegmentIds : oldExcludeSegment.subSegments.map(x => x.id)
          }
        }

        const segmentIncludeData: SegmentInputValidator = {
          ...segmentInclude,
          id: experimentDoc.experimentSegmentInclusion.segment.id,
          name: experimentDoc.experimentSegmentInclusion.segment.name,
          description: experimentDoc.experimentSegmentInclusion.segment.description,
          context: experiment.context[0],
        }

        const segmentExcludeData: SegmentInputValidator = {
          ...segmentExclude,
          id: experimentDoc.experimentSegmentExclusion.segment.id,
          name: experimentDoc.experimentSegmentExclusion.segment.name,
          description: experimentDoc.experimentSegmentExclusion.segment.description,
          context: experiment.context[0],
        }

        let segmentIncludeDoc: Segment;
        let segmentExcludeDoc: Segment;
        try {
          segmentIncludeDoc = await this.segmentService.upsertSegment(segmentIncludeData, logger);
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = 'Error in updating IncludeSegment in DB';
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }

        try {
          segmentExcludeDoc = await this.segmentService.upsertSegment(segmentExcludeData, logger);
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = 'Error in updating ExcludeSegment in DB';
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }

        experimentDoc.experimentSegmentInclusion.segment = segmentIncludeDoc;
        experimentDoc.experimentSegmentExclusion.segment = segmentExcludeDoc;

        // Check for conditionCode is 'default' then return error:
        this.checkConditionCodeDefault(conditions);

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
              const joinedForId = getExperimentPartitionID(rest.site, rest.target);
              if (rest.id && rest.id === joinedForId) {
                rest.id = rest.id;
              } else {
                rest.id = getExperimentPartitionID(rest.site, rest.target);
              }
              rest.experiment = experimentDoc;
              return rest;
            })) ||
          [];

        // creating queries docs
        const promiseArray = [];
        let queriesDocToSave =
          (queries[0] &&
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
            metricsDocs[index] ? (queryDoc.metric = metricsDocs[index]) : null;
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
        oldPartitions.forEach(({ id, site, target }) => {
          if (
            !partitionDocToSave.find((doc) => {
              return doc.id === id && doc.site === site && doc.target === target;
            })
          ) {
            toDeletePartitions.push(this.decisionPointRepository.deleteDecisionPoint(id, transactionalEntityManager));
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
        let partitionDocs: DecisionPoint[];
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
                return this.decisionPointRepository.upsertDecisionPoint(partitionDoc, transactionalEntityManager);
              })
            ) as any,
            Promise.all(
              queriesDocToSave.map(async (queryDoc) => {
                return this.queryRepository.upsertQuery(queryDoc, transactionalEntityManager);
              })
            ) as any,
          ]);
        } catch (err) {
          const error = err as Error;
          error.message = `Error in creating conditions, partitions, queries "updateExperimentInDB"`;
          logger.error(error);
          throw error;
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
          queries: (queryDocToReturn as any) || []
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
        logger.info({ message: 'Updated experiment:', details: newExperiment });
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
    data: ExperimentCondition[] | DecisionPoint[],
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

  private async addExperimentInDB(experiment: ExperimentInput, user: User, logger: UpgradeLogger): Promise<Experiment> {
    const createdExperiment = await getConnection().transaction(async (transactionalEntityManager) => {
      experiment.id = experiment.id || uuid();
      experiment.context = experiment.context.map((context) => context.toLocaleLowerCase());
      let uniqueIdentifiers = await this.getAllUniqueIdentifiers(logger);
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
      const { conditions, partitions, queries, segmentInclude, segmentExclude, ...expDoc } = experiment;
      // Check for conditionCode is 'default' then return error:
      this.checkConditionCodeDefault(conditions);

      // saving experiment docs
      let experimentDoc: Experiment;
      try {
        experimentDoc = await transactionalEntityManager.getRepository(Experiment).save(expDoc);
      } catch (err) {
        const error = err as ErrorWithType;
        error.details = 'Error in adding experiment in DB';
        error.type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      // creating Include Segment
      const segmentIncludeData: SegmentInputValidator = { ...segmentInclude,
        id: uuid(),
        name: experiment.id + ' Inclusion Segment',
        description: experiment.id + ' Inclusion Segment',
        context: experiment.context[0]
      };
      let segmentIncludeDoc: Segment;
      try {
        segmentIncludeDoc = await this.segmentService.upsertSegment(segmentIncludeData, logger);
      } catch (err) {
        const error = err as ErrorWithType;
        error.details = 'Error in adding segment in DB';
        error.type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      // creating Exclude Segment
      const segmentExcludeData: SegmentInputValidator = { ...segmentExclude,
        id: uuid(),
        name: experiment.id + ' Exclusion Segment',
        description: experiment.id + ' Exclusion Segment',
        context: experiment.context[0]
      };
      let segmentExcludeDoc: Segment;
      try {
        segmentExcludeDoc = await this.segmentService.upsertSegment(segmentExcludeData, logger);
      } catch (err) {
        const error = err as ErrorWithType;
        error.details = 'Error in adding segment in DB';
        error.type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
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
          partition.id = getExperimentPartitionID(partition.site, partition.target);
          partition.experiment = experimentDoc;
          return partition;
        });

      // creating segmentInclude doc
      let includeTempDoc = new ExperimentSegmentInclusion();
      includeTempDoc.segment = segmentIncludeDoc;
      includeTempDoc.experiment = experimentDoc;
      var { createdAt, updatedAt, versionNumber, ...segmentIncludeDocToSave } = includeTempDoc;

      // creating segmentExclude doc
      let excludeTempDoc = new ExperimentSegmentExclusion();
      excludeTempDoc.segment = segmentExcludeDoc;
      excludeTempDoc.experiment = experimentDoc;
      var { createdAt, updatedAt, versionNumber, ...segmentExcludeDocToSave } = excludeTempDoc;

      // creating queries docs
      const promiseArray = [];
      let queryDocsToSave =
        (queries[0] &&
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
        queryDocsToSave = queryDocsToSave.map((queryDoc, index) => {
          metricsDocs[index] ? (queryDoc.metric = metricsDocs[index]) : null;
          return queryDoc;
        });

        // filter document which is not having valid metrics
        queryDocsToSave = queryDocsToSave.filter((doc) => doc.metric);
      }

      // saving conditions, partitions, queries, segmentInclude, segmentExclude
      let conditionDocs: ExperimentCondition[];
      let experimentSegmentInclusionDoc: ExperimentSegmentInclusion;
      let experimentSegmentExclusionDoc: ExperimentSegmentExclusion;
      let partitionDocs: DecisionPoint[];
      let queryDocs: any;
      try {
        [conditionDocs, partitionDocs, experimentSegmentInclusionDoc, experimentSegmentExclusionDoc, queryDocs] = await Promise.all([
          this.experimentConditionRepository.insertConditions(conditionDocsToSave, transactionalEntityManager),
          this.decisionPointRepository.insertDecisionPoint(partitionDocsToSave, transactionalEntityManager),
          this.experimentSegmentInclusionRepository.insertData(segmentIncludeDocToSave, logger, transactionalEntityManager),
          this.experimentSegmentExclusionRepository.insertData(segmentExcludeDocToSave, logger, transactionalEntityManager),
          queryDocsToSave.length > 0
            ? this.queryRepository.insertQueries(queryDocsToSave, transactionalEntityManager)
            : (Promise.resolve([]) as any),
        ]);
      } catch (err) {
        const error = err as Error;
        error.message = `Error in creating conditions, partitions and queries "addExperimentInDB"`;
        logger.error(error);
        throw error;
      }
      const conditionDocToReturn = conditionDocs.map((conditionDoc) => {
        const { experimentId, ...restDoc } = conditionDoc as any;
        return restDoc;
      });
      const partitionDocToReturn = partitionDocs.map((partitionDoc) => {
        const { experimentId, ...restDoc } = partitionDoc as any;
        return restDoc;
      });

      let queryDocToReturn = [];
      if (queryDocs.length > 0) {
        queryDocToReturn = queryDocsToSave;
      }

      const newExperiment = {
        ...experimentDoc,
        conditions: conditionDocToReturn as any,
        partitions: partitionDocToReturn as any,
        experimentSegmentInclusion: {...experimentSegmentInclusionDoc, segment: segmentIncludeDoc} as any,
        experimentSegmentExclusion: {...experimentSegmentExclusionDoc, segment: segmentExcludeDoc} as any,
        queries: (queryDocToReturn as any) || [],
      };
      return newExperiment;
    });
    // create schedules to start experiment and end experiment
    if (this.scheduledJobService) {
      await this.scheduledJobService.updateExperimentSchedules(createdExperiment, logger);
    }

    // add auditLog here
    const createAuditLogData: AuditLogData = {
      experimentId: createdExperiment.id,
      experimentName: createdExperiment.name,
    };
    await this.experimentAuditLogRepository.saveRawJson(
      EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED,
      createAuditLogData,
      user
    );
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

  private async addBulkExperiments(experiments: ExperimentInput[], logger: UpgradeLogger): Promise<Experiment[]> {
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
          partition.id = getExperimentPartitionID(partition.site, partition.target);
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
    let uniqueIdentifiers = await this.getAllUniqueIdentifiers(logger);
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
      } catch (err) {
        const error = err as Error;
        error.message = `Error in creating experiment document "addBulkExperiments"`;
        logger.error(error);
        throw error;
      }
      // saving conditions and saving partitions
      let conditionDocs: ExperimentCondition[];
      let partitionDocs: DecisionPoint[];
      try {
        [conditionDocs, partitionDocs] = await Promise.all([
          this.experimentConditionRepository.insertConditions(conditionDocsToSave, transactionalEntityManager),
          this.decisionPointRepository.insertDecisionPoint(partitionDocsToSave, transactionalEntityManager),
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
      } catch (err) {
        const error = err as Error;
        error.message = `Error in creating conditions and partitions "addBulkExperiments"`;
        logger.error(error);
        throw error;
      }
    });

    return createdExperiment;
  }
}
