/* eslint-disable no-var */
import { GroupExclusion } from './../models/GroupExclusion';
import { ErrorWithType } from './../errors/ErrorWithType';
import { Inject, Service } from 'typedi';
import { InjectDataSource, InjectRepository } from '../../typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import {
  Experiment,
  IExperimentSearchParams,
  EXPERIMENT_SEARCH_KEY,
  IExperimentSortParams,
} from '../models/Experiment';
import { v4 as uuid } from 'uuid';
import { ExperimentConditionRepository } from '../repositories/ExperimentConditionRepository';
import { DecisionPointRepository } from '../repositories/DecisionPointRepository';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { DecisionPoint } from '../models/DecisionPoint';
import { ScheduledJobService } from './ScheduledJobService';
import { In, EntityManager, DataSource } from 'typeorm';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { diffString } from 'json-diff';
import {
  LOG_TYPE,
  EXPERIMENT_STATE,
  CONSISTENCY_RULE,
  SERVER_ERROR,
  EXCLUSION_CODE,
  SEGMENT_TYPE,
  EXPERIMENT_TYPE,
  CACHE_PREFIX,
  ASSIGNMENT_UNIT,
  FILTER_MODE,
} from 'upgrade_types';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { MonitoredDecisionPointRepository } from '../repositories/MonitoredDecisionPointRepository';
import { UserDTO } from '../DTO/UserDTO';
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
import { ConditionPayload } from '../models/ConditionPayload';
import { ConditionPayloadRepository } from '../repositories/ConditionPayloadRepository';
import { Factor } from '../models/Factor';
import { FactorRepository } from '../repositories/FactorRepository';
import { Level } from '../models/Level';
import { LevelRepository } from '../repositories/LevelRepository';
import { LevelCombinationElement } from '../models/LevelCombinationElement';
import { LevelCombinationElementRepository } from '../repositories/LevelCombinationElements';
import {
  ConditionValidator,
  ExperimentDTO,
  FactorValidator,
  PartitionValidator,
  ParticipantsValidator,
  ExperimentFile,
  ValidatedExperimentError,
  OldExperimentDTO,
} from '../DTO/ExperimentDTO';
import { ConditionPayloadDTO } from '../DTO/ConditionPayloadDTO';
import { FactorDTO } from '../DTO/FactorDTO';
import { LevelDTO } from '../DTO/LevelDTO';
import { CacheService } from './CacheService';
import { QueryService } from './QueryService';
import { ArchivedStats } from '../models/ArchivedStats';
import { ArchivedStatsRepository } from '../repositories/ArchivedStatsRepository';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { StratificationFactorRepository } from '../repositories/StratificationFactorRepository';
import { ExperimentDetailsForCSVData } from '../repositories/AnalyticsRepository';
import { compare } from 'compare-versions';

const errorRemovePart = 'instance of ExperimentDTO has failed the validation:\n - ';
const stratificationErrorMessage =
  'Import Stratification Factor from Participants Menu > Stratification before using it';
const oldVersionErrorMessage =
  'Warning: this experiment file is incompatible(older) with the current version of UpGrade. Some features may not import or function as intended.';
const newVersionErrorMessage =
  'Warning: this experiment file is incompatible(newer) with the current version of UpGrade. Some features may not import or function as intended.';
@Service()
export class ExperimentService {
  backendVersion = env.app.version;
  allIdMap = {};

  constructor(
    @InjectRepository() private experimentRepository: ExperimentRepository,
    @InjectRepository() private experimentConditionRepository: ExperimentConditionRepository,
    @InjectRepository() private decisionPointRepository: DecisionPointRepository,
    @InjectRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
    @InjectRepository() private individualExclusionRepository: IndividualExclusionRepository,
    @InjectRepository() private groupExclusionRepository: GroupExclusionRepository,
    @InjectRepository() private monitoredDecisionPointRepository: MonitoredDecisionPointRepository,
    @InjectRepository() private userRepository: ExperimentUserRepository,
    @InjectRepository() private metricRepository: MetricRepository,
    @InjectRepository() private queryRepository: QueryRepository,
    @InjectRepository() private stateTimeLogsRepository: StateTimeLogsRepository,
    @InjectRepository() private experimentSegmentInclusionRepository: ExperimentSegmentInclusionRepository,
    @InjectRepository() private experimentSegmentExclusionRepository: ExperimentSegmentExclusionRepository,
    @InjectRepository() private conditionPayloadRepository: ConditionPayloadRepository,
    @InjectRepository() private factorRepository: FactorRepository,
    @InjectRepository() private levelRepository: LevelRepository,
    @InjectRepository() private levelCombinationElementsRepository: LevelCombinationElementRepository,
    @InjectRepository() private archivedStatsRepository: ArchivedStatsRepository,
    @InjectRepository() private stratificationRepository: StratificationFactorRepository,
    @InjectDataSource() private dataSource: DataSource,
    public previewUserService: PreviewUserService,
    public segmentService: SegmentService,
    @Inject(() => ScheduledJobService)
    public scheduledJobService: ScheduledJobService,
    public errorService: ErrorService,
    public cacheService: CacheService,
    public queryService: QueryService
  ) {}

  public async find(logger?: UpgradeLogger): Promise<ExperimentDTO[]> {
    if (logger) {
      logger.info({ message: `Find all experiments` });
    }
    const experiments = await this.experimentRepository.findAllExperiments();
    return experiments.map((experiment) => {
      return this.reducedConditionPayload(this.formatingPayload(this.formatingConditionPayload(experiment)));
    });
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
      .take(take)
      .skip(skip);

    if (searchParams) {
      const customSearchString = searchParams.string.split(' ').join(`:*&`);
      // add search query
      const postgresSearchString = this.postgresSearchString(searchParams.key);
      queryBuilder = queryBuilder
        .addSelect(`ts_rank_cd(to_tsvector('english',${postgresSearchString}), to_tsquery(:query))`, 'rank')
        .addOrderBy('rank', 'DESC')
        .setParameter('query', `${customSearchString}:*`);
    } else {
      queryBuilder = queryBuilder.addOrderBy('experiment.updatedAt', 'DESC');
    }

    let expIds = (await queryBuilder.getMany()).map((exp) => exp.id);
    expIds = Array.from(new Set(expIds));

    let queryBuilderToReturn = this.experimentRepository
      .createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.queries', 'queries')
      .leftJoinAndSelect('experiment.factors', 'factors')
      .leftJoinAndSelect('factors.levels', 'levels')
      .leftJoinAndSelect('queries.metric', 'metric')
      .leftJoinAndSelect('experiment.stratificationFactor', 'stratificationFactor')
      .leftJoinAndSelect('experiment.experimentSegmentInclusion', 'experimentSegmentInclusion')
      .leftJoinAndSelect('experimentSegmentInclusion.segment', 'segmentInclusion')
      .leftJoinAndSelect('segmentInclusion.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segmentInclusion.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment')
      .leftJoinAndSelect('experiment.experimentSegmentExclusion', 'experimentSegmentExclusion')
      .leftJoinAndSelect('experimentSegmentExclusion.segment', 'segmentExclusion')
      .leftJoinAndSelect('segmentExclusion.individualForSegment', 'individualForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.groupForSegment', 'groupForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion')
      .leftJoinAndSelect('conditions.levelCombinationElements', 'levelCombinationElements')
      .leftJoinAndSelect('levelCombinationElements.level', 'level')
      .leftJoinAndSelect('conditions.conditionPayloads', 'conditionPayload')
      .leftJoinAndSelect('partitions.conditionPayloads', 'ConditionPayloadsArray')
      .leftJoinAndSelect('ConditionPayloadsArray.parentCondition', 'parentCondition')
      .whereInIds(expIds);

    if (sortParams) {
      queryBuilderToReturn = queryBuilderToReturn.addOrderBy(
        `LOWER(CAST(experiment.${sortParams.key} AS TEXT))`,
        sortParams.sortAs
      );
    }
    const experiments = await queryBuilderToReturn.getMany();
    return experiments.map((experiment) => {
      return this.reducedConditionPayload(this.formatingPayload(this.formatingConditionPayload(experiment)));
    });
  }

  public async getSingleExperiment(id: string, logger?: UpgradeLogger): Promise<ExperimentDTO | undefined> {
    const experiment = await this.findOne(id, logger);
    if (experiment) {
      return this.reducedConditionPayload(this.formatingPayload(experiment));
    } else {
      return undefined;
    }
  }

  public async findOne(id: string, logger?: UpgradeLogger): Promise<Experiment | undefined> {
    if (logger) {
      logger.info({ message: `Find experiment by id => ${id}` });
    }
    const experiment = await this.experimentRepository.findOneExperiment(id);

    if (experiment) {
      return this.formatingConditionPayload(experiment);
    } else {
      return undefined;
    }
  }

  public async getExperimentDetailsForCSVDataExport(experimentId: string): Promise<ExperimentDetailsForCSVData[]> {
    return await this.experimentRepository.fetchExperimentDetailsForCSVDataExport(experimentId);
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

  public async getCachedValidExperiments(context: string) {
    const cacheKey = CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + context;
    return this.cacheService
      .wrap(cacheKey, this.experimentRepository.getValidExperiments.bind(this.experimentRepository, context))
      .then((validExperiment) => {
        return JSON.parse(JSON.stringify(validExperiment));
      });
  }

  public create(
    experiment: ExperimentDTO,
    currentUser: UserDTO,
    logger: UpgradeLogger,
    createType?: string
  ): Promise<Experiment> {
    logger.info({ message: 'Create a new experiment =>', details: experiment });

    // order for condition
    let newConditionId;
    let newCondition;
    experiment.conditions.forEach((condition, index) => {
      if (createType && createType === 'import') {
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

  public createMultipleExperiments(
    experiments: ExperimentDTO[],
    user: UserDTO,
    logger: UpgradeLogger
  ): Promise<Experiment[]> {
    logger.info({ message: `Generating test experiments`, details: experiments });
    return this.addBulkExperiments(experiments, user, logger);
  }

  public async delete(
    experimentId: string,
    currentUser: UserDTO,
    logger?: UpgradeLogger
  ): Promise<Experiment | undefined> {
    if (logger) {
      logger.info({ message: `Delete experiment =>  ${experimentId}` });
    }
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      const experiment = await this.findOne(experimentId, logger);

      if (experiment) {
        await this.clearExperimentCacheDetail(
          experiment.context[0],
          experiment.partitions.map((partition) => {
            return { site: partition.site, target: partition.target };
          })
        );

        const deletedExperiment = await this.experimentRepository.deleteById(experimentId, transactionalEntityManager);

        // adding entry in audit log
        const deleteAuditLogData = {
          experimentName: experiment.name,
        };

        // Add log for experiment deleted
        this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.EXPERIMENT_DELETED, deleteAuditLogData, currentUser);
        if (experiment.experimentSegmentInclusion) {
          try {
            await transactionalEntityManager
              .getRepository(Segment)
              .delete(experiment.experimentSegmentInclusion.segment.id);
          } catch (err) {
            const error = err as ErrorWithType;
            error.details = 'Error in deleting Include Segment from DB';
            error.type = SERVER_ERROR.QUERY_FAILED;
            logger.error(error);
            throw error;
          }
        }
        if (experiment.experimentSegmentExclusion) {
          try {
            await transactionalEntityManager
              .getRepository(Segment)
              .delete(experiment.experimentSegmentExclusion.segment.id);
          } catch (err) {
            const error = err as ErrorWithType;
            error.details = 'Error in deleting Exclude Segment fron DB';
            error.type = SERVER_ERROR.QUERY_FAILED;
            logger.error(error);
            throw error;
          }
        }
        return deletedExperiment;
      }
      return undefined;
    });
  }

  public async update(experiment: ExperimentDTO, currentUser: UserDTO, logger: UpgradeLogger): Promise<ExperimentDTO> {
    if (logger) {
      logger.info({ message: `Update the experiment`, details: experiment });
    }
    return this.reducedConditionPayload(await this.updateExperimentInDB(experiment, currentUser, logger));
  }

  public async getExperimentalConditions(experimentId: string, logger: UpgradeLogger): Promise<ExperimentCondition[]> {
    logger.info({ message: `getExperimentalConditions experiment => ${experimentId}` });
    const experiment: Experiment = await this.findOne(experimentId, logger);
    return experiment?.conditions;
  }

  public async getExperimentPartitions(experimentId: string, logger: UpgradeLogger): Promise<DecisionPoint[]> {
    logger.info({ message: `getExperimentPartitions experiment => ${experimentId}` });
    const experiment: Experiment = await this.findOne(experimentId, logger);
    return experiment?.partitions;
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
    const [conditionIds, decisionPointsIds] = await Promise.all([
      conditionsUniqueIdentifier,
      decisionPointsUniqueIdentifier,
    ]);
    return [...conditionIds, ...decisionPointsIds];
  }

  public async prepareStateTimeLogDoc(
    experimentDoc: Experiment,
    fromState: EXPERIMENT_STATE,
    toState: EXPERIMENT_STATE
  ) {
    const stateTimeLogDoc = new StateTimeLog();
    stateTimeLogDoc.id = uuid();
    stateTimeLogDoc.fromState = fromState;
    stateTimeLogDoc.toState = toState;
    stateTimeLogDoc.timeLog = new Date();
    stateTimeLogDoc.experiment = experimentDoc;
    return stateTimeLogDoc;
  }

  public async updateState(
    experimentId: string,
    state: EXPERIMENT_STATE,
    user: UserDTO,
    logger: UpgradeLogger,
    scheduleDate?: Date,
    entityManager?: EntityManager
  ): Promise<Experiment> {
    const oldExperiment = await this.experimentRepository.findOne({
      where: { id: experimentId },
      relations: ['stateTimeLogs', 'partitions', 'queries', 'queries.metric'],
    });
    await this.clearExperimentCacheDetail(
      oldExperiment.context[0],
      oldExperiment.partitions.map((partition) => {
        return { site: partition.site, target: partition.target };
      })
    );

    if (
      (state === EXPERIMENT_STATE.ENROLLING || state === EXPERIMENT_STATE.PREVIEW) &&
      oldExperiment.state !== EXPERIMENT_STATE.ENROLLMENT_COMPLETE
    ) {
      await this.populateExclusionTable(experimentId, state, logger);
    }

    if (state === EXPERIMENT_STATE.ARCHIVED) {
      const queryIds = oldExperiment.queries.map((query) => query.id);
      const results = await this.queryService.analyze(queryIds, logger);
      const archivedStatsData: Array<Omit<ArchivedStats, 'createdAt' | 'updatedAt' | 'versionNumber'>> = results.map(
        (result) => {
          const queryId = result.id;
          delete result.id;
          const archivedStats: Partial<ArchivedStats> = {
            id: uuid(),
            result: result,
            query: queryId,
          };
          return archivedStats;
        }
      );
      await this.archivedStatsRepository.saveRawJson(archivedStatsData);
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
    await this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.EXPERIMENT_STATE_CHANGED, data, user, entityManager);

    const stateTimeLogDoc = await this.prepareStateTimeLogDoc(oldExperiment, oldExperiment.state, state);

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
      startOn: updatedState[0].startOn,
      stateTimeLogs: [...oldExperiment.stateTimeLogs, updatedStateTimeLog],
    };
  }

  public async importExperiment(
    experimentFiles: ExperimentFile[],
    user: UserDTO,
    logger: UpgradeLogger
  ): Promise<ValidatedExperimentError[]> {
    const validatedExperiments = await this.validateExperiments(experimentFiles, logger);

    const nonErrorExperiments = experimentFiles.filter((file) => {
      // Find the corresponding validation error entry for the file
      const errorEntry = validatedExperiments.find((errorFile) => errorFile.fileName === file.fileName);
      // if error starts with Warning or null is should pass
      return !errorEntry || !errorEntry.error || errorEntry.error.startsWith('Warning');
    });
    const experiments = nonErrorExperiments.map((experimentFile) => {
      let experiment = JSON.parse(experimentFile.fileContent);
      experiment = this.autoFillSomeMissingProperties(experiment);
      experiment = this.deduceExperimentDetails(experiment);
      return experiment;
    });
    for (const experiment of experiments) {
      const duplicateExperiment = await this.experimentRepository.findOneBy({ id: experiment.id });
      if (duplicateExperiment && experiment.id) {
        const error = new Error('Duplicate experiment');
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }
      let experimentDecisionPoints = experiment.partitions;
      // Remove the decision points which already exist
      for (const decisionPoint of experimentDecisionPoints) {
        const decisionPointExists = await this.decisionPointRepository.findOneBy({ id: decisionPoint.id });
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

      // Always set the imported experiment to "inactive".
      experiment.state = EXPERIMENT_STATE.INACTIVE;
    }
    await this.addBulkExperiments(experiments, user, logger);
    return validatedExperiments;
  }

  public async exportExperiment(experimentIds: string[], user: UserDTO, logger: UpgradeLogger): Promise<Experiment[]> {
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
        'partitions.conditionPayloads',
        'partitions.conditionPayloads.parentCondition',
        'factors',
        'factors.levels',
        'conditions.conditionPayloads',
        'conditions.levelCombinationElements',
        'conditions.levelCombinationElements.level',
        'stratificationFactor',
      ],
    });
    const formattedExperiments = experimentDetails.map((experiment) => {
      experiment.backendVersion = env.app.version;
      this.experimentAuditLogRepository.saveRawJson(
        LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED,
        { experimentName: experiment.name },
        user
      );
      return this.reducedConditionPayload(this.formatingPayload(this.formatingConditionPayload(experiment)));
    });

    return formattedExperiments;
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

  private async getValidMoniteredDecisionPoints(excludeIfReachedDecisionPoints) {
    return await this.monitoredDecisionPointRepository.find({
      relations: ['user'],
      where: {
        site: In(excludeIfReachedDecisionPoints.map((x) => x.site)),
        target: In(excludeIfReachedDecisionPoints.map((x) => x.target)),
      },
    });
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
    const excludeIfReachedDecisionPoints = experiment.partitions
      .filter((partition) => {
        return partition.excludeIfReached;
      })
      .map(({ site, target }) => {
        return { site: site, target: target };
      });
    // get all preview usersData
    const previewUsers = await this.previewUserService.find(logger);

    // query all monitored experiment point for this experiment Id
    let monitoredDecisionPoints: MonitoredDecisionPoint[] = [];
    if (state === EXPERIMENT_STATE.ENROLLING) {
      monitoredDecisionPoints = await this.getValidMoniteredDecisionPoints(excludeIfReachedDecisionPoints);
    } else if (state === EXPERIMENT_STATE.PREVIEW) {
      const previewUsersIds = previewUsers.map((user) => user.id);
      if (previewUsersIds.length > 0) {
        monitoredDecisionPoints = await this.getValidMoniteredDecisionPoints(excludeIfReachedDecisionPoints);
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

    if (
      consistencyRule === CONSISTENCY_RULE.INDIVIDUAL ||
      consistencyRule === CONSISTENCY_RULE.GROUP ||
      experiment.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS
    ) {
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

  private checkConditionCodeDefault(conditions: ConditionValidator[]): any {
    // Check for conditionCode is 'default' then return error:
    const hasDefaultConditionCode = conditions.filter(
      (condition) => condition.conditionCode?.toUpperCase() === 'DEFAULT'
    );
    if (hasDefaultConditionCode.length) {
      // TODO remove this validation in the class validator end
      throw new BadRequestError("'default' as ConditionCode is not allowed.");
    }
  }

  private async updateExperimentInDB(
    experiment: ExperimentDTO,
    user: UserDTO,
    logger: UpgradeLogger
  ): Promise<Experiment> {
    await this.clearExperimentCacheDetail(
      experiment.context[0],
      experiment.partitions.map((partition) => {
        return { site: partition.site, target: partition.target };
      })
    );

    // get old experiment document
    const oldExperiment = await this.findOne(experiment.id, logger);
    const oldConditions = oldExperiment.conditions;
    const oldDecisionPoints = oldExperiment.partitions;
    const oldQueries = oldExperiment.queries;
    const oldConditionPayloads = oldExperiment.conditionPayloads;

    // create schedules to start experiment and end experiment
    if (this.scheduledJobService) {
      this.scheduledJobService.updateExperimentSchedules(experiment as any, logger);
    }

    return this.dataSource
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

        const {
          conditions,
          partitions: decisionPoints,
          factors,
          conditionPayloads,
          queries,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // versionNumber,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // createdAt,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // updatedAt,
          experimentSegmentInclusion,
          experimentSegmentExclusion,
          ...expDoc
        } = experiment;

        let experimentDoc: Experiment;
        try {
          experimentDoc = await transactionalEntityManager.getRepository(Experiment).save(expDoc);
          // Store state time log for the experiment
          const stateTimeLogDoc = await this.prepareStateTimeLogDoc(
            experimentDoc,
            oldExperiment.state,
            experimentDoc.state
          );
          await transactionalEntityManager.getRepository(StateTimeLog).save(stateTimeLogDoc);
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = `Error in updating experiment document "updateExperimentInDB"`;
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }

        experimentDoc.experimentSegmentInclusion = oldExperiment.experimentSegmentInclusion;
        const segmentIncludeData = this.includeExcludeSegmentCreation(
          experimentSegmentInclusion,
          experimentDoc.experimentSegmentInclusion,
          experiment.id,
          experiment.context,
          true
        );

        experimentDoc.experimentSegmentExclusion = oldExperiment.experimentSegmentExclusion;
        const segmentExcludeData = this.includeExcludeSegmentCreation(
          experimentSegmentExclusion,
          experimentDoc.experimentSegmentExclusion,
          experiment.id,
          experiment.context,
          false
        );

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
        const conditionDocToSave: Array<Partial<Omit<ExperimentCondition, 'levelCombinationElements'>>> =
          (conditions &&
            conditions.length > 0 &&
            conditions.map((condition: ConditionValidator) => {
              condition.id = condition.id || uuid();
              return { ...condition, experiment: experimentDoc };
            })) ||
          [];

        const conditionPayloadDocToSave: Array<Partial<Omit<ConditionPayload, 'parentCondition' | 'decisionPoint'>>> =
          (conditionPayloads &&
            conditionPayloads.length > 0 &&
            conditionPayloads.map((conditionPayload) => {
              const conditionPayloadToReturn = {
                id: conditionPayload.id,
                payloadType: conditionPayload.payload.type,
                payloadValue: conditionPayload.payload.value,
                parentCondition: conditionPayload.parentCondition,
                decisionPoint: conditionPayload.decisionPoint,
              };
              return conditionPayloadToReturn;
            })) ||
          [];

        // creating decision point docs
        let promiseArray = [];
        const decisionPointDocToSave =
          (decisionPoints &&
            decisionPoints.length > 0 &&
            decisionPoints.map((decisionPoint: PartitionValidator) => {
              promiseArray.push(
                this.decisionPointRepository.findOne({
                  where: {
                    site: decisionPoint.site,
                    target: decisionPoint.target,
                  },
                })
              );
              decisionPoint.id = decisionPoint.id || uuid();
              return { ...decisionPoint, experiment: experimentDoc };
            })) ||
          [];

        // creating queries docs
        promiseArray = [];
        let queriesDocToSave =
          (queries?.[0] &&
            queries.length > 0 &&
            queries.map((query: any) => {
              promiseArray.push(this.metricRepository.findOne({ where: { key: query.metric.key } }));
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            toDeleteDecisionPoints.push(
              this.decisionPointRepository.deleteDecisionPoint(id, transactionalEntityManager)
            );
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

        // delete condition payloads which don't exist in new experiment document
        const toDeleteConditionPayloads = [];
        oldConditionPayloads.forEach(({ id }) => {
          if (
            !conditionPayloadDocToSave.find((doc) => {
              return doc.id === id;
            })
          ) {
            toDeleteConditionPayloads.push(this.conditionPayloadRepository.deleteConditionPayload(id, logger));
          }
        });

        // delete old decision points, conditions and queries
        await Promise.all([
          ...toDeleteConditions,
          ...toDeleteDecisionPoints,
          ...toDeleteQueries,
          transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from(Factor)
            .where('experiment IN (:...ids)', { ids: [experimentDoc.id] })
            .execute(),
          transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from(LevelCombinationElement)
            .where('condition IN (:...ids)', { ids: conditionDocToSave.map((x) => x.id) }),
        ]);

        // saving conditions, saving decision points and saving queries
        let conditionDocs: ExperimentCondition[];
        let decisionPointDocs: DecisionPoint[];
        let queryDocs: Query[];
        let conditionPayloadDocs: ConditionPayloadDTO[];
        try {
          [conditionDocs, decisionPointDocs, queryDocs] = await Promise.all([
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
                return this.decisionPointRepository.upsertDecisionPoint(
                  await decisionPointDoc,
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
        } catch (err) {
          const error = err as Error;
          error.message = `Error in creating conditions, decision points, queries "updateExperimentInDB"`;
          logger.error(error);
          throw error;
        }

        try {
          [conditionPayloadDocs] = await Promise.all([
            Promise.all(
              conditionPayloadDocToSave.map(async (conditionPayload) => {
                return this.conditionPayloadRepository.upsertConditionPayload(
                  conditionPayload,
                  transactionalEntityManager
                );
              })
            ) as any,
          ]);
        } catch (err) {
          const error = err as Error;
          error.message = `Error in creating conditionPayloads "updateExperimentInDB"`;
          logger.error(error);
          throw error;
        }

        let conditionDocToReturn = conditionDocs.map((conditionDoc) => {
          return { ...conditionDoc, experiment: conditionDoc.experiment };
        });

        const decisionPointDocToReturn = decisionPointDocs.map((decisionPointDoc) => {
          return { ...decisionPointDoc, experiment: decisionPointDoc.experiment };
        });

        const conditionPayloadDocToReturn = await transactionalEntityManager.getRepository(ConditionPayload).find({
          relations: ['parentCondition', 'decisionPoint'],
          where: { id: In(conditionPayloadDocs.map((conditionPayload) => conditionPayload.id)) },
        });

        let factorDocToReturn = [];
        if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
          const [factorDoc, levelDoc, levelCombinationElementDoc] = await this.addFactorialDataInDB(
            factors,
            conditionDocToSave as any[],
            experimentDoc,
            transactionalEntityManager,
            logger
          );
          factorDocToReturn = this.formatingFactorAndLevels(factorDoc, levelDoc);
          conditionDocToReturn = this.formatingElements(conditionDocToReturn, levelCombinationElementDoc, levelDoc);
        }

        const queryDocToReturn =
          !!queryDocs &&
          queryDocs.map((queryDoc, index) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { metricKey, ...rest } = queryDoc as any;
            return { ...rest, metric: queriesDocToSave[index].metric };
          });

        const newExperiment = {
          ...experimentDoc,
          conditions: conditionDocToReturn as any,
          partitions: decisionPointDocToReturn as any,
          factors: factorDocToReturn as any,
          conditionPayloads: conditionPayloadDocToReturn as any,
          queries: (queryDocToReturn as any) || [],
        };
        const updatedExperiment = this.formatingPayload(newExperiment);

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
        const newExperimentClone = JSON.parse(JSON.stringify(updatedExperiment));
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
        logger.info({ message: 'Updated experiment:', details: updatedExperiment });
        // add AuditLogs here
        const updateAuditLog: AuditLogData = {
          experimentId: experiment.id,
          experimentName: experiment.name,
          diff: diffString(newExperimentClone, oldExperimentClone),
        };

        await this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.EXPERIMENT_UPDATED, updateAuditLog, user);
        return { updatedExperiment, toDeleteQueriesDoc };
      })
      .then(async ({ updatedExperiment }) => {
        return updatedExperiment;
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
    // TODO: remove twoCharacterId code entirely
    // eslint-disable-next-line no-constant-condition
    while (true) {
      identifier = Math.random().toString(36).substring(2, 4).toUpperCase();
      if (uniqueIdentifiers.indexOf(identifier) === -1) {
        break;
      }
    }
    return identifier;
  }

  private setConditionOrPartitionIdentifiers(
    data: ConditionValidator[] | PartitionValidator[],
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

  private async addExperimentInDB(
    experiment: ExperimentDTO,
    user: UserDTO,
    logger: UpgradeLogger
  ): Promise<Experiment> {
    await this.clearExperimentCacheDetail(
      experiment.context[0],
      experiment.partitions.map((partition) => {
        return { site: partition.site, target: partition.target };
      })
    );
    const createdExperiment = await this.dataSource.transaction(async (transactionalEntityManager) => {
      experiment.id = experiment.id || uuid();
      experiment.description = experiment.description || '';

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
      const {
        conditions,
        partitions,
        factors,
        queries,
        experimentSegmentInclusion,
        experimentSegmentExclusion,
        conditionPayloads,
        ...expDoc
      } = experiment;
      // Check for conditionCode is 'default' then return error:
      this.checkConditionCodeDefault(conditions);

      // saving experiment docs
      let experimentDoc: Experiment;
      try {
        experimentDoc = await transactionalEntityManager.getRepository(Experiment).save(expDoc);
        // Store state time log for the experiment in enrolling state.
        if (experimentDoc.state !== EXPERIMENT_STATE.INACTIVE) {
          const stateTimeLogDoc = await this.prepareStateTimeLogDoc(
            experimentDoc,
            EXPERIMENT_STATE.INACTIVE,
            experimentDoc.state
          );
          await transactionalEntityManager.getRepository(StateTimeLog).save(stateTimeLogDoc);
        }
      } catch (err) {
        const error = err as ErrorWithType;
        error.details = 'Error in adding experiment in DB';
        error.type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }
      let includeSegmentExists = true;
      let segmentIncludeDoc: Segment;
      let segmentIncludeDocToSave: Partial<ExperimentSegmentInclusion> = {};
      if (experimentSegmentInclusion) {
        // creating Include Segment
        let segmentInclude;
        if (experimentSegmentInclusion?.segment) {
          const includeSegment = experimentSegmentInclusion.segment;
          segmentInclude = {
            ...experimentSegmentInclusion.segment,
            type: includeSegment.type,
            userIds: includeSegment.individualForSegment?.map((x) => x.userId) || [],
            groups:
              includeSegment.groupForSegment?.map((x) => {
                return { type: x.type, groupId: x.groupId };
              }) || [],
            subSegmentIds: includeSegment.subSegments?.map((x) => x.id) || [],
          };
        } else {
          segmentInclude = experimentSegmentInclusion;
        }

        const segmentIncludeData: SegmentInputValidator = {
          ...segmentInclude,
          id: segmentInclude.id || uuid(),
          name: experiment.id + ' Inclusion Segment',
          description: experiment.id + ' Inclusion Segment',
          context: experiment.context[0],
          type: SEGMENT_TYPE.PRIVATE,
        };
        try {
          segmentIncludeDoc = await this.segmentService.upsertSegment(segmentIncludeData, logger);
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = 'Error in adding segment in DB';
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }
        // creating segmentInclude doc
        const includeTempDoc = new ExperimentSegmentInclusion();
        includeTempDoc.segment = segmentIncludeDoc;
        includeTempDoc.experiment = experimentDoc;
        segmentIncludeDocToSave = this.getSegmentDoc(includeTempDoc);
      } else {
        includeSegmentExists = false;
      }

      let excludeSegmentExists = true;
      let segmentExcludeDoc: Segment;
      let segmentExcludeDocToSave: Partial<ExperimentSegmentExclusion> = {};
      if (experimentSegmentExclusion) {
        // creating Exclude Segment
        let segmentExclude;
        if (experimentSegmentExclusion?.segment) {
          const excludeSegment = experimentSegmentExclusion.segment;
          segmentExclude = {
            ...experimentSegmentExclusion.segment,
            type: excludeSegment.type,
            userIds: excludeSegment.individualForSegment?.map((x) => x.userId) || [],
            groups:
              excludeSegment.groupForSegment?.map((x) => {
                return { type: x.type, groupId: x.groupId };
              }) || [],
            subSegmentIds: excludeSegment.subSegments?.map((x) => x.id) || [],
          };
        } else {
          segmentExclude = experimentSegmentExclusion;
        }

        const segmentExcludeData: SegmentInputValidator = {
          ...segmentExclude,
          id: segmentExclude.id || uuid(),
          name: experiment.id + ' Exclusion Segment',
          description: experiment.id + ' Exclusion Segment',
          context: experiment.context[0],
          type: SEGMENT_TYPE.PRIVATE,
        };
        try {
          segmentExcludeDoc = await this.segmentService.upsertSegment(segmentExcludeData, logger);
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = 'Error in adding segment in DB';
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }
        // creating segmentExclude doc
        const excludeTempDoc = new ExperimentSegmentExclusion();
        excludeTempDoc.segment = segmentExcludeDoc;
        excludeTempDoc.experiment = experimentDoc;
        segmentExcludeDocToSave = this.getSegmentDoc(excludeTempDoc);
      } else {
        excludeSegmentExists = false;
      }

      // creating condition docs
      const conditionDocsToSave: Array<Partial<Omit<ExperimentCondition, 'levelCombinationElements'>>> =
        conditions &&
        conditions.length > 0 &&
        conditions.map((condition: ConditionValidator) => {
          condition.id = condition.id || uuid();
          return { ...condition, experiment: experimentDoc };
        });

      // creating decision point docs
      const decisionPointDocsToSave: Array<Partial<DecisionPoint>> =
        partitions &&
        partitions.length > 0 &&
        partitions.map((decisionPoint) => {
          decisionPoint.id = decisionPoint.id || uuid();
          decisionPoint.description = decisionPoint.description || '';
          return { ...decisionPoint, experiment: experimentDoc };
        });

      if (!conditionPayloads) {
        experiment = { ...experiment, conditionPayloads: [] };
      }
      const conditionPayloadDocToSave: Array<Partial<Omit<ConditionPayload, 'parentCondition' | 'decisionPoint'>>> =
        (conditionPayloads &&
          conditionPayloads.length > 0 &&
          conditionPayloads.map((conditionPayload) => {
            const conditionPayloadToReturn = {
              id: conditionPayload.id,
              payloadType: conditionPayload.payload.type,
              payloadValue: conditionPayload.payload.value,
              parentCondition: conditions.find((doc) => doc.id === conditionPayload.parentCondition),
              decisionPoint: partitions.find((doc) => doc.id === conditionPayload?.decisionPoint),
            };
            return conditionPayloadToReturn;
          })) ||
        [];

      // creating queries docs
      const promiseArray = [];
      let queryDocsToSave =
        (queries &&
          queries.length > 0 &&
          queries[0] &&
          queries.map((query: any) => {
            promiseArray.push(this.metricRepository.findOne({ where: { key: query.metric.key } }));
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      let conditionPayloadDoc: ConditionPayload[];
      let queryDocs: any;
      try {
        [
          conditionDocs,
          decisionPointDocs,
          experimentSegmentInclusionDoc,
          experimentSegmentExclusionDoc,
          conditionPayloadDoc,
          queryDocs,
        ] = await Promise.all([
          this.experimentConditionRepository.insertConditions(conditionDocsToSave, transactionalEntityManager),
          this.decisionPointRepository.insertDecisionPoint(decisionPointDocsToSave, transactionalEntityManager),
          includeSegmentExists
            ? this.experimentSegmentInclusionRepository.insertData(
                segmentIncludeDocToSave,
                logger,
                transactionalEntityManager
              )
            : (Promise.resolve([]) as any),
          excludeSegmentExists
            ? this.experimentSegmentExclusionRepository.insertData(
                segmentExcludeDocToSave,
                logger,
                transactionalEntityManager
              )
            : (Promise.resolve([]) as any),
          conditionPayloadDocToSave.length > 0
            ? this.conditionPayloadRepository.insertConditionPayload(
                conditionPayloadDocToSave,
                transactionalEntityManager
              )
            : (Promise.resolve([]) as any),
          queryDocsToSave.length > 0
            ? this.queryRepository.insertQueries(queryDocsToSave, transactionalEntityManager)
            : (Promise.resolve([]) as any),
        ]);
      } catch (err) {
        const error = err as Error;
        error.message = `Error in creating conditions, decision points, conditionPayloads and queries "addExperimentInDB"`;
        logger.error(error);
        throw error;
      }
      let conditionDocToReturn = conditionDocs.map((conditionDoc) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { experimentId, ...restDoc } = conditionDoc as any;
        return restDoc;
      });
      const decisionPointDocToReturn = decisionPointDocs.map((decisionPointDoc) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { experimentId, ...restDoc } = decisionPointDoc as any;
        return restDoc;
      });

      const conditionPayloadDocToReturn = await transactionalEntityManager.getRepository(ConditionPayload).find({
        relations: ['parentCondition', 'decisionPoint'],
        where: { id: In(conditionPayloadDoc.map((conditionPayload) => conditionPayload.id)) },
      });

      let queryDocToReturn = [];
      if (queryDocs.length > 0) {
        queryDocToReturn = queryDocsToSave;
      }

      let factorDocToReturn = [];
      if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
        const [factorDoc, levelDoc, levelCombinationElementDoc] = await this.addFactorialDataInDB(
          factors,
          conditions,
          experimentDoc,
          transactionalEntityManager,
          logger
        );
        factorDocToReturn = this.formatingFactorAndLevels(factorDoc, levelDoc);
        conditionDocToReturn = this.formatingElements(conditionDocToReturn, levelCombinationElementDoc, levelDoc);
      }
      let newExperimentObject;
      if (experimentDoc.experimentSegmentInclusion && experimentDoc.experimentSegmentExclusion) {
        newExperimentObject = {
          ...experimentDoc,
          conditions: conditionDocToReturn as any,
          partitions: decisionPointDocToReturn as any,
          factors: factorDocToReturn as any,
          experimentSegmentInclusion: { ...experimentSegmentInclusionDoc, segment: segmentIncludeDoc } as any,
          experimentSegmentExclusion: { ...experimentSegmentExclusionDoc, segment: segmentExcludeDoc } as any,
          conditionPayloads: conditionPayloadDocToReturn as any,
          queries: (queryDocToReturn as any) || [],
        };
      } else {
        newExperimentObject = {
          ...experimentDoc,
          conditions: conditionDocToReturn as any,
          partitions: decisionPointDocToReturn as any,
          factors: factorDocToReturn as any,
          conditionPayloads: conditionPayloadDocToReturn as any,
          queries: (queryDocToReturn as any) || [],
        };
      }
      const newExperiment = newExperimentObject;
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
    await this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.EXPERIMENT_CREATED, createAuditLogData, user);
    return this.reducedConditionPayload(this.formatingPayload(createdExperiment));
  }

  public async validateExperiments(
    experimentFiles: ExperimentFile[],
    logger: UpgradeLogger
  ): Promise<ValidatedExperimentError[]> {
    logger.info({ message: `Validating experiments` });

    const validationErrors = await Promise.allSettled(
      experimentFiles.map(async (experimentFile) => {
        let experiment;
        try {
          experiment = JSON.parse(experimentFile.fileContent);
        } catch (error) {
          return { fileName: experimentFile.fileName, error: 'Invalid JSON' };
        }

        let newExperiment: ExperimentDTO;
        if (compare(experiment.backendVersion, '5.3.0', '>=')) {
          newExperiment = plainToClass(ExperimentDTO, experiment);
        } else {
          newExperiment = plainToClass(ExperimentDTO, this.experimentPayloadConverter(experiment));
        }

        if (!(newExperiment instanceof ExperimentDTO)) {
          return { fileName: experimentFile.fileName, error: 'Invalid JSON' };
        }
        const experimentJSONValidationError = await this.validateExperimentJSON(newExperiment);
        const fileName = experimentFile.fileName;
        try {
          experiment = this.autoFillSomeMissingProperties(experiment);
          experiment = this.deduceExperimentDetails(experiment);

          let versionStatus = 0;
          if (experiment.backendVersion) {
            versionStatus = this.compareVersions(newExperiment.backendVersion, this.backendVersion);
          }

          if (experimentJSONValidationError !== '') {
            // If JSON is not valid, return error message
            return { fileName: fileName, error: experimentJSONValidationError };
          } else if (versionStatus !== 0) {
            // If version is different, return appropriate warning message
            const versionErrorMessage = versionStatus === 1 ? newVersionErrorMessage : oldVersionErrorMessage;
            return { fileName: fileName, error: versionErrorMessage };
          }
          // If JSON is valid and version is the same, return null for no error
          return { fileName: fileName, error: null };
        } catch (error: any) {
          return { fileName: fileName, error: experimentJSONValidationError };
        }
      })
    );

    // Filter out the files that have no errors
    return validationErrors
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const { fileName, error } = result.reason;
          return { fileName: fileName, error: error };
        }
      })
      .filter((error) => error !== null);
  }

  private experimentPayloadConverter(experiment: OldExperimentDTO): ExperimentDTO {
    const updatedExperimentPayload = experiment.conditionPayloads.map((conditionPayload) => {
      return {
        ...conditionPayload,
        parentCondition: conditionPayload.parentCondition.id,
        decisionPoint: conditionPayload.decisionPoint.id,
      };
    });

    const newExperiment: ExperimentDTO = { ...experiment, conditionPayloads: updatedExperimentPayload };
    return newExperiment;
  }

  private async validateExperimentJSON(experiment: ExperimentDTO): Promise<string> {
    let errorString = '';
    await validate(experiment).then((errors) => {
      if (errors.length > 0) {
        errors.forEach((error) => {
          let validationError = error.toString();
          validationError = validationError.replace(errorRemovePart, '');
          errorString = errorString + validationError + ', ';
        });
        errorString = errorString.slice(0, -2);
      }
    });

    if (experiment.stratificationFactor?.stratificationFactorName) {
      const factorFound = await this.stratificationRepository.findOneBy({
        stratificationFactorName: experiment.stratificationFactor.stratificationFactorName,
      });
      if (!factorFound) {
        errorString =
          errorString +
          'Missing Stratification Factor ' +
          experiment.stratificationFactor.stratificationFactorName +
          '. ' +
          stratificationErrorMessage;
      }
    }
    return errorString;
  }

  private deduceExperimentDetails(experiment: ExperimentDTO): ExperimentDTO {
    experiment.id = uuid();
    this.deduceFactors(experiment);
    this.deduceConditions(experiment);
    this.deducePartition(experiment);
    this.deduceConditionPayload(experiment);
    this.deduceParticipants(experiment);
    this.deduceQueries(experiment);
    return experiment;
  }

  autoFillSomeMissingProperties(experiment): ExperimentDTO {
    // modify conditionPayloads to support older exported experiments
    if (experiment.conditionPayloads) {
      experiment.conditionPayloads.forEach((conditionPayload) => {
        if (typeof conditionPayload.parentCondition === 'object') {
          conditionPayload.parentCondition = conditionPayload.parentCondition.id;
        }
        if (typeof conditionPayload.decisionPoint === 'object') {
          conditionPayload.decisionPoint = conditionPayload.decisionPoint?.id;
        }
      });
    }

    return {
      ...experiment,
      backendVersion: experiment.backendVersion || this.backendVersion.toString(),
      filterMode: experiment.filterMode || FILTER_MODE.EXCLUDE_ALL,
    };
  }

  deduceConditions(result) {
    result.conditions.forEach((condition) => {
      this.allIdMap[condition.id] = uuid();
      condition.id = this.allIdMap[condition.id];
      condition.levelCombinationElements.forEach((lce) => {
        lce.id = uuid();
        lce.level.id = this.allIdMap[lce.level.id];
      });
    });
    if (result.revertTo && this.allIdMap[result.revertTo]) {
      result.revertTo = this.allIdMap[result.revertTo];
    }
  }

  deduceConditionPayload(result) {
    if (result.conditionAliases) {
      result.conditionPayloads = result.conditionAliases;
      result.conditionAliases.forEach((payload, payloadIndex) => {
        result.conditionPayloads[payloadIndex].payload = {};
        result.conditionPayloads[payloadIndex].payload.type = 'string';
        result.conditionPayloads[payloadIndex].payload.value = payload.aliasName;
      });
      delete result.conditionAliases;
    }
    result.conditionPayloads.forEach((conditionPayload) => {
      conditionPayload.id = uuid();
      conditionPayload.parentCondition = this.allIdMap[conditionPayload.parentCondition];
      if (conditionPayload.decisionPoint) {
        conditionPayload.decisionPoint = this.allIdMap[conditionPayload.decisionPoint];
      }
    });

    return result;
  }

  deducePartition(result) {
    result.partitions.forEach((decisionPoint, decisionPointIndex) => {
      this.allIdMap[decisionPoint.id] = uuid();
      decisionPoint.id = this.allIdMap[decisionPoint.id];
      if (decisionPoint.expPoint) {
        result.partitions[decisionPointIndex].site = decisionPoint.expPoint;
        delete result.partitions[decisionPointIndex].expPoint;
      }

      if (decisionPoint.expId) {
        result.partitions[decisionPointIndex].target = decisionPoint.expId;
        delete result.partitions[decisionPointIndex].expId;
      }

      if (decisionPoint.factors) {
        result.partitions[decisionPointIndex].factors.forEach((factor) => {
          result.factors.push(factor);
        });
        delete result.partitions[decisionPointIndex].factors;
      }
    });

    return result;
  }

  deduceFactors(result) {
    result.factors.forEach((factor, factorIndex) => {
      factor.id = uuid();
      factor.levels.forEach((level, levelIndex) => {
        this.allIdMap[level.id] = uuid();
        level.id = this.allIdMap[level.id];
        if (level.alias) {
          result.factors[factorIndex].levels[levelIndex].payload = {};
          result.factors[factorIndex].levels[levelIndex].payload.type = 'string';
          result.factors[factorIndex].levels[levelIndex].payload.value = level.alias;
          delete result.factors[factorIndex].levels[levelIndex].alias;
        }
      });
    });
  }

  deduceParticipants(result) {
    if (!result.experimentSegmentInclusion) {
      result.experimentSegmentInclusion = {
        segment: {
          individualForSegment: [],
          groupForSegment: [],
          subSegments: [],
          type: SEGMENT_TYPE.PRIVATE,
        },
      };
    }
    result.experimentSegmentInclusion.segment.id = uuid();

    if (!result.experimentSegmentExclusion) {
      result.experimentSegmentExclusion = {
        segment: {
          individualForSegment: [],
          groupForSegment: [],
          subSegments: [],
          type: SEGMENT_TYPE.PRIVATE,
        },
      };
    }
    result.experimentSegmentExclusion.segment.id = uuid();
  }

  deduceQueries(result) {
    result.queries.forEach((query) => {
      query.id = uuid();
    });
  }

  private compareVersions(version1: string, version2: string): number {
    version1 = version1
      .split('.')
      .map((s) => s.padStart(10))
      .join('.');
    version2 = version2
      .split('.')
      .map((s) => s.padStart(10))
      .join('.');

    if (version1 === version2) {
      return 0;
    } else if (version1 > version2) {
      return 1;
    } else {
      return -1;
    }
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

  private async addBulkExperiments(
    experiments: ExperimentDTO[],
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<Experiment[]> {
    const createdExperiments = [];
    for (const exp of experiments) {
      try {
        const result = await this.create(exp, currentUser, logger);
        createdExperiments.push(result);
      } catch (err) {
        const error = err as Error;
        error.message = `Error in creating experiment document "addBulkExperiments"`;
        logger.error(error);
        throw error;
      }
    }
    return createdExperiments;
  }

  public formatingConditionPayload(experiment: Experiment): Experiment {
    if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
      const conditionPayload: ConditionPayload[] = [];
      experiment.conditions.forEach((condition) => {
        const conditionPayloads = condition.conditionPayloads.map((conditionPayload) => {
          return { ...conditionPayload, parentCondition: condition };
        });
        conditionPayload.push(...conditionPayloads);
        delete condition.conditionPayloads;
      });

      return { ...experiment, conditionPayloads: conditionPayload };
    }

    const { conditions, partitions } = experiment;

    const conditionPayload: ConditionPayload[] = [];
    partitions.forEach((partition) => {
      const conditionPayloadData = partition.conditionPayloads;
      delete partition.conditionPayloads;

      conditionPayloadData.forEach((x) => {
        if (x && conditions.filter((con) => con.id === x.parentCondition.id).length > 0) {
          conditionPayload.push({ ...x, decisionPoint: partition });
        }
      });
    });
    return { ...experiment, conditionPayloads: conditionPayload };
  }

  public reducedConditionPayload(experiment: Experiment): any {
    const updatedCP = experiment.conditionPayloads.map((conditionPayload) => {
      return {
        ...conditionPayload,
        parentCondition: conditionPayload.parentCondition.id,
        decisionPoint: conditionPayload.decisionPoint?.id,
      };
    });
    return { ...experiment, conditionPayloads: updatedCP };
  }

  public formatingPayload(experiment: Experiment): any {
    const updatedConditionPayloads = experiment.conditionPayloads.map((conditionPayload) => {
      const { payloadType, payloadValue, ...rest } = conditionPayload;
      return {
        ...rest,
        payload: { type: payloadType, value: payloadValue },
      };
    });

    const updatedFactors: FactorDTO[] = experiment.factors.map((factor) => {
      const updatedLevels: LevelDTO[] = factor.levels.map((level) => {
        const { payloadType, payloadValue, ...rest } = level;
        return { ...rest, payload: { type: payloadType, value: payloadValue } };
      });
      const { createdAt, updatedAt, versionNumber, experiment, ...rest } = factor;
      return { ...rest, levels: updatedLevels };
    });

    return { ...experiment, factors: updatedFactors, conditionPayloads: updatedConditionPayloads };
  }

  public includeExcludeSegmentCreation(
    experimentSegment: ParticipantsValidator,
    experimentDocSegmentData: ExperimentSegmentInclusion | ExperimentSegmentExclusion,
    experimentId: string,
    context: string[],
    isIncludeMode: boolean
  ) {
    const currentData = experimentSegment.segment
      ? {
          ...experimentSegment.segment,
          userIds: experimentSegment.segment.individualForSegment.map((user) => user.userId),
          groups: experimentSegment.segment.groupForSegment.map((group) => {
            return { groupId: group.groupId, type: group.type };
          }),
          subSegmentIds: experimentSegment.segment.subSegments.map((segment) => segment.id),
        }
      : experimentSegment;

    let segment;
    let segmentDataToReturn;
    if (experimentDocSegmentData.segment) {
      segmentDataToReturn = {
        ...currentData,
        id: experimentDocSegmentData.segment.id,
        name: experimentDocSegmentData.segment.name,
        description: experimentDocSegmentData.segment.description,
        context: context[0],
        type: SEGMENT_TYPE.PRIVATE,
      };
    } else {
      segment = experimentDocSegmentData;
      segmentDataToReturn = {
        ...segment,
        id: uuid(),
        name: isIncludeMode ? experimentId + ' Inclusion Segment' : experimentId + ' Exclusion Segment',
        description: isIncludeMode ? experimentId + ' Inclusion Segment' : experimentId + ' Exclusion Segment',
        context: context[0],
      };
    }

    // for test cases:
    if (segmentDataToReturn['subSegmentIds'] === undefined) {
      segmentDataToReturn.subSegmentIds = [];
      segmentDataToReturn.userIds = [];
      segmentDataToReturn.groups = [];
    }

    return segmentDataToReturn;
  }

  private async addFactorialDataInDB(
    factors: FactorValidator[],
    conditions: ConditionValidator[],
    experimentDoc: Experiment,
    transactionalEntityManager: EntityManager,
    logger: UpgradeLogger
  ) {
    const allLevels: Level[] = [];
    const allLevelCombinationElements: Partial<Omit<LevelCombinationElement, 'condition' | 'level'>>[] = [];

    //converting factorDTO to factor
    const normalFactors = factors.map((factor) => {
      const normalLevels = factor.levels.map((level) => {
        const { payload, ...rest } = level;
        return { ...rest, payloadType: payload?.type, payloadValue: payload?.value };
      });
      return { ...factor, levels: normalLevels };
    });

    const allFactors: Array<Partial<Factor>> =
      normalFactors &&
      normalFactors.length > 0 &&
      normalFactors.map((factor) => {
        const factorReturn = {
          id: factor.id || uuid(),
          name: factor.name,
          order: factor.order,
          description: factor.description,
          experiment: experimentDoc,
          levels: [],
        };

        factorReturn.levels = factor.levels.map((level) => {
          return {
            id: level.id || uuid(),
            name: level.name,
            order: level.order,
            description: level.description,
            payloadType: level.payloadType,
            payloadValue: level.payloadValue,
            factor: factorReturn,
          };
        });
        allLevels.push(...factorReturn.levels);
        return factorReturn;
      });

    conditions.forEach((condition) => {
      const array = condition.levelCombinationElements.map((elements) => {
        elements.id = elements.id || uuid();
        // elements.condition = condition;
        return { ...elements, condition: condition };
      });
      allLevelCombinationElements.push(...array);
    });

    let factorDoc: Factor[];
    let levelDoc: Level[];
    let levelCombinationElementsDoc: LevelCombinationElement[];

    try {
      [factorDoc, levelDoc, levelCombinationElementsDoc] = await Promise.all([
        this.factorRepository.insertFactor(allFactors, transactionalEntityManager),
        this.levelRepository.insertLevel(allLevels, transactionalEntityManager),
        this.levelCombinationElementsRepository.insertLevelCombinationElement(
          allLevelCombinationElements,
          transactionalEntityManager
        ),
      ]);
    } catch (err) {
      const error = err as Error;
      error.message = `Error in creating factors & levels`;
      logger.error(error);
      throw error;
    }

    return [factorDoc, levelDoc, levelCombinationElementsDoc];
  }

  private formatingFactorAndLevels(factors, levels): Factor[] {
    const formatedFactors = factors.map((factor) => {
      return { ...factor, levels: levels.filter((x) => x.factorId == factor.id) };
    });

    formatedFactors.forEach((factor) => {
      factor.levels.forEach((level) => {
        delete level.factorId;
      });
      delete factor.experimentId;
    });
    return formatedFactors;
  }

  private formatingElements(conditions, levelCombinationElements, levels): ExperimentCondition[] {
    const formatedData = conditions.map((condition) => {
      return {
        ...condition,
        levelCombinationElements: levelCombinationElements
          .filter((element) => element.conditionId == condition.id)
          .map((element) => {
            return { ...element, level: levels.find((level) => element.levelId === level.id) };
          }),
      };
    });

    formatedData.forEach((condition) => {
      condition.levelCombinationElements.forEach((element) => {
        delete element.conditionId;
        delete element.levelId;
      });
    });
    return formatedData;
  }

  private getSegmentDoc(doc: ExperimentSegmentExclusion | ExperimentSegmentInclusion) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, updatedAt, versionNumber, ...newDoc } = doc;
    return newDoc;
  }

  private async clearExperimentCacheDetail(
    context: string,
    partitions: { site: string; target: string }[]
  ): Promise<void> {
    await this.cacheService.delCache(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + context);
    const deletedCache = partitions.map(async (partition) => {
      await this.cacheService.delCache(CACHE_PREFIX.MARK_KEY_PREFIX + '-' + partition.site + '-' + partition.target);
    });
    await Promise.all(deletedCache);
    return;
  }
}
