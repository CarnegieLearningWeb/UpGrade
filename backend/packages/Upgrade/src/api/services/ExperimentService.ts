/* eslint-disable no-var */
import { GroupExclusion } from './../models/GroupExclusion';
import { ErrorWithType } from './../errors/ErrorWithType';
import { Service } from 'typedi';
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
  LIST_FILTER_MODE,
  EXPERIMENT_LIST_OPERATION,
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
import { MetricService } from './MetricService';
import { MoocletRewardsService } from './MoocletRewardsService';
import { MoocletExperimentRefRepository } from '../repositories/MoocletExperimentRefRepository';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { SegmentRepository } from '../repositories/SegmentRepository';

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
    @InjectRepository() protected experimentRepository: ExperimentRepository,
    @InjectRepository() protected experimentConditionRepository: ExperimentConditionRepository,
    @InjectRepository() protected decisionPointRepository: DecisionPointRepository,
    @InjectRepository() protected experimentAuditLogRepository: ExperimentAuditLogRepository,
    @InjectRepository() protected individualExclusionRepository: IndividualExclusionRepository,
    @InjectRepository() protected groupExclusionRepository: GroupExclusionRepository,
    @InjectRepository() protected monitoredDecisionPointRepository: MonitoredDecisionPointRepository,
    @InjectRepository() protected userRepository: ExperimentUserRepository,
    @InjectRepository() protected metricRepository: MetricRepository,
    @InjectRepository() protected queryRepository: QueryRepository,
    @InjectRepository() protected stateTimeLogsRepository: StateTimeLogsRepository,
    @InjectRepository() protected experimentSegmentInclusionRepository: ExperimentSegmentInclusionRepository,
    @InjectRepository() protected experimentSegmentExclusionRepository: ExperimentSegmentExclusionRepository,
    @InjectRepository() protected segmentRepository: SegmentRepository,
    @InjectRepository() protected conditionPayloadRepository: ConditionPayloadRepository,
    @InjectRepository() protected factorRepository: FactorRepository,
    @InjectRepository() protected levelRepository: LevelRepository,
    @InjectRepository() protected levelCombinationElementsRepository: LevelCombinationElementRepository,
    @InjectRepository() protected archivedStatsRepository: ArchivedStatsRepository,
    @InjectRepository() protected stratificationRepository: StratificationFactorRepository,
    @InjectRepository() protected moocletExperimentRefRepository: MoocletExperimentRefRepository,
    @InjectDataSource() protected dataSource: DataSource,
    protected previewUserService: PreviewUserService,
    protected segmentService: SegmentService,
    protected scheduledJobService: ScheduledJobService,
    protected errorService: ErrorService,
    protected cacheService: CacheService,
    protected queryService: QueryService,
    protected metricService: MetricService,
    protected moocletRewardsService: MoocletRewardsService
  ) {}

  public async find(logger?: UpgradeLogger): Promise<ExperimentDTO[]> {
    if (logger) {
      logger.info({ message: `Find all experiments` });
    }
    const experiments = await this.experimentRepository.findAllExperiments();
    return experiments.map((experiment) => {
      return this.reducedConditionPayload(this.formattingPayload(this.formattingConditionPayload(experiment)));
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
  ): Promise<[Experiment[], number]> {
    logger.info({ message: `Find paginated experiments` });

    let paginatedParentSubQuery = this.experimentRepository
      .createQueryBuilder()
      .subQuery()
      .from(Experiment, 'experiment')
      .select('DISTINCT(experiment.id)')
      .leftJoin('experiment.partitions', 'partitions')
      .orderBy('experiment.id');

    if (searchParams) {
      const whereClause = this.paginatedSearchString(searchParams);
      paginatedParentSubQuery = paginatedParentSubQuery.andWhere(whereClause);
    }
    const countQuery = paginatedParentSubQuery.clone();

    paginatedParentSubQuery = paginatedParentSubQuery.limit(take).offset(skip);

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
      .where(`experiment.id IN ${paginatedParentSubQuery.getQuery()}`);

    if (sortParams) {
      queryBuilderToReturn = queryBuilderToReturn.addOrderBy(`experiment.${sortParams.key}`, sortParams.sortAs);
    } else {
      queryBuilderToReturn = queryBuilderToReturn.addOrderBy('experiment.updatedAt', 'DESC');
    }
    const [experimentData, count] = await Promise.all([queryBuilderToReturn.getMany(), countQuery.getCount()]);
    experimentData.forEach((experiment) => {
      experiment.experimentSegmentExclusion = this.inferListTypesForExperimentListForExperimentRedesignDataChange(
        experiment.experimentSegmentExclusion
      );
      experiment.experimentSegmentInclusion = this.inferListTypesForExperimentListForExperimentRedesignDataChange(
        experiment.experimentSegmentInclusion
      );
    });
    return [experimentData, count];
  }

  public async getSingleExperiment(id: string, logger?: UpgradeLogger): Promise<ExperimentDTO | undefined> {
    const experiment = await this.findOne(id, logger);
    if (experiment) {
      experiment.experimentSegmentExclusion = this.inferListTypesForExperimentListForExperimentRedesignDataChange(
        experiment.experimentSegmentExclusion
      );
      experiment.experimentSegmentInclusion = this.inferListTypesForExperimentListForExperimentRedesignDataChange(
        experiment.experimentSegmentInclusion
      );
      return this.reducedConditionPayload(this.formattingPayload(experiment));
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
      return this.formattingConditionPayload(experiment);
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

  public async getCachedValidExperiments(context: string): Promise<Experiment[]> {
    const cacheKey = CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + context;
    return this.cacheService
      .wrap(cacheKey, this.experimentRepository.getValidExperiments.bind(this.experimentRepository, context))
      .then((validExperiment) => {
        return JSON.parse(JSON.stringify(validExperiment));
      });
  }

  public async create(
    experiment: ExperimentDTO,
    currentUser: UserDTO,
    logger: UpgradeLogger,
    options?: {
      createType?: string;
      existingEntityManager?: EntityManager;
    }
  ): Promise<ExperimentDTO> {
    logger.info({ message: 'Create a new experiment =>', details: experiment });
    const { createType, existingEntityManager } = options || {};
    const entityManager = existingEntityManager || this.dataSource.manager;

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

    const createdExperiment = await this.addExperimentInDB(experiment, currentUser, logger, entityManager);
    const addListPromises = [];
    if (experiment.experimentSegmentExclusion?.length > 0) {
      addListPromises.push(
        ...experiment.experimentSegmentExclusion.map((exclusion) =>
          this.addList(
            this.getListSegment(exclusion, createdExperiment.context),
            createdExperiment.id,
            LIST_FILTER_MODE.EXCLUSION,
            currentUser,
            logger,
            entityManager
          )
        )
      );
    }
    if (experiment.experimentSegmentInclusion?.length > 0) {
      addListPromises.push(
        ...experiment.experimentSegmentInclusion.map((inclusion) =>
          this.addList(
            this.getListSegment(inclusion, createdExperiment.context),
            createdExperiment.id,
            LIST_FILTER_MODE.INCLUSION,
            currentUser,
            logger,
            entityManager
          )
        )
      );
      await Promise.all(addListPromises);
    }

    return createdExperiment;
  }

  public async delete(
    experimentId: string,
    currentUser: UserDTO,
    options?: { logger?: UpgradeLogger; existingEntityManager?: EntityManager }
  ): Promise<Experiment | undefined> {
    const { logger, existingEntityManager } = options;
    if (logger) {
      logger.info({ message: `Delete experiment =>  ${experimentId}` });
    }
    const entityManager = existingEntityManager || this.dataSource.manager;
    return await entityManager.transaction(async (transactionalEntityManager) => {
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

        await Promise.all(
          experiment.experimentSegmentInclusion.map(async (segmentInclusion) => {
            try {
              await transactionalEntityManager.getRepository(Segment).delete(segmentInclusion.segment.id);
            } catch (err) {
              const error = err as ErrorWithType;
              error.details = 'Error in deleting Experiment Included Segment from DB';
              error.type = SERVER_ERROR.QUERY_FAILED;
              logger.error(error);
              throw error;
            }
          })
        );
        await Promise.all(
          experiment.experimentSegmentExclusion.map(async (segmentExclusion) => {
            try {
              await transactionalEntityManager.getRepository(Segment).delete(segmentExclusion.segment.id);
            } catch (err) {
              const error = err as ErrorWithType;
              error.details = 'Error in deleting Experiment Excluded Segment from DB';
              error.type = SERVER_ERROR.QUERY_FAILED;
              logger.error(error);
              throw error;
            }
          })
        );
        return deletedExperiment;
      }
      return undefined;
    });
  }

  public async update(
    experiment: ExperimentDTO,
    currentUser: UserDTO,
    logger: UpgradeLogger,
    entityManager?: EntityManager
  ): Promise<ExperimentDTO> {
    if (logger) {
      logger.info({ message: `Update the experiment`, details: experiment });
    }
    return this.reducedConditionPayload(
      await this.updateExperimentInDB(experiment, currentUser, logger, entityManager)
    );
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

    // Exclude the user only when the experiment is enrolling. For Preview state we don't need to exclude the user. The client need to provide explicit assignment for preview user to work correctly.
    if (state === EXPERIMENT_STATE.ENROLLING && oldExperiment.state !== EXPERIMENT_STATE.ENROLLMENT_COMPLETE) {
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

  public async verifyExperiments(
    experimentFiles: ExperimentFile[],
    logger: UpgradeLogger
  ): Promise<{ experiments: ExperimentDTO[]; validatedExperiments: ValidatedExperimentError[] }> {
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
    return { experiments, validatedExperiments };
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
    logger: UpgradeLogger,
    existingEntityManager?: EntityManager
  ): Promise<Experiment> {
    const entityManager = existingEntityManager || this.dataSource.manager;

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
    const isChangingContext = oldExperiment.context[0] !== experiment.context[0];

    let includeListsToReturn = [...oldExperiment.experimentSegmentInclusion];
    let excludeListsToReturn = [...oldExperiment.experimentSegmentExclusion];

    if (isChangingContext) {
      // If the context is changing, we need to delete all lists from the experiment
      logger.info({
        message: `Changing context from ${oldExperiment.context[0]} to ${experiment.context[0]}. Deleting all lists from the experiment.`,
      });
      await this.deleteAllListsFromExperiment(oldExperiment, user, logger, entityManager);
      includeListsToReturn = [];
      excludeListsToReturn = [];
    }

    if (this.scheduledJobService) {
      this.scheduledJobService.updateExperimentSchedules(experiment as any, logger);
    }

    return entityManager
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
          experimentSegmentExclusion,
          experimentSegmentInclusion,
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
        const updatedExperiment = this.formattingPayload(newExperiment);

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
        return {
          ...updatedExperiment,
          experimentSegmentExclusion: excludeListsToReturn,
          experimentSegmentInclusion: includeListsToReturn,
        };
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
    logger: UpgradeLogger,
    entityManager: EntityManager
  ): Promise<ExperimentDTO> {
    await this.clearExperimentCacheDetail(
      experiment.context[0],
      experiment.partitions.map((partition) => {
        return { site: partition.site, target: partition.target };
      })
    );

    const createdExperiment = await entityManager.transaction(async (transactionalEntityManager) => {
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
      let decisionPointDocs: DecisionPoint[];
      let conditionPayloadDoc: ConditionPayload[];
      let queryDocs: any;
      try {
        [conditionDocs, decisionPointDocs, conditionPayloadDoc, queryDocs] = await Promise.all([
          this.experimentConditionRepository.insertConditions(conditionDocsToSave, transactionalEntityManager),
          this.decisionPointRepository.insertDecisionPoint(decisionPointDocsToSave, transactionalEntityManager),

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
    return this.reducedConditionPayload(this.formattingPayload(createdExperiment));
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

        const newExperiment = plainToClass(ExperimentDTO, experiment);

        if (!(newExperiment instanceof ExperimentDTO)) {
          return { fileName: experimentFile.fileName, error: 'Invalid JSON' };
        }
        const experimentJSONValidationError = await this.validateExperimentJSON(newExperiment);
        const fileName = experimentFile.fileName;

        if ('moocletPolicyParameters' in newExperiment && !env.mooclets?.enabled) {
          return {
            fileName,
            error: 'moocletPolicyParameters was provided but mooclets are not enabled on backend.',
          };
        }

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

  public validateExperimentContext(experiment: ExperimentDTO): string | null {
    const experimentContext = experiment.context[0];
    const contextMetadata = env.initialization.contextMetadata;

    if (!contextMetadata[experimentContext]) {
      return `The app context "${experimentContext}" is not defined in CONTEXT_METADATA.`;
    }

    return null;
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

    // Validate app context against CONTEXT_METADATA
    const contextValidationError = this.validateExperimentContext(experiment);
    if (contextValidationError) {
      errorString = errorString ? errorString + ', ' + contextValidationError : contextValidationError;
    }

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

  private deduceExperimentDetails(experiment: Experiment): Experiment {
    experiment.id = uuid();
    // delete createdAt date to let typeorm handle it and initialize versionNumber as fresh experiment version to detect updates
    delete experiment.createdAt;
    delete experiment.versionNumber;
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
      result.experimentSegmentInclusion = [];
    }
    result.experimentSegmentInclusion.forEach((segmentInclusion) => (segmentInclusion.segment.id = uuid()));

    if (!result.experimentSegmentExclusion) {
      result.experimentSegmentExclusion = [];
    }
    result.experimentSegmentExclusion.forEach((segmentExclusion) => (segmentExclusion.segment.id = uuid()));
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
  private paginatedSearchString(params: IExperimentSearchParams): string {
    const type = params.key;
    // escape % and ' characters
    const serachString = params.string.replace(/%/g, '\\$&').replace(/'/g, "''");
    const likeString = `ILIKE '%${serachString}%'`;
    const searchString: string[] = [];
    switch (type) {
      case EXPERIMENT_SEARCH_KEY.NAME:
        searchString.push(`${type} ${likeString}`);
        break;
      case EXPERIMENT_SEARCH_KEY.STATUS:
        searchString.push(`state::TEXT ${likeString}`);
        break;
      case EXPERIMENT_SEARCH_KEY.CONTEXT:
        searchString.push(`ARRAY_TO_STRING(${type}, ',') ${likeString}`);
        break;
      case EXPERIMENT_SEARCH_KEY.TAG:
        searchString.push(`ARRAY_TO_STRING(tags, ',') ${likeString}`);
        break;
      default:
        searchString.push(`name ${likeString}`);
        searchString.push(`state::TEXT ${likeString}`);
        searchString.push(`ARRAY_TO_STRING(context, ',') ${likeString}`);
        searchString.push(`ARRAY_TO_STRING(tags, ',') ${likeString}`);
        searchString.push(`partitions.site ${likeString}`);
        searchString.push(`partitions.target ${likeString}`);
        break;
    }

    const searchStringConcatenated = `(${searchString.join(' OR ')})`;
    return searchStringConcatenated;
  }

  public formattingConditionPayload(experiment: Experiment): Experiment {
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

  public formattingPayload(experiment: Experiment): any {
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

  private inferListTypesForExperimentListForExperimentRedesignDataChange(
    list: ExperimentSegmentExclusion[] | ExperimentSegmentInclusion[]
  ): ExperimentSegmentExclusion[] | ExperimentSegmentInclusion[] {
    return list.reduce((acc, exclusion) => {
      const inferreedListType = this.inferListType(exclusion.segment);
      if (inferreedListType) {
        exclusion.segment.listType = inferreedListType;
        return [...acc, exclusion];
      }
      return acc;
    }, []);
  }

  private inferListType(segment: Segment) {
    if (segment.listType) {
      return segment.listType;
    }
    if (
      segment.individualForSegment?.length > 0 &&
      segment.groupForSegment?.length === 0 &&
      segment.subSegments?.length === 0
    ) {
      return 'individual';
    }
    if (
      segment.individualForSegment?.length === 0 &&
      segment.groupForSegment?.length > 0 &&
      segment.subSegments?.length === 0
    ) {
      const groupType = segment.groupForSegment[0].type;
      if (segment.groupForSegment.every((val) => val.type !== 'All' && val.type === groupType)) return groupType;
    }
    if (
      segment.individualForSegment?.length === 0 &&
      segment.groupForSegment?.length === 0 &&
      segment.subSegments?.length > 0
    ) {
      return 'segment';
    }
    return null;
  }

  public async addList(
    listInput: SegmentInputValidator,
    experimentId: string,
    filterType: LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger,
    transactionalEntityManager?: EntityManager
  ): Promise<ExperimentSegmentInclusion | ExperimentSegmentExclusion> {
    logger.info({ message: `Add ${filterType} list to experiment` });

    const executeTransaction = async (manager: EntityManager) => {
      const segmentToCreate = { type: SEGMENT_TYPE.PRIVATE, ...listInput };

      let newSegment: Segment;
      try {
        newSegment = await this.segmentService.upsertSegmentInPipeline(segmentToCreate, logger, manager);
      } catch (err) {
        const error = new Error(`Error in creating private segment for experiment ${filterType} list: ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      const experiment = await manager.getRepository(Experiment).findOne({
        where: { id: experimentId },
      });

      const experimentSegmentInclusionOrExclusion =
        filterType === LIST_FILTER_MODE.INCLUSION ? new ExperimentSegmentInclusion() : new ExperimentSegmentExclusion();
      experimentSegmentInclusionOrExclusion.experiment = experiment;
      experimentSegmentInclusionOrExclusion.segment = newSegment;
      try {
        if (filterType === LIST_FILTER_MODE.INCLUSION) {
          await this.experimentSegmentInclusionRepository.insertData(
            [experimentSegmentInclusionOrExclusion],
            logger,
            manager
          );
        } else {
          await this.experimentSegmentExclusionRepository.insertData(
            [experimentSegmentInclusionOrExclusion],
            logger,
            manager
          );
        }
      } catch (err) {
        const error = new Error(`Error in adding segment for experiment ${filterType} list: ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      // TODO: Uncomment when the frontend is ready to handle the audit logs
      // const updateAuditLog: AuditLogData = {
      //   experimentId: experiment.id,
      //   experimentName: experiment.name,
      //   list: {
      //     listId: newSegment?.id,
      //     listName: newSegment?.name,
      //     filterType: filterType,
      //     operation: EXPERIMENT_LIST_OPERATION.CREATED,
      //   },
      // };
      // await this.experimentAuditLogRepository.saveRawJson(
      //   LOG_TYPE.EXPERIMENT_UPDATED,
      //   updateAuditLog,
      //   currentUser,
      //   transactionalEntityManager
      // );

      // Update exclusions/Enrollments if the filterType is EXCLUSION
      if (filterType === LIST_FILTER_MODE.EXCLUSION) {
        let newUsers = [];
        let newGroups = [];
        if (newSegment.listType === 'individual') {
          newUsers = newSegment.individualForSegment.map((ifs) => ifs.userId);
        } else if (newSegment.listType !== 'segment') {
          newGroups = newSegment.groupForSegment.map((gfs) => {
            return { groupId: gfs.groupId, type: gfs.type };
          });
        }

        await this.segmentService.updateEnrollmentAndExclusionDocuments(experiment, newUsers, newGroups);
      }
      return experimentSegmentInclusionOrExclusion;
    };

    if (transactionalEntityManager) {
      // Use the provided entity manager
      return await executeTransaction(transactionalEntityManager);
    } else {
      // Create a new transaction if no entity manager is provided
      return await this.dataSource.transaction(async (manager) => {
        return await executeTransaction(manager);
      });
    }
  }

  public async deleteList(
    segmentId: string,
    filterType: LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<Segment> {
    // TODO: Uncomment when the frontend is ready to handle the audit logs
    //await this.createDeleteListAuditLogs([segmentId], filterType, currentUser);
    await this.cacheService.resetPrefixCache(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX);
    return this.segmentService.deleteSegment(segmentId, logger);
  }

  async createDeleteListAuditLogs(
    segmentIds: string[],
    filterType: LIST_FILTER_MODE,
    currentUser: UserDTO,
    entityManager?: EntityManager
  ): Promise<void> {
    const auditLogPromises = [];
    for (const segmentId of segmentIds) {
      let existingRecord: ExperimentSegmentInclusion | ExperimentSegmentExclusion;

      if (filterType === LIST_FILTER_MODE.INCLUSION) {
        existingRecord = await this.experimentSegmentInclusionRepository.findOne({
          where: { segment: { id: segmentId } },
          relations: ['experiment', 'segment'],
        });
      } else {
        existingRecord = await this.experimentSegmentExclusionRepository.findOne({
          where: { segment: { id: segmentId } },
          relations: ['experiment', 'segment'],
        });
      }
      // Handle if the record is not found
      if (!existingRecord) {
        throw new Error(`Segment with ID ${segmentId} not found for ${filterType}`);
      }

      // Create the delete list audit log data
      const updateAuditLog = {
        experimentId: existingRecord.experiment.id,
        experimentName: existingRecord.experiment.name,
        list: {
          listId: segmentId,
          listName: existingRecord.segment.name,
          filterType: filterType,
          operation: EXPERIMENT_LIST_OPERATION.DELETED,
        },
      };

      const that = entityManager ? entityManager.getRepository(ExperimentAuditLog) : this.experimentAuditLogRepository;
      const savePromise = that.save({
        type: LOG_TYPE.EXPERIMENT_UPDATED,
        data: updateAuditLog,
        user: currentUser,
      });

      auditLogPromises.push(savePromise);
    }

    // Use Promise.all to run all audit log saving operations concurrently
    await Promise.all(auditLogPromises);
  }

  public async updateList(
    listInput: SegmentInputValidator,
    experimentId: string,
    filterType: LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<ExperimentSegmentInclusion | ExperimentSegmentExclusion> {
    logger.info({ message: `Update ${filterType} list for experiment` });
    await this.cacheService.resetPrefixCache(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX);
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Find the existing record
      let existingRecord: ExperimentSegmentInclusion | ExperimentSegmentExclusion;
      const experiment = await this.findOne(experimentId);

      if (filterType === LIST_FILTER_MODE.INCLUSION) {
        existingRecord = await this.experimentSegmentInclusionRepository.findOne({
          where: { experiment: { id: experimentId }, segment: { id: listInput.id } },
          relations: ['experiment', 'segment'],
        });
      } else {
        existingRecord = await this.experimentSegmentExclusionRepository.findOne({
          where: { experiment: { id: experimentId }, segment: { id: listInput.id } },
          relations: ['experiment', 'segment'],
        });
      }

      if (!existingRecord) {
        throw new Error(
          `No existing ${filterType} record found for experiment ${listInput.id} and segment ${listInput.id}`
        );
      }

      const { versionNumber, createdAt, updatedAt, type, ...oldSegmentDoc } = existingRecord.segment;

      const oldSegmentDocClone = JSON.parse(JSON.stringify(oldSegmentDoc));
      let newSegmentDocClone;

      // Update the segment
      try {
        const updatedSegment = await this.segmentService.upsertSegmentInPipeline(
          listInput,
          logger,
          transactionalEntityManager
        );
        existingRecord.segment = updatedSegment;

        const {
          featureFlagSegmentExclusion,
          featureFlagSegmentInclusion,
          experimentSegmentInclusion,
          experimentSegmentExclusion,
          versionNumber,
          createdAt,
          updatedAt,
          type,
          ...newSegmentDoc
        } = updatedSegment;
        newSegmentDocClone = JSON.parse(JSON.stringify(newSegmentDoc));
      } catch (err) {
        const error = new Error(`Error in updating private segment for experiment ${filterType} list: ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      // Save the updated record
      try {
        if (filterType === LIST_FILTER_MODE.INCLUSION) {
          await transactionalEntityManager.save(ExperimentSegmentInclusion, existingRecord);
        } else {
          await transactionalEntityManager.save(ExperimentSegmentExclusion, existingRecord);
        }
      } catch (err) {
        const error = new Error(`Error in updating segment for experiment ${filterType} list: ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      const listData = {
        listId: existingRecord.segment.id,
        listName: existingRecord.segment.name,
        filterType: filterType,
        operation: EXPERIMENT_LIST_OPERATION.UPDATED,
        diff: diffString(newSegmentDocClone, oldSegmentDocClone),
      };

      // update list AuditLogs here
      const updateAuditLog: AuditLogData = {
        flagId: experiment.id,
        flagName: experiment.name,
        list: listData,
      };

      await this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.FEATURE_FLAG_UPDATED, updateAuditLog, currentUser);

      return existingRecord;
    });
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

  private getListSegment(list: ParticipantsValidator, context): SegmentInputValidator {
    list.segment.id = uuid();

    const userIds = list.segment.individualForSegment?.map((individual) =>
      individual.userId ? individual.userId : null
    );
    const subSegmentIds = list.segment.subSegments?.map((subSegment) => (subSegment.id ? subSegment.id : null));
    const groups = list.segment.groupForSegment?.map((group) => {
      return group.type && group.groupId ? { type: group.type, groupId: group.groupId } : null;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { subSegments, ...inputSegment } = list.segment;
    const segmentToAdd = { ...inputSegment, userIds, subSegmentIds, groups, context };

    return {
      ...segmentToAdd,
      id: list.segment.id,
      name: list.segment.name || list.segment.id + ' Segment',
      description: list.segment.description || list.segment.id + ' Segment',
      context: context[0],
      type: SEGMENT_TYPE.PRIVATE,
    };
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

  private async deleteAllListsFromExperiment(
    oldExperiment: Experiment,
    user: UserDTO,
    logger: UpgradeLogger,
    transactionalEntityManager?: EntityManager
  ): Promise<void> {
    const includeListIds = oldExperiment.experimentSegmentInclusion.map((list) => list.segment.id);
    const excludeListIds = oldExperiment.experimentSegmentExclusion.map((list) => list.segment.id);

    // TODO: Uncomment when the frontend is ready to handle the audit logs
    // const auditLogPromises = [];

    // if (includeListIds.length) {
    //   auditLogPromises.push(
    //     this.createDeleteListAuditLogs(includeListIds, LIST_FILTER_MODE.INCLUSION, user, transactionalEntityManager)
    //   );
    // }

    // if (excludeListIds.length) {
    //   auditLogPromises.push(
    //     this.createDeleteListAuditLogs(excludeListIds, LIST_FILTER_MODE.EXCLUSION, user, transactionalEntityManager)
    //   );
    // }

    // Delete segments
    const segmentIds = [...includeListIds, ...excludeListIds];
    if (segmentIds.length) {
      await this.segmentRepository.deleteSegments(segmentIds, logger, transactionalEntityManager);
    }
    // await Promise.all(auditLogPromises);
    return;
  }
}
