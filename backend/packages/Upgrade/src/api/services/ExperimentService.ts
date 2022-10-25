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
import { DecisionPoint } from '../models/DecisionPoint';
import { ScheduledJobService } from './ScheduledJobService';
import { getConnection, In, EntityManager } from 'typeorm';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { diffString } from 'json-diff';
import { EXPERIMENT_LOG_TYPE, EXPERIMENT_STATE, CONSISTENCY_RULE, SERVER_ERROR, EXCLUSION_CODE, SEGMENT_TYPE } from 'upgrade_types';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { MonitoredDecisionPointRepository } from '../repositories/MonitoredDecisionPointRepository';
import { User } from '../models/User';
import { ASSIGNMENT_TYPE } from '../../types/index';
import { MonitoredDecisionPoint } from '../models/MonitoredDecisionPoint';
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import { PreviewUserService } from './PreviewUserService';
import { AuditLogData } from 'upgrade_types';
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
import { ConditionAlias } from '../models/ConditionAlias';
import { ConditionAliasRepository } from '../repositories/ConditionAliasRepository';

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
    @OrmRepository() private conditionAliasRepository: ConditionAliasRepository,
    public previewUserService: PreviewUserService,
    public segmentService: SegmentService,
    public scheduledJobService: ScheduledJobService,
    public errorService: ErrorService
  ) {}

  public async find(logger?: UpgradeLogger): Promise<Experiment[]> {
    if (logger) {
      logger.info({ message: `Find all experiments` });
    }
    const experiments = await this.experimentRepository.findAllExperiments();
    return experiments.map(x => this.formatingConditionAlias(x));
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
      .leftJoinAndSelect('partitions.conditionAliases','ConditionAliasesArray')
      .leftJoinAndSelect('ConditionAliasesArray.parentCondition','parentCondition')
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

    return (await queryBuilder.getMany()).map(x => this.formatingConditionAlias(x));
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
      .leftJoinAndSelect('partitions.conditionAliases','ConditionAliasesArray')
      .leftJoinAndSelect('ConditionAliasesArray.parentCondition','parentCondition')
      .where({ id })
      .getOne();

    return this.formatingConditionAlias(experiment);
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

  public create(experiment: Experiment, currentUser: User, logger: UpgradeLogger, createType?: string): Promise<Experiment> {
    logger.info({ message: 'Create a new experiment =>', details: experiment });

    // order for condition
    let newConditionId;
    let newCondition;
    experiment.conditions.forEach((condition, index) => {
      if ( createType && createType === 'import') {
        newConditionId = uuid();
      } else {
        newConditionId = condition.id || uuid();
      }
      
      // proper reference for post experiment rule condition:
      if (experiment.postExperimentRule === 'assign') {
        if (experiment.revertTo === condition.id) {
          experiment.revertTo = newConditionId;
        }
      }
      newCondition = { ...condition, id: newConditionId, order: index + 1 };
      experiment.conditions[index] = newCondition;
    });

    // order for decisionPoint
    experiment.partitions.forEach((decisionPoint, index) => {
      const newDecisionPoint = { ...decisionPoint, order: index + 1 };
      experiment.partitions[index] = newDecisionPoint;
    });
    experiment.backendVersion = env.app.version;
    return this.addExperimentInDB(experiment, currentUser, logger);
  }

  public createMultipleExperiments(experiment: Experiment[], user:User, logger: UpgradeLogger): Promise<Experiment[]> {
    logger.info({ message: `Generating test experiments`, details: experiment });
    return this.addBulkExperiments(experiment, user, logger);
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
    const decisionPointsUniqueIdentifier = this.decisionPointRepository.getAllUniqueIdentifier();
    const [conditionIds, decisionPointsIds] = await Promise.all([conditionsUniqueIdentifier, decisionPointsUniqueIdentifier]);
    return [...conditionIds, ...decisionPointsIds];
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

  public async importExperiment(experiments: Experiment[], user: User, logger: UpgradeLogger): Promise<Experiment[]> {
    for (let experiment of experiments) {
      const duplicateExperiment = await this.experimentRepository.findOne(experiment.id);
      if (duplicateExperiment && experiment.id !== undefined) {
        const error = new Error('Duplicate experiment');
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }
      let experimentDecisionPoints = experiment.partitions;
      // Remove the decision points which already exist
      for (const decisionPoint of experimentDecisionPoints) {
        const decisionPointExists = await this.decisionPointRepository.findOne(decisionPoint.id);
        if (decisionPointExists) {
          // provide new uuid:
          experimentDecisionPoints[experimentDecisionPoints.indexOf(decisionPoint)].id = uuid();
        }
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

      // Generate new twoCharacterId if it is already exist for decision points
      experimentDecisionPoints = experimentDecisionPoints.map((decisionPoint) => {
        let twoCharacterId = decisionPoint.twoCharacterId;
        if (uniqueIdentifiers.indexOf(twoCharacterId) !== -1) {
          twoCharacterId = this.getUniqueIdentifier(uniqueIdentifiers);
          logger.info({ message: `Generate new twoCharacterId for Decision Point =>`, details: twoCharacterId });
          decisionPoint.twoCharacterId = twoCharacterId;
        }
        uniqueIdentifiers = [...uniqueIdentifiers, twoCharacterId];
        return decisionPoint;
      });
    }
    return this.addBulkExperiments(experiments, user, logger);
  }

  public async exportExperiment(experimentIds: string[], user: User, logger: UpgradeLogger): Promise<Experiment[]> {
    logger.info({ message: `Inside export Experiment JSON ${experimentIds}` });
    const experimentDetails = await this.experimentRepository.find({
      where: { id: In(experimentIds) },
      relations: [
        'partitions', 
        'conditions', 
        'stateTimeLogs', 
        'queries', 
        'queries.metric',
        'experimentSegmentInclusion',
        'experimentSegmentInclusion.segment',
        'experimentSegmentInclusion.segment.individualForSegment',
        'experimentSegmentInclusion.segment.groupForSegment',
        'experimentSegmentInclusion.segment.subSegments',
        'experimentSegmentExclusion',
        'experimentSegmentExclusion.segment',
        'experimentSegmentExclusion.segment.individualForSegment',
        'experimentSegmentExclusion.segment.groupForSegment',
        'experimentSegmentExclusion.segment.subSegments',
        'partitions.conditionAliases',
        'partitions.conditionAliases.parentCondition'
      ],
    });
    const formatedExperiments = experimentDetails.map(experiment => {
      experiment.backendVersion = env.app.version;
      this.experimentAuditLogRepository.saveRawJson(
        EXPERIMENT_LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED,
        { experimentName: experiment.name },
        user
      );
      return this.formatingConditionAlias(experiment);
    }); 
    
    return formatedExperiments;    
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
    const subExperiments = experiment.partitions.filter((partition) => {
      return partition.excludeIfReached;
    }).map(({ id }) => {
      return id;
    });

    // get all preview usersData
    const previewUsers = await this.previewUserService.find(logger);

    // query all monitored experiment point for this experiment Id
    let monitoredDecisionPoints: MonitoredDecisionPoint[] = [];
    if (state === EXPERIMENT_STATE.ENROLLING) {
      monitoredDecisionPoints = await this.monitoredDecisionPointRepository.find({
        relations: ['user'],
        where: { id: In(subExperiments) },
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
    experiment: Experiment,
    user: User,
    logger: UpgradeLogger
  ): Promise<Experiment> {
    // get old experiment document
    const oldExperiment = await this.findOne(experiment.id, logger);
    const oldConditions = oldExperiment.conditions;
    const oldDecisionPoints = oldExperiment.partitions;
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
        let { conditions, partitions: decisionPoints, conditionAliases, queries, versionNumber, createdAt, updatedAt, experimentSegmentInclusion, experimentSegmentExclusion, ...expDoc } = experiment;

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
        let segmentInclude;
        let segmentIncludeData;
        if (experimentDoc.experimentSegmentInclusion.segment) {
          segmentIncludeData = { ...experimentSegmentInclusion,
            id: experimentDoc.experimentSegmentInclusion.segment.id,
            name: experimentDoc.experimentSegmentInclusion.segment.name,
            description: experimentDoc.experimentSegmentInclusion.segment.description,
            context: experiment.context[0],
            type: SEGMENT_TYPE.PRIVATE,
          }
        } else {
          segmentInclude = experimentDoc.experimentSegmentInclusion;
          segmentIncludeData = { ...segmentInclude,
            id: uuid(),
            name: experiment.id + ' Inclusion Segment',
            description: experiment.id + ' Inclusion Segment',
            context: experiment.context[0]
          };
        }

        let segmentExclude;
        let segmentExcludeData;
        if (experimentDoc.experimentSegmentExclusion.segment) {
          segmentExcludeData = {
            ...experimentSegmentExclusion,
            id: experimentDoc.experimentSegmentExclusion.segment.id,
            name: experimentDoc.experimentSegmentExclusion.segment.name,
            description: experimentDoc.experimentSegmentExclusion.segment.description,
            context: experiment.context[0],
            type: SEGMENT_TYPE.PRIVATE
          }
        } else {
          segmentExclude = experimentDoc.experimentSegmentExclusion;
          segmentExcludeData = { ...segmentExclude,
            id: uuid(),
            name: experiment.id + ' Exclusion Segment',
            description: experiment.id + ' Exclusion Segment',
            context: experiment.context[0]
          };
        }
        // for test cases:
        if (segmentIncludeData['subSegmentIds'] === undefined) {
          segmentIncludeData.subSegmentIds = [];
          segmentIncludeData.userIds = [];
          segmentIncludeData.groups = [];
        }

        let segmentIncludeDoc: Segment;
        try {
          segmentIncludeDoc = await this.segmentService.upsertSegment(segmentIncludeData, logger);
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = 'Error in updating IncludeSegment in DB';
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }
        // for test cases:
        if (segmentExcludeData['subSegmentIds'] === undefined) {
          segmentExcludeData.subSegmentIds = [];
          segmentExcludeData.userIds = [];
          segmentExcludeData.groups = [];
        }

        let segmentExcludeDoc: Segment;
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

        // creating decision point docs
        let promiseArray = []
        const decisionPointDocToSave =
          (decisionPoints &&
            decisionPoints.length > 0 &&
            decisionPoints.map((decisionPoint: any) => {
              promiseArray.push(this.decisionPointRepository.findOne({
                where: {
                  site: decisionPoint.site,
                  target: decisionPoint.target,
                }
              }));
              // tslint:disable-next-line:no-shadowed-variable
              const { createdAt, updatedAt, versionNumber, ...rest } = decisionPoint;
              rest.experiment = experimentDoc;
              rest.id = rest.id || uuid();
              return rest;
            })) ||
          [];

        // creating queries docs
        promiseArray = [];
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

        // delete decision points which don't exist in new experiment document
        const toDeleteDecisionPoints = [];
        oldDecisionPoints.forEach(({ id, site, target }) => {
          if (
            !decisionPointDocToSave.find((doc) => {
              return doc.id === id && doc.site === site && doc.target === target;
            })
          ) {
            toDeleteDecisionPoints.push(this.decisionPointRepository.deleteDecisionPoint(id, transactionalEntityManager));
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

        // delete old decision points, conditions and queries
        await Promise.all([...toDeleteConditions, ...toDeleteDecisionPoints, ...toDeleteQueries]);

        // saving conditions, saving decision points and saving queries
        let conditionDocs: ExperimentCondition[];
        let decisionPointDocs: DecisionPoint[];
        let queryDocs: Query[];
        let conditionAliasDocs: ConditionAlias[];
        try {
          [conditionDocs, decisionPointDocs, conditionAliasDocs, queryDocs] = await Promise.all([
            Promise.all(
              conditionDocToSave.map(async (conditionDoc) => {
                return this.experimentConditionRepository.upsertExperimentCondition(
                  conditionDoc,
                  transactionalEntityManager
                );
              })
            ) as any,
            Promise.all(
              decisionPointDocToSave.map(async (decisionPointDoc) => {
                return this.decisionPointRepository.upsertDecisionPoint(await decisionPointDoc, transactionalEntityManager);
              })
            ) as any,
            Promise.all(
              conditionAliases.map(async (conditionAlias) => {
                return this.conditionAliasRepository.upsertConditionAlias(conditionAlias, transactionalEntityManager);
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
          error.message = `Error in creating conditions, decision points, conditionAliases, queries "updateExperimentInDB"`;
          logger.error(error);
          throw error;
        }

        const conditionDocToReturn = conditionDocs.map((conditionDoc) => {
          return { ...conditionDoc, experiment: conditionDoc.experiment };
        });

        const decisionPointDocToReturn = decisionPointDocs.map((decisionPointDoc) => {
          return { ...decisionPointDoc, experiment: decisionPointDoc.experiment };
        });

        const conditionAliasDocToReturn = await transactionalEntityManager.getRepository(ConditionAlias).find({
          relations: ['parentCondition', 'decisionPoint'],
          where: { id :In(conditionAliasDocs.map(conditionAlias => conditionAlias.id)) }
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
          partitions: decisionPointDocToReturn as any,
          conditionAliases: conditionAliasDocToReturn as any,
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

        oldExperimentClone.partitions.map((decisionPoint) => {
          delete decisionPoint.versionNumber;
          delete decisionPoint.updatedAt;
          delete decisionPoint.createdAt;
          delete (decisionPoint as any).experimentId;
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

        newExperimentClone.partitions.map((decisionPoint) => {
          delete decisionPoint.versionNumber;
          delete decisionPoint.updatedAt;
          delete decisionPoint.createdAt;
          delete (decisionPoint as any).experimentId;
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

  // Used to generate twoCharacterId for condition and decision point
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
    const updatedData = (data as any).map((conditionOrDecisionPoint) => {
      if (!conditionOrDecisionPoint.twoCharacterId) {
        const twoCharacterId = this.getUniqueIdentifier(uniqueIdentifiers);
        uniqueIdentifiers = [...uniqueIdentifiers, twoCharacterId];
        return {
          ...conditionOrDecisionPoint,
          twoCharacterId,
        };
      }
      return conditionOrDecisionPoint;
    });
    return [updatedData, uniqueIdentifiers];
  }

  private async addExperimentInDB(experiment: Experiment, user: User, logger: UpgradeLogger): Promise<Experiment> {
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
      const { conditions, partitions, queries, experimentSegmentInclusion, experimentSegmentExclusion, conditionAliases, ...expDoc } = experiment;
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
      experimentDoc.experimentSegmentInclusion = experimentSegmentInclusion;
      let segmentInclude;
      if (experimentDoc.experimentSegmentInclusion.segment) {
        const includeSegment = experimentDoc.experimentSegmentInclusion.segment;
        segmentInclude = { ...experimentSegmentInclusion,
          type : includeSegment.type,
          userIds : includeSegment.individualForSegment.map(x => x.userId),
          groups : includeSegment.groupForSegment.map(x => {
            return {type: x.type, groupId: x.groupId}
          }),
          subSegmentIds : includeSegment.subSegments.map(x => x.id)
        }
      } else {
        segmentInclude = experimentDoc.experimentSegmentInclusion;
      }

      const segmentIncludeData: SegmentInputValidator = { ...segmentInclude,
        id: uuid(),
        name: experiment.id + ' Inclusion Segment',
        description: experiment.id + ' Inclusion Segment',
        context: experiment.context[0],
        type: SEGMENT_TYPE.PRIVATE
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
      experimentDoc.experimentSegmentExclusion = experimentSegmentExclusion;
      let segmentExclude;
      if (experimentDoc.experimentSegmentExclusion.segment) {
        const excludeSegment = experimentDoc.experimentSegmentExclusion.segment; 
        segmentExclude = { ...experimentSegmentExclusion,
          type : excludeSegment.type,
          userIds : excludeSegment.individualForSegment.map(x => x.userId),
          groups : excludeSegment.groupForSegment.map(x => {
            return {type: x.type, groupId: x.groupId}
          }),
          subSegmentIds : excludeSegment.subSegments.map(x => x.id)
        }
      } else {
        segmentExclude = experimentDoc.experimentSegmentExclusion;
      }
      
      const segmentExcludeData: SegmentInputValidator = { ...segmentExclude,
        id: uuid(),
        name: experiment.id + ' Exclusion Segment',
        description: experiment.id + ' Exclusion Segment',
        context: experiment.context[0],
        type: SEGMENT_TYPE.PRIVATE
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

      // creating decision point docs
      const decisionPointDocsToSave =
        partitions &&
        partitions.length > 0 &&
        partitions.map((decisionPoint) => {
          decisionPoint.id = decisionPoint.id || uuid();
          decisionPoint.experiment = experimentDoc;
          return decisionPoint;
        });
      
      // update conditionAliases condition uuids:
      if (conditionAliases) {
        conditionAliases.map(conditionAlias => {
          let condition = conditions.find((doc) => {
            return doc.conditionCode === conditionAlias.parentCondition.conditionCode;
          });
          if (condition) {
            conditionAlias.parentCondition.id = condition.id;
          }
        })
      }
        
      const conditionAliasDocsToSave = 
        (conditionAliases &&
        conditionAliases.length > 0 &&
        conditionAliases.map((conditionAlias: ConditionAlias) => {
          conditionAlias.id = conditionAlias.id || uuid();
          return conditionAlias;
        })) ||
        [];

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

      // saving conditions, decision points, queries, segmentInclude, segmentExclude
      let conditionDocs: ExperimentCondition[];
      let experimentSegmentInclusionDoc: ExperimentSegmentInclusion;
      let experimentSegmentExclusionDoc: ExperimentSegmentExclusion;
      let decisionPointDocs: DecisionPoint[];
      let conditionAliasDoc: ConditionAlias[];
      let queryDocs: any;
      try {
        [conditionDocs, decisionPointDocs, experimentSegmentInclusionDoc, experimentSegmentExclusionDoc, conditionAliasDoc, queryDocs] = await Promise.all([
          this.experimentConditionRepository.insertConditions(conditionDocsToSave, transactionalEntityManager),
          this.decisionPointRepository.insertDecisionPoint(decisionPointDocsToSave, transactionalEntityManager),
          this.experimentSegmentInclusionRepository.insertData(segmentIncludeDocToSave, logger, transactionalEntityManager),
          this.experimentSegmentExclusionRepository.insertData(segmentExcludeDocToSave, logger, transactionalEntityManager),
          this.conditionAliasRepository.insertConditionAlias(conditionAliasDocsToSave, transactionalEntityManager),
          queryDocsToSave.length > 0
            ? this.queryRepository.insertQueries(queryDocsToSave, transactionalEntityManager)
            : (Promise.resolve([]) as any),
        ]);
      } catch (err) {
        const error = err as Error;
        error.message = `Error in creating conditions, decision points, conditionAliases and queries "addExperimentInDB"`;
        logger.error(error);
        throw error;
      }
      const conditionDocToReturn = conditionDocs.map((conditionDoc) => {
        const { experimentId, ...restDoc } = conditionDoc as any;
        return restDoc;
      });
      const decisionPointDocToReturn = decisionPointDocs.map((decisionPointDoc) => {
        const { experimentId, ...restDoc } = decisionPointDoc as any;
        return restDoc;
      });

      const conditionAliasDocToReturn = await transactionalEntityManager.getRepository(ConditionAlias).find({
        relations: ['parentCondition', 'decisionPoint'],
        where: { id :In(conditionAliasDoc.map(conditionAlias => conditionAlias.id)) }
      });

      let queryDocToReturn = [];
      if (queryDocs.length > 0) {
        queryDocToReturn = queryDocsToSave;
      }

      const newExperiment = {
        ...experimentDoc,
        conditions: conditionDocToReturn as any,
        partitions: decisionPointDocToReturn as any,
        experimentSegmentInclusion: {...experimentSegmentInclusionDoc, segment: segmentIncludeDoc} as any,
        experimentSegmentExclusion: {...experimentSegmentExclusionDoc, segment: segmentExcludeDoc} as any,
        conditionAliases: conditionAliasDocToReturn as any,
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

  private async addBulkExperiments(experiments: Experiment[], currentUser:User, logger: UpgradeLogger): Promise<Experiment[]> {
    const createdExperiments = await Promise.all(experiments.map(async exp => {
      try {
        return await this.create(exp,currentUser,logger)
      } catch (err) {
        const error = err as Error;
        error.message = `Error in creating experiment document "addBulkExperiments"`;
        logger.error(error);
        throw error;
      }
    }));

    return createdExperiments;
  }

  private formatingConditionAlias(experiment: Experiment): any {
    const { conditions, partitions } = experiment;
  
    let conditionAlias: ConditionAlias[] = [];
    partitions.forEach(partition => {
      const conditionAliasData = partition.conditionAliases;
      delete partition.conditionAliases;

      conditionAliasData.forEach(x => {
        if (x && conditions.filter(con => con.id === x.parentCondition.id).length > 0) {
          conditionAlias.push({...x, decisionPoint: partition});
        }
      })
    });
    return {...experiment, conditionAliases: conditionAlias};
  } 
}
