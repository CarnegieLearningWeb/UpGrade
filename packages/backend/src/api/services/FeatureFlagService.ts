import { Service } from 'typedi';
import { FeatureFlag } from '../models/FeatureFlag';
import { Segment } from '../models/Segment';
import { IndividualForSegment } from '../models/IndividualForSegment';
import { GroupForSegment } from '../models/GroupForSegment';
import { FeatureFlagSegmentInclusion } from '../models/FeatureFlagSegmentInclusion';
import { FeatureFlagSegmentExclusion } from '../models/FeatureFlagSegmentExclusion';
import { FeatureFlagPrecomputedSegment } from '../models/FeatureFlagPrecomputedSegment';
import { FeatureFlagRepository } from '../repositories/FeatureFlagRepository';
import { FeatureFlagExposureRepository } from '../repositories/FeatureFlagExposureRepository';
import { FeatureFlagSegmentInclusionRepository } from '../repositories/FeatureFlagSegmentInclusionRepository';
import { FeatureFlagSegmentExclusionRepository } from '../repositories/FeatureFlagSegmentExclusionRepository';
import { EntityManager, In, DataSource } from 'typeorm';
import { InjectDataSource, InjectRepository } from '../../typeorm-typedi-extensions';

import { env } from '../../env';
import {
  IFeatureFlagSearchParams,
  IFeatureFlagSortParams,
  FLAG_SEARCH_KEY,
} from '../controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { FeatureFlagListValidator } from '../controllers/validators/FeatureFlagListValidator';
import {
  SERVER_ERROR,
  FEATURE_FLAG_STATUS,
  FILTER_MODE,
  SEGMENT_TYPE,
  IImportFile,
  IImportError,
  LOG_TYPE,
  FeatureFlagDeletedData,
  FeatureFlagCreatedData,
  FeatureFlagStateChangedData,
  FeatureFlagUpdatedData,
  LIST_FILTER_MODE,
  FEATURE_FLAG_LIST_OPERATION,
  ListOperationsData,
  CACHE_PREFIX,
  ValidatedImportResponse,
  IMPORT_COMPATIBILITY_TYPE,
  DATE_RANGE,
} from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { FeatureFlagValidation } from '../controllers/validators/FeatureFlagValidator';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentAssignmentService } from './ExperimentAssignmentService';
import { SegmentService } from './SegmentService';
import { ErrorWithType } from '../errors/ErrorWithType';
import { RequestedExperimentUser } from '../controllers/validators/ExperimentUserValidator';
import { isUUID, validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { FeatureFlagImportDataValidation } from '../controllers/validators/FeatureFlagImportValidator';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { UserDTO } from '../DTO/UserDTO';
import { diffString } from 'json-diff';
import { SegmentRepository } from '../repositories/SegmentRepository';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { NotFoundException } from '@nestjs/common/exceptions';
import { CacheService } from './CacheService';
import { FeatureFlagPrecomputedSegmentService, precomputedGroupKey } from './FeatureFlagPrecomputedSegmentService';
import { EntitySegmentResolutionInput } from '../../types';
import { SegmentFile, SegmentInputValidator } from '../controllers/validators/SegmentInputValidator';
import dayjs from 'dayjs';
import { getDateRangeNames } from '../repositories/utils/dateQuery';
import { FeatureFlagExposure } from '../models/FeatureFlagExposure';

@Service()
export class FeatureFlagService {
  constructor(
    @InjectRepository() private featureFlagRepository: FeatureFlagRepository,
    @InjectRepository() private featureFlagExposureRepository: FeatureFlagExposureRepository,
    @InjectRepository() private segmentRepository: SegmentRepository,
    @InjectRepository() private featureFlagSegmentInclusionRepository: FeatureFlagSegmentInclusionRepository,
    @InjectRepository() private featureFlagSegmentExclusionRepository: FeatureFlagSegmentExclusionRepository,
    @InjectRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
    @InjectDataSource() private dataSource: DataSource,
    public experimentAssignmentService: ExperimentAssignmentService,
    public segmentService: SegmentService,
    public cacheService: CacheService,
    public featureFlagPrecomputedSegmentService: FeatureFlagPrecomputedSegmentService
  ) {}

  public find(logger: UpgradeLogger): Promise<FeatureFlag[]> {
    logger.info({ message: 'Get all feature flags' });
    return this.featureFlagRepository.find();
  }

  public async getKeys(
    experimentUserDoc: RequestedExperimentUser,
    context: string,
    logger: UpgradeLogger
  ): Promise<string[]> {
    logger.info({ message: `getKeys: User: ${experimentUserDoc?.requestedUserId}` });

    // throw error if user not defined
    if (!experimentUserDoc || !experimentUserDoc.id) {
      logger.error({ message: 'User not defined in getKeys' });
      const error = new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: 'User not defined in getKeys',
        })
      );
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      (error as any).httpCode = 404;
      throw error;
    }

    const filteredFeatureFlags = await this.getCachedFlagsForKeys(context);

    const includedFeatureFlags = await this.featureFlagLevelInclusionExclusion(
      filteredFeatureFlags,
      experimentUserDoc,
      context,
      logger
    );

    // save exposures in db
    if (includedFeatureFlags.length > 0) {
      this.featureFlagExposureRepository
        .recordExposureIfNotExists(
          includedFeatureFlags.map((flag) => flag.id),
          experimentUserDoc.id
        )
        .catch((err) => logger.error({ message: 'Error saving FF exposures', err }));
    }

    return includedFeatureFlags.map((flags) => flags.key);
  }

  public async getCachedFlagsFromContext(context: string): Promise<FeatureFlag[]> {
    const cacheKey = CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX + context;

    const flags = await this.cacheService.wrap(
      cacheKey,
      this.featureFlagRepository.getFlagsFromContext.bind(this.featureFlagRepository, context)
    );

    return JSON.parse(JSON.stringify(flags));
  }

  public async getCachedFlagsForKeys(context: string): Promise<Pick<FeatureFlag, 'id' | 'key' | 'filterMode'>[]> {
    const cacheKey = CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX + 'keys-' + context;
    return this.cacheService.wrap(
      cacheKey,
      this.featureFlagRepository.getFlagsForKeys.bind(this.featureFlagRepository, context)
    );
  }

  public async clearCachedFlagsForContext(context: string): Promise<void> {
    await this.cacheService.delCache(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX + context);
    await this.cacheService.delCache(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX + 'keys-' + context);
  }

  public async findOne(id: string, logger?: UpgradeLogger): Promise<FeatureFlag | undefined> {
    if (logger) {
      logger.info({ message: `Find feature flag by id => ${id}` });
    }
    const featureFlag = await this.featureFlagRepository
      .createQueryBuilder('feature_flag')
      .leftJoinAndSelect('feature_flag.featureFlagSegmentInclusion', 'featureFlagSegmentInclusion')
      .leftJoinAndSelect('featureFlagSegmentInclusion.segment', 'segmentInclusion')
      .leftJoinAndSelect('segmentInclusion.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segmentInclusion.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment')
      .leftJoinAndSelect('feature_flag.featureFlagSegmentExclusion', 'featureFlagSegmentExclusion')
      .leftJoinAndSelect('featureFlagSegmentExclusion.segment', 'segmentExclusion')
      .leftJoinAndSelect('segmentExclusion.individualForSegment', 'individualForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.groupForSegment', 'groupForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion')
      .where({ id })
      .addOrderBy('LOWER(individualForSegment.userId)', 'ASC')
      .getOne();

    return featureFlag;
  }

  // Counts-only variant of findOne for the details page: maps member counts instead of loading
  // the member lists. Callers that need the actual members (e.g. exports) must use findOne.
  public async findOneForDetails(id: string, logger?: UpgradeLogger): Promise<FeatureFlag | undefined> {
    if (logger) {
      logger.info({ message: `Find feature flag (details view) by id => ${id}` });
    }
    const featureFlag = await this.featureFlagRepository
      .createQueryBuilder('feature_flag')
      .leftJoinAndSelect('feature_flag.featureFlagSegmentInclusion', 'featureFlagSegmentInclusion')
      .leftJoinAndSelect('featureFlagSegmentInclusion.segment', 'segmentInclusion')
      .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment')
      .leftJoinAndSelect('feature_flag.featureFlagSegmentExclusion', 'featureFlagSegmentExclusion')
      .leftJoinAndSelect('featureFlagSegmentExclusion.segment', 'segmentExclusion')
      .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion')
      .where({ id })
      .getOne();

    if (!featureFlag) {
      return undefined;
    }

    // loadRelationCountAndMap was removed in TypeORM 1.0; fetch member counts with two batch queries.
    const segments = [
      ...(featureFlag.featureFlagSegmentInclusion ?? []).map((r) => r.segment),
      ...(featureFlag.featureFlagSegmentExclusion ?? []).map((r) => r.segment),
    ].filter(Boolean);

    if (segments.length > 0) {
      const segmentIds = segments.map((s) => s.id);

      const [individualCounts, groupCounts] = await Promise.all([
        this.dataSource
          .createQueryBuilder()
          .select('ifs.segmentId', 'segmentId')
          .addSelect('COUNT(*)', 'count')
          .from(IndividualForSegment, 'ifs')
          .where('ifs.segmentId IN (:...segmentIds)', { segmentIds })
          .groupBy('ifs.segmentId')
          .getRawMany<{ segmentId: string; count: string }>(),
        this.dataSource
          .createQueryBuilder()
          .select('gfs.segmentId', 'segmentId')
          .addSelect('COUNT(*)', 'count')
          .from(GroupForSegment, 'gfs')
          .where('gfs.segmentId IN (:...segmentIds)', { segmentIds })
          .groupBy('gfs.segmentId')
          .getRawMany<{ segmentId: string; count: string }>(),
      ]);

      const individualCountMap = new Map(individualCounts.map((r) => [r.segmentId, Number.parseInt(r.count, 10)]));
      const groupCountMap = new Map(groupCounts.map((r) => [r.segmentId, Number.parseInt(r.count, 10)]));

      segments.forEach((segment) => {
        segment.individualForSegmentCount = individualCountMap.get(segment.id) ?? 0;
        segment.groupForSegmentCount = groupCountMap.get(segment.id) ?? 0;
      });
    }

    return featureFlag;
  }

  public async create(
    flagDTO: FeatureFlagValidation,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<FeatureFlag> {
    logger.info({ message: 'Create a new feature flag', details: flagDTO });
    const result = await this.featureFlagRepository.validateUniqueKey(flagDTO);

    if (result) {
      const error = new Error(`A flag with this key already exists for this app-context`);
      (error as any).type = SERVER_ERROR.DUPLICATE_KEY;
      (error as any).httpCode = 409;
      throw error;
    }

    return this.addFeatureFlagInDB(this.featureFlagValidatorToFlag(flagDTO), currentUser, logger);
  }

  public getTotalCount(): Promise<number> {
    return this.featureFlagRepository.count();
  }

  public async findPaginated(
    skip: number,
    take: number,
    logger: UpgradeLogger,
    searchParams?: IFeatureFlagSearchParams,
    sortParams?: IFeatureFlagSortParams
  ): Promise<[FeatureFlag[], number]> {
    logger.info({ message: 'Find paginated Feature flags' });

    let queryBuilder = this.featureFlagRepository.createQueryBuilder('feature_flag');
    if (searchParams) {
      const whereClause = this.paginatedSearchString(searchParams);
      queryBuilder = queryBuilder.where(whereClause);
    }
    if (sortParams) {
      queryBuilder = queryBuilder.addOrderBy(`feature_flag.${sortParams.key}`, sortParams.sortAs);
    }
    const countQueryBuilder = queryBuilder.clone();

    queryBuilder = queryBuilder.offset(skip).limit(take);
    const [featureFlagsWithExposures, count] = await Promise.all([
      queryBuilder
        .addSelect(
          (subQuery) =>
            subQuery
              .select('COUNT(*)', 'count')
              .from(FeatureFlagExposure, 'feature_flag_exposure')
              .where('"feature_flag_exposure"."featureFlagId" = "feature_flag"."id"'),
          'feature_flag_exposureCount'
        )
        .getMany(),
      countQueryBuilder.getCount(),
    ]);

    // Get the feature flag ids
    const featureFlagIds = featureFlagsWithExposures.map(({ id }) => id);

    // Get the relevant segment inclusion documents
    const featureFlagWithInclusionSegments = await this.featureFlagRepository.find({
      select: {
        id: true,
        featureFlagSegmentInclusion: true,
      },
      where: { id: In(featureFlagIds) },
      relations: {
        featureFlagSegmentInclusion: true,
      },
    });

    // Add the inclusion documents to the featureFlagsWithExposures
    return [
      featureFlagsWithExposures.map((featureFlag) => {
        // Find the matching featureFlagSegmentInclusion for the current item
        const inclusionSegment = featureFlagWithInclusionSegments.find(
          ({ id }) => id === featureFlag.id
        )?.featureFlagSegmentInclusion;

        // Construct the new object with conditional properties
        return {
          ...featureFlag,
          // Only include featureFlagSegmentInclusion if inclusionSegment is defined and not empty
          ...(inclusionSegment && inclusionSegment.length > 0 ? { featureFlagSegmentInclusion: inclusionSegment } : {}),
        };
      }),
      count,
    ];
  }

  public async delete(
    featureFlagId: string,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<FeatureFlag | undefined> {
    logger.info({ message: `Delete Feature Flag => ${featureFlagId}` });
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      const featureFlag = await this.findOneForDetails(featureFlagId, logger);

      if (featureFlag) {
        await this.clearCachedFlagsForContext(featureFlag.context[0]);
        const deletedFlag = await this.featureFlagRepository.deleteById(featureFlagId, transactionalEntityManager);

        featureFlag.featureFlagSegmentInclusion.forEach(async (segmentInclusion) => {
          try {
            await transactionalEntityManager.getRepository(Segment).delete(segmentInclusion.segment.id);
          } catch (err) {
            const error = err as ErrorWithType;
            error.details = 'Error in deleting Feature Flag Included Segment from DB';
            error.type = SERVER_ERROR.QUERY_FAILED;
            logger.error(error);
            throw error;
          }
        });
        featureFlag.featureFlagSegmentExclusion.forEach(async (segmentExclusion) => {
          try {
            await transactionalEntityManager.getRepository(Segment).delete(segmentExclusion.segment.id);
          } catch (err) {
            const error = err as ErrorWithType;
            error.details = 'Error in deleting Feature Flag Excluded Segment from DB';
            error.type = SERVER_ERROR.QUERY_FAILED;
            logger.error(error);
            throw error;
          }
        });
        // TODO: Add entry in audit log for delete feature flag
        const createAuditLogData: FeatureFlagDeletedData = {
          flagName: featureFlag.name,
        };
        await this.experimentAuditLogRepository.saveRawJson(
          LOG_TYPE.FEATURE_FLAG_DELETED,
          createAuditLogData,
          currentUser
        );
        return deletedFlag;
      }
      return undefined;
    });
  }

  public async updateState(flagId: string, status: FEATURE_FLAG_STATUS, currentUser: UserDTO): Promise<FeatureFlag> {
    const oldFeatureFlag = await this.findOneForDetails(flagId);
    await this.clearCachedFlagsForContext(oldFeatureFlag.context[0]);
    let updatedState: FeatureFlag;
    try {
      updatedState = await this.featureFlagRepository.updateState(flagId, status);
    } catch (err) {
      const error = new Error(`Error in updating feature flag status ${err}`);
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      throw error;
    }

    // TODO: Add log for updating flag state
    const data: FeatureFlagStateChangedData = {
      flagId,
      flagName: oldFeatureFlag.name,
      previousState: oldFeatureFlag.status,
      newState: status,
    };

    await this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED, data, currentUser);
    return updatedState;
  }

  public async updateFilterMode(flagId: string, filterMode: FILTER_MODE, currentUser: UserDTO): Promise<FeatureFlag> {
    let updatedFilterMode: FeatureFlag;

    try {
      updatedFilterMode = await this.featureFlagRepository.updateFilterMode(flagId, filterMode);
      await this.clearCachedFlagsForContext(updatedFilterMode?.context[0]);
    } catch (err) {
      const error = new Error(`Error in updating feature flag filter mode ${err}`);
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      throw error;
    }

    // TODO: Add log for updating filter mode
    const data: FeatureFlagUpdatedData = {
      flagId,
      flagName: updatedFilterMode.name,
      filterMode: filterMode,
    };

    await this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.FEATURE_FLAG_UPDATED, data, currentUser);
    return updatedFilterMode;
  }

  public async exportDesign(id: string, currentUser: UserDTO, logger: UpgradeLogger): Promise<FeatureFlag | null> {
    const featureFlag = await this.findOne(id, logger);
    if (featureFlag) {
      const exportAuditLog: FeatureFlagDeletedData = {
        flagName: featureFlag.name,
      };

      await this.experimentAuditLogRepository.saveRawJson(
        LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED,
        exportAuditLog,
        currentUser
      );
    }

    return featureFlag;
  }

  public async update(
    flagDTO: FeatureFlagValidation,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<FeatureFlag> {
    logger.info({ message: `Update a Feature Flag => ${flagDTO.toString()}` });
    const result = await this.featureFlagRepository.validateUniqueKey(flagDTO);

    if (result) {
      const error = new Error(`A flag with this key already exists for this app-context`);
      (error as any).type = SERVER_ERROR.DUPLICATE_KEY;
      (error as any).httpCode = 409;
      throw error;
    }
    // TODO add entry in log of updating feature flag
    return this.updateFeatureFlagInDB(this.featureFlagValidatorToFlag(flagDTO), currentUser, logger);
  }

  private async addFeatureFlagInDB(
    flag: FeatureFlag,
    user: UserDTO,
    logger: UpgradeLogger,
    entityManager?: EntityManager
  ): Promise<FeatureFlag> {
    flag.id = crypto.randomUUID();
    // saving feature flag doc

    await this.clearCachedFlagsForContext(flag.context[0]);
    const executeTransaction = async (manager: EntityManager): Promise<FeatureFlag> => {
      let featureFlagDoc;
      try {
        featureFlagDoc = (await this.featureFlagRepository.insertFeatureFlag(flag as any, manager))[0];
      } catch (err) {
        const error = new Error(`Error in creating feature flag document "addFeatureFlagInDB" ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      const createAuditLogData: FeatureFlagCreatedData = {
        flagId: featureFlagDoc.id,
        flagName: featureFlagDoc.name,
      };
      await this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.FEATURE_FLAG_CREATED, createAuditLogData, user);

      // Seed an empty feature_flag_precomputed_segment row in the same transaction so the new flag always
      // has a row (no segment lists yet => empty arrays). This keeps the assignment read path
      // off the on-the-fly fallback for the common case and keeps the getKeys cache effective.
      await this.featureFlagPrecomputedSegmentService.seedEmptyRowForFlag(featureFlagDoc.id, manager);

      return featureFlagDoc;
    };

    if (entityManager) {
      // Use the provided entity manager
      return await executeTransaction(entityManager);
    } else {
      // Create a new transaction if no entity manager is provided
      return await this.dataSource.transaction(async (manager) => {
        return await executeTransaction(manager);
      });
    }
  }

  private async updateFeatureFlagInDB(flag: FeatureFlag, user: UserDTO, logger: UpgradeLogger): Promise<FeatureFlag> {
    await this.clearCachedFlagsForContext(flag.context[0]);
    const {
      featureFlagSegmentExclusion,
      featureFlagSegmentInclusion,
      versionNumber,
      createdAt,
      updatedAt,
      ...oldFlagDoc
    } = await this.findOneForDetails(flag.id);

    let includeList = [...featureFlagSegmentInclusion];
    let excludeList = [...featureFlagSegmentExclusion];

    const includeListIds = includeList.map((list) => list.segment.id);
    const excludeListIds = excludeList.map((list) => list.segment.id);

    // A context change (below) deletes all of this flag's inclusion/exclusion lists. That delete does
    // NOT cascade to feature_flag_precomputed_segment (its FK is to feature_flag, not segment), so the
    // row would otherwise keep stale member IDs. Recompute it (to empty) after commit via withRecompute.
    // Non-context updates don't touch lists, so there is nothing to recompute.
    const contextChanged = oldFlagDoc.context[0] !== flag.context[0];

    const applyUpdate = async (transactionalEntityManager: EntityManager) => {
      const {
        featureFlagSegmentExclusion,
        featureFlagSegmentInclusion,
        versionNumber,
        createdAt,
        updatedAt,
        ...flagDoc
      } = flag;

      const promises = [];

      if (oldFlagDoc.context[0] !== flagDoc.context[0]) {
        // Create delete audit logs for inclusion and exclusion lists
        if (includeListIds.length) {
          promises.push(
            this.createDeleteListAuditLogs(includeListIds, LIST_FILTER_MODE.INCLUSION, user, transactionalEntityManager)
          );
        }

        if (excludeListIds.length) {
          promises.push(
            this.createDeleteListAuditLogs(excludeListIds, LIST_FILTER_MODE.EXCLUSION, user, transactionalEntityManager)
          );
        }

        // Delete segments
        const segmentIds = [...includeListIds, ...excludeListIds];
        if (segmentIds.length) {
          await this.segmentRepository.deleteSegments(segmentIds, logger, transactionalEntityManager);
        }

        includeList = [];
        excludeList = [];
      }

      await Promise.all(promises);

      let featureFlagDoc: FeatureFlag;
      try {
        featureFlagDoc = (await this.featureFlagRepository.updateFeatureFlag(flagDoc, transactionalEntityManager))[0];
      } catch (err) {
        const error = new Error(`Error in updating feature flag document "updateFeatureFlagInDB" ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      const oldFlagDocClone = JSON.parse(JSON.stringify(oldFlagDoc));
      const newFlagDocClone = JSON.parse(JSON.stringify(flagDoc));

      // Update AuditLogs here
      const updateAuditLog: FeatureFlagUpdatedData = {
        flagId: featureFlagDoc.id,
        flagName: featureFlagDoc.name,
        diff: diffString(oldFlagDocClone, newFlagDocClone),
      };

      await this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.FEATURE_FLAG_UPDATED, updateAuditLog, user);

      return {
        ...featureFlagDoc,
        featureFlagSegmentInclusion: includeList,
        featureFlagSegmentExclusion: excludeList,
      };
    };

    return this.featureFlagPrecomputedSegmentService.withRecompute(
      logger,
      () => (contextChanged ? [flag.id] : []),
      () => this.dataSource.transaction(applyUpdate)
    );
  }

  public async deleteList(
    segmentId: string,
    filterType: LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<Segment> {
    await this.createDeleteListAuditLogs([segmentId], filterType, currentUser);
    await this.cacheService.resetPrefixCache(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX);

    // segmentService.deleteSegment collects the affected flags before deletion and fires the
    // fire-and-forget recompute itself (via withRecompute), so no separate recompute is needed here.
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
      let existingRecord: FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion;

      if (filterType === LIST_FILTER_MODE.INCLUSION) {
        existingRecord = await this.featureFlagSegmentInclusionRepository.findOne({
          where: { segment: { id: segmentId } },
          relations: {
            featureFlag: true,
            segment: true,
          },
        });
      } else {
        existingRecord = await this.featureFlagSegmentExclusionRepository.findOne({
          where: { segment: { id: segmentId } },
          relations: {
            featureFlag: true,
            segment: true,
          },
        });
      }

      // Handle if the record is not found
      if (!existingRecord) {
        throw new Error(`Segment with ID ${segmentId} not found for ${filterType}`);
      }

      // Create the delete list audit log data
      const updateAuditLog: FeatureFlagUpdatedData = {
        flagId: existingRecord.featureFlag.id,
        flagName: existingRecord.featureFlag.name,
        list: {
          listId: segmentId,
          listName: existingRecord.segment.name,
          filterType: filterType,
          operation: FEATURE_FLAG_LIST_OPERATION.DELETED,
        },
      };

      const that = entityManager ? entityManager.getRepository(ExperimentAuditLog) : this.experimentAuditLogRepository;
      const savePromise = that.save({
        type: LOG_TYPE.FEATURE_FLAG_UPDATED,
        data: updateAuditLog,
        user: currentUser,
      });

      auditLogPromises.push(savePromise);
    }

    // Use Promise.all to run all audit log saving operations concurrently
    await Promise.all(auditLogPromises);
  }

  public async addList(
    listsInput: FeatureFlagListValidator[],
    filterType: LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger,
    transactionalEntityManager?: EntityManager
  ): Promise<(FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion)[]> {
    logger.info({ message: `Add ${filterType} list to feature flag` });

    await this.cacheService.resetPrefixCache(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX);

    const executeTransaction = async (manager: EntityManager) => {
      // Create a new private segment
      const segmentsToCreate = listsInput.map((listInput) => {
        listInput.segment.type = SEGMENT_TYPE.PRIVATE;
        return listInput.segment;
      });

      let newSegments: Segment[];
      try {
        newSegments = await Promise.all(
          segmentsToCreate.map((segment) => this.segmentService.upsertSegmentInPipeline(segment, logger, manager))
        );
      } catch (err) {
        const error = new Error(`Error in creating private segment for feature flag ${filterType} list: ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      const featureFlags = await manager.getRepository(FeatureFlag).findBy({
        id: In(listsInput.map((listInput) => listInput.id)),
      });

      const featureFlagSegmentInclusionOrExclusionArray = listsInput.map((listInput) => {
        const featureFlagSegmentInclusionOrExclusion =
          filterType === 'inclusion' ? new FeatureFlagSegmentInclusion() : new FeatureFlagSegmentExclusion();
        featureFlagSegmentInclusionOrExclusion.enabled = listInput.enabled;
        featureFlagSegmentInclusionOrExclusion.listType = listInput.listType;
        featureFlagSegmentInclusionOrExclusion.featureFlag = featureFlags.find((flag) => flag.id === listInput.id);
        featureFlagSegmentInclusionOrExclusion.segment = newSegments.find(
          (segment) => segment.id === listInput.segment.id
        );
        return featureFlagSegmentInclusionOrExclusion;
      });

      try {
        if (filterType === LIST_FILTER_MODE.INCLUSION) {
          await this.featureFlagSegmentInclusionRepository.insertData(
            featureFlagSegmentInclusionOrExclusionArray,
            logger,
            manager
          );
        } else {
          await this.featureFlagSegmentExclusionRepository.insertData(
            featureFlagSegmentInclusionOrExclusionArray,
            logger,
            manager
          );
        }
      } catch (err) {
        const error = new Error(`Error in adding segment for feature flag ${filterType} list: ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      for (const list of featureFlagSegmentInclusionOrExclusionArray) {
        const updateAuditLog: FeatureFlagUpdatedData = {
          flagId: list.featureFlag.id,
          flagName: list.featureFlag.name,
          list: {
            listId: list.segment?.id,
            listName: list.segment?.name,
            filterType: filterType,
            operation: FEATURE_FLAG_LIST_OPERATION.CREATED,
          },
        };
        await this.experimentAuditLogRepository.saveRawJson(
          LOG_TYPE.FEATURE_FLAG_UPDATED,
          updateAuditLog,
          currentUser,
          transactionalEntityManager
        );
      }

      return featureFlagSegmentInclusionOrExclusionArray;
    };

    let result: (FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion)[];
    if (transactionalEntityManager) {
      // The caller owns the outer transaction. We must NOT recompute here: recomputeForFlag
      // reads through its own repositories and cannot see this transaction's uncommitted writes,
      // so it would persist an empty/stale feature_flag_precomputed_segment row that never self-heals. The
      // caller is responsible for calling recomputeForFlag after its transaction commits.
      result = await executeTransaction(transactionalEntityManager);
    } else {
      // withRecompute runs the mutation in its own transaction, then fires a fire-and-forget
      // recompute for the affected flags after commit — the caller never awaits it.
      result = await this.featureFlagPrecomputedSegmentService.withRecompute(
        logger,
        () => [...new Set(listsInput.map((l) => l.id))],
        () => this.dataSource.transaction((manager) => executeTransaction(manager))
      );
    }

    return result;
  }

  public async getExposureStatsByDate(
    flagId: string,
    dateRange: DATE_RANGE,
    clientOffset: number
  ): Promise<{ date: string; count: number }[]> {
    const featureFlag = await this.featureFlagRepository.findOne({
      where: { id: flagId },
    });

    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with id ${flagId} not found`);
    }
    const featureFlagAge = dayjs().year() - dayjs(featureFlag.createdAt).year();

    const dates = getDateRangeNames(dateRange, clientOffset, featureFlagAge);
    const exposuresByDate = await this.featureFlagExposureRepository.getExposuresByDateRange(
      flagId,
      dateRange,
      clientOffset
    );

    return dates.map((date) => {
      const count = exposuresByDate.find((stat) => stat.date_range.toDateString() === date)?.count || 0;
      return {
        date,
        count,
      };
    });
  }

  public async updateList(
    listInput: FeatureFlagListValidator,
    filterType: LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion> {
    logger.info({ message: `Update ${filterType} list for feature flag` });
    await this.cacheService.resetPrefixCache(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX);
    const doUpdate = async (transactionalEntityManager: EntityManager) => {
      // Only the flag id/name are needed here (audit log), so use the counts-only variant.
      let existingRecord: FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion;
      const featureFlag = await this.findOneForDetails(listInput.id);

      if (filterType === LIST_FILTER_MODE.INCLUSION) {
        existingRecord = await this.featureFlagSegmentInclusionRepository.findOne({
          where: { featureFlag: { id: listInput.id }, segment: { id: listInput.segment.id } },
          relations: {
            featureFlag: true,
            segment: true,
          },
        });
      } else {
        existingRecord = await this.featureFlagSegmentExclusionRepository.findOne({
          where: { featureFlag: { id: listInput.id }, segment: { id: listInput.segment.id } },
          relations: {
            featureFlag: true,
            segment: true,
          },
        });
      }

      if (!existingRecord) {
        throw new Error(
          `No existing ${filterType} record found for feature flag ${listInput.id} and segment ${listInput.segment.id}`
        );
      }

      const statusChanged = existingRecord.enabled !== listInput.enabled;
      // Update the existing record
      existingRecord.enabled = listInput.enabled;
      existingRecord.listType = listInput.listType;

      const { versionNumber, createdAt, updatedAt, type, ...oldSegmentDoc } = existingRecord.segment;

      const oldSegmentDocClone = JSON.parse(JSON.stringify(oldSegmentDoc));
      let newSegmentDocClone;

      // Update the segment. Pass skipScheduleRecompute=true because updateList calls
      // recomputeForFlag explicitly after the transaction — firing scheduleRecomputeForSegment
      // from inside the transaction risks a stale-read race on the enabled flag.
      try {
        const updatedSegment = await this.segmentService.upsertSegmentInPipeline(
          listInput.segment,
          logger,
          transactionalEntityManager,
          true
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
        const error = new Error(`Error in updating private segment for feature flag ${filterType} list: ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      // Save the updated record
      try {
        if (filterType === LIST_FILTER_MODE.INCLUSION) {
          await transactionalEntityManager.save(FeatureFlagSegmentInclusion, existingRecord);
        } else {
          await transactionalEntityManager.save(FeatureFlagSegmentExclusion, existingRecord);
        }
      } catch (err) {
        const error = new Error(`Error in updating segment for feature flag ${filterType} list: ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      let listData: ListOperationsData;

      if (statusChanged) {
        listData = {
          listId: existingRecord.segment.id,
          listName: existingRecord.segment.name,
          filterType: filterType,
          enabled: listInput.enabled,
          operation: FEATURE_FLAG_LIST_OPERATION.STATUS_CHANGED,
        };
      } else {
        listData = {
          listId: existingRecord.segment.id,
          listName: existingRecord.segment.name,
          filterType: filterType,
          operation: FEATURE_FLAG_LIST_OPERATION.UPDATED,
          diff: diffString(oldSegmentDocClone, newSegmentDocClone),
        };
      }

      // update list AuditLogs here
      const updateAuditLog: FeatureFlagUpdatedData = {
        flagId: featureFlag.id,
        flagName: featureFlag.name,
        list: listData,
      };

      await this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.FEATURE_FLAG_UPDATED, updateAuditLog, currentUser);

      return existingRecord;
    };

    // withRecompute runs the update transaction, then fires a fire-and-forget recompute for the
    // affected flag after commit — the caller never awaits it.
    const result = await this.featureFlagPrecomputedSegmentService.withRecompute(
      logger,
      () => [listInput.id],
      () => this.dataSource.transaction(doUpdate)
    );

    return result;
  }

  public async updateListStatus(
    segmentId: string,
    enabled: boolean,
    filterType: LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion> {
    logger.info({ message: `Update ${filterType} list status for feature flag => segment ${segmentId}` });

    let existingRecord: FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion;
    if (filterType === LIST_FILTER_MODE.INCLUSION) {
      existingRecord = await this.featureFlagSegmentInclusionRepository.findOne({
        where: { segment: { id: segmentId } },
        relations: { featureFlag: true, segment: true },
      });
    } else {
      existingRecord = await this.featureFlagSegmentExclusionRepository.findOne({
        where: { segment: { id: segmentId } },
        relations: { featureFlag: true, segment: true },
      });
    }

    if (!existingRecord) {
      const error = new Error(`No existing ${filterType} record found for segment ${segmentId}`);
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      logger.error(error);
      throw error;
    }

    const statusChanged = existingRecord.enabled !== enabled;

    // Route the status flip through withRecompute so the feature_flag_precomputed_segment row is
    // refreshed after the change commits. recomputeForFlag only flattens *enabled* inclusion/
    // exclusion lists, so toggling `enabled` changes the precomputed member set even though no
    // members are rewritten. When the value is unchanged there is nothing to recompute, so the
    // resolver yields no flag ids and withRecompute fires nothing.
    return await this.featureFlagPrecomputedSegmentService.withRecompute(
      logger,
      () => (statusChanged ? [existingRecord.featureFlag.id] : []),
      async () => {
        existingRecord.enabled = enabled;

        try {
          if (filterType === LIST_FILTER_MODE.INCLUSION) {
            await this.featureFlagSegmentInclusionRepository.save(existingRecord);
          } else {
            await this.featureFlagSegmentExclusionRepository.save(existingRecord);
          }
        } catch (err) {
          const error = new Error(`Error in updating ${filterType} list status: ${err}`);
          (error as any).type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }

        await this.clearCachedFlagsForContext(existingRecord.featureFlag.context[0]);

        if (statusChanged) {
          const listData: ListOperationsData = {
            listId: existingRecord.segment.id,
            listName: existingRecord.segment.name,
            filterType: filterType,
            enabled: enabled,
            operation: FEATURE_FLAG_LIST_OPERATION.STATUS_CHANGED,
          };
          const updateAuditLog: FeatureFlagUpdatedData = {
            flagId: existingRecord.featureFlag.id,
            flagName: existingRecord.featureFlag.name,
            list: listData,
          };
          await this.experimentAuditLogRepository.saveRawJson(
            LOG_TYPE.FEATURE_FLAG_UPDATED,
            updateAuditLog,
            currentUser
          );
        }

        return existingRecord;
      }
    );
  }

  private paginatedSearchString(params: IFeatureFlagSearchParams): string {
    const type = params.key;
    // escape % and ' characters
    const searchString = params.string.replace(/%/g, '\\$&').replace(/'/g, "''");
    if (type === FLAG_SEARCH_KEY.ID && !isUUID(searchString)) {
      return '';
    }
    const likeString = `ILIKE '%${searchString}%'`;
    const searchArray: string[] = [];
    switch (type) {
      case FLAG_SEARCH_KEY.NAME:
        searchArray.push(`${type} ${likeString}`);
        break;
      case FLAG_SEARCH_KEY.STATUS:
        searchArray.push(`status::TEXT ${likeString}`);
        break;
      case FLAG_SEARCH_KEY.CONTEXT:
        searchArray.push(`ARRAY_TO_STRING(${type}, ',') ${likeString}`);
        break;
      case FLAG_SEARCH_KEY.TAG:
        searchArray.push(`ARRAY_TO_STRING(tags, ',') ${likeString}`);
        break;
      case FLAG_SEARCH_KEY.ID:
        searchArray.push(`feature_flag.id = '${searchString}'`);
        break;
      default:
        searchArray.push(`name ${likeString}`);
        searchArray.push(`status::TEXT ${likeString}`);
        searchArray.push(`ARRAY_TO_STRING(context, ',') ${likeString}`);
        searchArray.push(`ARRAY_TO_STRING(tags, ',') ${likeString}`);
        if (isUUID(searchString)) {
          searchArray.push(`feature_flag.id = '${searchString}'`);
        }
        break;
    }

    const searchStringConcatenated = `(${searchArray.join(' OR ')})`;
    return searchStringConcatenated;
  }

  private featureFlagValidatorToFlag(flagDTO: FeatureFlagValidation | FeatureFlagImportDataValidation) {
    const featureFlag = new FeatureFlag();
    featureFlag.name = flagDTO.name;
    featureFlag.description = flagDTO.description;
    featureFlag.id = flagDTO.id;
    featureFlag.key = flagDTO.key;
    featureFlag.status = flagDTO.status;
    featureFlag.context = flagDTO.context;
    featureFlag.tags = flagDTO.tags;
    featureFlag.filterMode = flagDTO.filterMode;
    return featureFlag;
  }

  private async featureFlagLevelInclusionExclusion(
    featureFlags: Pick<FeatureFlag, 'id' | 'key' | 'filterMode'>[],
    experimentUser: ExperimentUser,
    context: string,
    logger: UpgradeLogger
  ): Promise<Pick<FeatureFlag, 'id' | 'key' | 'filterMode'>[]> {
    const flagIds = featureFlags.map((f) => f.id);
    // getPrecomputedSets can throw if the feature_flag_precomputed_segment table is unavailable
    // (e.g. the migration hasn't been run yet). Treat that identically to every row being missing:
    // swallow the error and fall through to on-the-fly segment resolution below rather than failing
    // the whole assignment request. Rows self-heal on the next restart (backfill) or list mutation.
    let precomputedMap: Map<string, FeatureFlagPrecomputedSegment>;
    try {
      precomputedMap = await this.featureFlagPrecomputedSegmentService.getPrecomputedSets(flagIds);
    } catch (err) {
      logger.error({
        message: `featureFlagLevelInclusionExclusion: failed to read feature_flag_precomputed_segment; falling back to on-the-fly resolution for all flags: ${err}`,
      });
      precomputedMap = new Map();
    }

    // Build type-qualified group keys from the user's group map so they match the namespaced group
    // IDs stored in the precomputed arrays (individuals are matched bare against experimentUser.id).
    // Must use the same precomputedGroupKey helper as the write path.
    const userGroupKeys: string[] = experimentUser.group
      ? Object.entries(experimentUser.group).flatMap(([type, groupIds]) =>
          groupIds.map((groupId) => precomputedGroupKey(type, groupId))
        )
      : [];

    // Any flag without a precomputed row falls back to on-the-fly segment resolution so a
    // truly-missing row never silently produces a wrong include/exclude decision. Seeding on
    // create (and recompute on every list mutation) should make this rare — log it so a
    // persistent fallback is visible rather than silently masking a recompute gap.
    const missingFlagIds = flagIds.filter((id) => !precomputedMap.has(id));
    const onTheFlyIncludedIds = missingFlagIds.length
      ? await this.resolveFlagsOnTheFly(missingFlagIds, context, experimentUser, logger)
      : new Set<string>();

    return featureFlags.filter((flag) => {
      const computed = precomputedMap.get(flag.id);

      if (!computed) {
        // No precomputed row — fall back to the on-the-fly resolution result for this flag
        return onTheFlyIncludedIds.has(flag.id);
      }

      const exclusionSet = new Set(computed.exclusionIds);
      const inclusionSet = new Set(computed.inclusionIds);

      // Individual exclusion always wins
      if (exclusionSet.has(experimentUser.id)) return false;

      // Individual inclusion bypasses group checks
      if (inclusionSet.has(experimentUser.id)) return true;

      const inGroupExclusion = userGroupKeys.some((key) => exclusionSet.has(key));
      const inGroupInclusion = userGroupKeys.some((key) => inclusionSet.has(key));

      if (flag.filterMode === FILTER_MODE.INCLUDE_ALL) {
        return !inGroupExclusion;
      } else {
        // EXCLUDE_ALL: include only if in inclusion group and not in exclusion group
        return inGroupInclusion && !inGroupExclusion;
      }
    });
  }

  /**
   * Fallback assignment path for flags that have no feature_flag_precomputed_segment row. Resolves segment
   * inclusion/exclusion on-the-fly using the same recursive resolution the codebase used before
   * precomputed segments (and that experiments still use), preserving full group-type matching.
   * Returns the set of flag IDs the user should be included in.
   */
  private async resolveFlagsOnTheFly(
    missingFlagIds: string[],
    context: string,
    experimentUser: ExperimentUser,
    logger: UpgradeLogger
  ): Promise<Set<string>> {
    logger.warn({
      message: `featureFlagLevelInclusionExclusion: ${missingFlagIds.length} flag(s) missing a feature_flag_precomputed_segment row; resolving on-the-fly`,
      details: { context, missingFlagIds },
    });

    // Load the full flags (with segment relations) for this context and keep only the missing ones
    const missingIdSet = new Set(missingFlagIds);
    const fullFlags = (await this.getCachedFlagsFromContext(context)).filter((flag) => missingIdSet.has(flag.id));
    if (!fullFlags.length) {
      return new Set<string>();
    }

    const getEnabledSegmentIds = (list: (FeatureFlagSegmentExclusion | FeatureFlagSegmentInclusion)[]) =>
      (list ?? []).filter((item) => item.enabled).map((item) => item.segment.id);

    const segmentObjMap: EntitySegmentResolutionInput = {};
    fullFlags.forEach((flag) => {
      const excludeIds = getEnabledSegmentIds(flag.featureFlagSegmentExclusion);
      // INCLUDE_ALL flags ignore inclusion segments (matches the precomputed-path semantics)
      const includeIds =
        flag.filterMode !== FILTER_MODE.INCLUDE_ALL ? getEnabledSegmentIds(flag.featureFlagSegmentInclusion) : [];

      segmentObjMap[flag.id] = {
        segmentIdsQueue: [...includeIds, ...excludeIds],
        currentIncludedSegmentIds: includeIds,
        currentExcludedSegmentIds: excludeIds,
        allIncludedSegmentIds: includeIds,
        allExcludedSegmentIds: excludeIds,
      };
    });

    const flagIdsWithFilter = fullFlags.map(({ id, filterMode }) => ({ id, filterMode }));
    const [includeData, excludeData] = await this.experimentAssignmentService.resolveSegmentsForEntities(segmentObjMap);
    const [includedFlagIds] = await this.experimentAssignmentService.inclusionExclusionLogic(
      includeData,
      excludeData,
      experimentUser,
      flagIdsWithFilter
    );

    return new Set(includedFlagIds);
  }

  public async importFeatureFlags(
    featureFlagFiles: IImportFile[],
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<IImportError[]> {
    logger.info({ message: 'Import feature flags' });
    const validatedFlags = await this.validateImportFeatureFlags(featureFlagFiles, logger);

    const fileStatusArray = featureFlagFiles.map((file) => {
      const validation = validatedFlags.find((error) => error.fileName === file.fileName);
      const isCompatible = validation && validation.compatibilityType !== IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;

      return {
        fileName: file.fileName,
        error: isCompatible ? validation.compatibilityType : IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE,
      };
    });

    const validFiles: FeatureFlagImportDataValidation[] = await Promise.all(
      fileStatusArray
        .filter((fileStatus) => fileStatus.error !== IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE)
        .map(async (fileStatus) => {
          const featureFlagFile = featureFlagFiles.find((file) => file.fileName === fileStatus.fileName);

          if (fileStatus.error === IMPORT_COMPATIBILITY_TYPE.WARNING) {
            const flag = JSON.parse(featureFlagFile.fileContent as string);
            const segmentIdsSet = new Set([
              ...flag.featureFlagSegmentInclusion.flatMap((segmentInclusion) => {
                return segmentInclusion.segment.subSegments.map((subSegment) => subSegment.id);
              }),
              ...flag.featureFlagSegmentExclusion.flatMap((segmentExclusion) => {
                return segmentExclusion.segment.subSegments.map((subSegment) => subSegment.id);
              }),
            ]);

            const segmentIds = Array.from(segmentIdsSet);
            const segments = await this.segmentService.getSegmentByIds(segmentIds);

            // remove elements from featureFlagSegmentInclusion and featureFlagSegmentExclusion if segment is not found or context is not same
            flag.featureFlagSegmentInclusion = flag.featureFlagSegmentInclusion.filter((segmentInclusion) => {
              const subSegments = segmentInclusion.segment.subSegments;
              const subSegmentIds = subSegments.map((subSegment) => subSegment.id);

              // check if each subsegment if found in segments array and has the same context else remove segmentInclusion
              return subSegmentIds.every((subSegmentId) => {
                const segmentFound = segments.find((segment) => segment.id === subSegmentId);
                return segmentFound && segmentFound.context === flag.context[0];
              });
            });

            flag.featureFlagSegmentExclusion = flag.featureFlagSegmentExclusion.filter((segmentExclusion) => {
              const subSegments = segmentExclusion.segment.subSegments;
              const subSegmentIds = subSegments.map((subSegment) => subSegment.id);

              // check if each subsegment if found in segments array and has the same context else remove segmentExclusion
              return subSegmentIds.every((subSegmentId) => {
                const segmentFound = segments.find((segment) => segment.id === subSegmentId);
                return segmentFound && segmentFound.context === flag.context[0];
              });
            });
            return flag;
          }
          return JSON.parse(featureFlagFile.fileContent as string);
        })
    );
    const createdFlags = [];

    for (const featureFlagWithEnabledSettings of validFiles) {
      const featureFlag = {
        ...featureFlagWithEnabledSettings,
        status: FEATURE_FLAG_STATUS.DISABLED,
      };

      const createdFlag = await this.dataSource.transaction(async (transactionalEntityManager) => {
        const newFlag = await this.addFeatureFlagInDB(
          this.featureFlagValidatorToFlag(featureFlag),
          currentUser,
          logger,
          transactionalEntityManager
        );

        const featureFlagSegmentInclusionList = featureFlag.featureFlagSegmentInclusion.map((segmentInclusionList) => {
          segmentInclusionList.segment.id = crypto.randomUUID();

          const userIds = segmentInclusionList.segment.individualForSegment.map((individual) =>
            individual.userId ? individual.userId : null
          );
          const subSegmentIds = segmentInclusionList.segment.subSegments.map((subSegment) =>
            subSegment.id ? subSegment.id : null
          );
          const groups = segmentInclusionList.segment.groupForSegment.map((group) => {
            return group.type && group.groupId ? { type: group.type, groupId: group.groupId } : null;
          });

          return {
            ...segmentInclusionList,
            enabled: false,
            id: newFlag.id,
            segment: {
              ...segmentInclusionList.segment,
              userIds,
              subSegmentIds,
              groups,
              listType: segmentInclusionList.listType,
            },
          };
        });

        const featureFlagSegmentExclusionList = featureFlag.featureFlagSegmentExclusion.map((segmentExclusionList) => {
          segmentExclusionList.segment.id = crypto.randomUUID();

          const userIds = segmentExclusionList.segment.individualForSegment.map((individual) =>
            individual.userId ? individual.userId : null
          );
          const subSegmentIds = segmentExclusionList.segment.subSegments.map((subSegment) =>
            subSegment.id ? subSegment.id : null
          );
          const groups = segmentExclusionList.segment.groupForSegment.map((group) => {
            return group.type && group.groupId ? { type: group.type, groupId: group.groupId } : null;
          });

          return {
            ...segmentExclusionList,
            id: newFlag.id,
            segment: {
              ...segmentExclusionList.segment,
              userIds,
              subSegmentIds,
              groups,
              listType: segmentExclusionList.listType,
            },
          };
        });

        const [inclusionDoc, exclusionDoc] = await Promise.all([
          this.addList(
            featureFlagSegmentInclusionList,
            LIST_FILTER_MODE.INCLUSION,
            currentUser,
            logger,
            transactionalEntityManager
          ),
          this.addList(
            featureFlagSegmentExclusionList,
            LIST_FILTER_MODE.EXCLUSION,
            currentUser,
            logger,
            transactionalEntityManager
          ),
        ]);

        return { ...newFlag, featureFlagSegmentInclusion: inclusionDoc, featureFlagSegmentExclusion: exclusionDoc };
      });

      createdFlags.push(createdFlag);

      // The outer transaction has committed — recompute now (addList skipped it because it ran
      // inside the transaction) so the imported enabled lists are reflected in feature_flag_precomputed_segment.
      // Unlike the interactive write paths (which fire-and-forget via withRecompute), import intentionally
      // awaits so a successful import response means the precomputed rows are already consistent.
      await this.featureFlagPrecomputedSegmentService.recomputeForFlag(createdFlag.id, logger);
    }
    logger.info({ message: 'Imported feature flags', details: createdFlags });

    fileStatusArray.forEach((fileStatus) => {
      if (fileStatus.error !== IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE) {
        fileStatus.error = null;
      }
    });
    return fileStatusArray;
  }

  public validateFeatureFlagContext(flag: { name: string; context: string[] }): string | null {
    const flagContext = flag.context[0];
    const contextMetadata = env.initialization.contextMetadata;

    if (!contextMetadata[flagContext]) {
      return `The app context "${flagContext}" is not defined in CONTEXT_METADATA.`;
    }

    return null;
  }

  public async validateImportFeatureFlags(
    featureFlagFiles: IImportFile[],
    logger: UpgradeLogger
  ): Promise<ValidatedImportResponse[]> {
    logger.info({ message: 'Validate feature flags' });

    const parsedFeatureFlags = featureFlagFiles.map((featureFlagFile) => {
      try {
        return {
          fileName: featureFlagFile.fileName,
          content: JSON.parse(featureFlagFile.fileContent as string),
        };
      } catch (parseError) {
        logger.error({ message: 'Error in parsing feature flag file', details: parseError });
        return {
          fileName: featureFlagFile.fileName,
          content: null,
        };
      }
    });

    const featureFlagsIds = parsedFeatureFlags
      .filter((parsedFile) => parsedFile.content !== null)
      .map((parsedFile) => parsedFile.content.key);

    const existingFeatureFlags = await this.featureFlagRepository.findBy({ key: In(featureFlagsIds) });
    const seenKeys = [];

    const validationErrors = await Promise.allSettled(
      parsedFeatureFlags.map(async (parsedFile) => {
        if (!parsedFile.content) {
          return {
            fileName: parsedFile.fileName,
            compatibilityType: IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE,
          };
        }

        const featureFlag = parsedFile.content;
        if (seenKeys.includes(featureFlag.key)) {
          return {
            fileName: parsedFile.fileName,
            compatibilityType: IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE,
          };
        }
        seenKeys.push(featureFlag.key);

        const error = await this.validateImportFeatureFlag(parsedFile.fileName, featureFlag, existingFeatureFlags);
        return error;
      })
    );

    // Filter out the files that have no promise rejection errors
    return validationErrors
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value ? result.value : null;
        } else {
          const { fileName, compatibilityType } = result.reason;
          return { fileName: fileName, compatibilityType: compatibilityType };
        }
      })
      .filter((error) => error !== null);
  }

  private async validateImportFeatureFlag(
    fileName: string,
    flag: FeatureFlagImportDataValidation,
    existingFeatureFlags: FeatureFlag[]
  ) {
    let compatibilityType = IMPORT_COMPATIBILITY_TYPE.COMPATIBLE;

    flag = plainToClass(FeatureFlagImportDataValidation, flag);
    await validate(flag, { forbidUnknownValues: true, stopAtFirstError: true }).then((errors) => {
      if (errors.length > 0) {
        compatibilityType = IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;
      }
    });
    if (!(flag instanceof FeatureFlagImportDataValidation)) {
      compatibilityType = IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;
    }

    if (compatibilityType === IMPORT_COMPATIBILITY_TYPE.COMPATIBLE) {
      const contextValidationError = this.validateFeatureFlagContext(flag);
      if (contextValidationError) {
        compatibilityType = IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;
      }

      if (compatibilityType === IMPORT_COMPATIBILITY_TYPE.COMPATIBLE) {
        const keyExists = existingFeatureFlags?.find(
          (existingFlag) => existingFlag.key === flag.key && existingFlag.context[0] === flag.context[0]
        );

        if (keyExists) {
          compatibilityType = IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;
        } else {
          const segmentIdsSet = new Set([
            ...flag.featureFlagSegmentInclusion.flatMap((segmentInclusion) => {
              return segmentInclusion.segment.subSegments.map((subSegment) => subSegment.id);
            }),
            ...flag.featureFlagSegmentExclusion.flatMap((segmentExclusion) => {
              return segmentExclusion.segment.subSegments.map((subSegment) => subSegment.id);
            }),
          ]);

          const segmentIds = Array.from(segmentIdsSet);
          const segments = await this.segmentService.getSegmentByIds(segmentIds);

          if (segmentIds.length !== segments.length) {
            compatibilityType = IMPORT_COMPATIBILITY_TYPE.WARNING;
          }

          segments.forEach((segment) => {
            if (segment == undefined || segment.context !== flag.context[0]) {
              compatibilityType = IMPORT_COMPATIBILITY_TYPE.WARNING;
            }
          });
        }
      }
    }

    return {
      fileName: fileName,
      compatibilityType: compatibilityType,
    };
  }

  public async importFeatureFlagLists(
    featureFlagListFiles: SegmentFile[],
    featureFlagId: string,
    filterType: LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<IImportError[]> {
    logger.info({ message: 'Import feature flags' });
    const validatedFlags = await this.segmentService.checkSegmentsValidity(featureFlagListFiles, true);

    const fileStatusArray = featureFlagListFiles.map((file) => {
      const validation = validatedFlags.importErrors.find((error) => error.fileName === file.fileName);
      const isCompatible = validation && validation.compatibilityType !== IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;

      return {
        fileName: file.fileName,
        error: isCompatible ? validation.compatibilityType : IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE,
      };
    });

    const validFiles: SegmentInputValidator[] = fileStatusArray
      .filter((fileStatus) => fileStatus.error !== IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE)
      .map((fileStatus) => {
        const featureFlagListFile = featureFlagListFiles.find((file) => file.fileName === fileStatus.fileName);
        return this.segmentService.convertJSONStringToSegInputValFormat(featureFlagListFile.fileContent as string);
      });
    const featureFlag = await this.findOneForDetails(featureFlagId, logger);

    const createdLists: (FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion)[] =
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        const listDocs: FeatureFlagListValidator[] = [];
        for (const list of validFiles) {
          const listDoc: FeatureFlagListValidator = {
            enabled: false,
            listType: list.listType,
            id: featureFlagId,
            segment: { ...list, id: crypto.randomUUID(), context: featureFlag.context[0] },
          };

          listDocs.push(listDoc);
        }

        return await this.addList(listDocs, filterType, currentUser, logger, transactionalEntityManager);
      });

    // The outer transaction has committed — recompute now (addList skipped it because it ran
    // inside the transaction) so the imported lists are reflected in feature_flag_precomputed_segment.
    // Unlike the interactive write paths (which fire-and-forget via withRecompute), import intentionally
    // awaits so a successful import response means the precomputed rows are already consistent.
    await this.featureFlagPrecomputedSegmentService.recomputeForFlag(featureFlagId, logger);

    logger.info({ message: 'Imported feature flags', details: createdLists });

    fileStatusArray.forEach((fileStatus) => {
      if (fileStatus.error !== IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE) {
        fileStatus.error = null;
      }
    });
    return fileStatusArray;
  }

  public async exportAllLists(
    id: string,
    filterType: LIST_FILTER_MODE,
    logger: UpgradeLogger
  ): Promise<SegmentInputValidator[] | null> {
    const featureFlag = await this.findOne(id, logger);
    let listsArray: SegmentInputValidator[] = [];
    if (featureFlag) {
      let lists: (FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion)[] = [];
      if (filterType === LIST_FILTER_MODE.INCLUSION) {
        lists = featureFlag.featureFlagSegmentInclusion;
      } else if (filterType === LIST_FILTER_MODE.EXCLUSION) {
        lists = featureFlag.featureFlagSegmentExclusion;
      } else {
        return null;
      }

      if (!lists.length) return [];

      listsArray = lists.map((list) => {
        const { name, description, context, type } = list.segment;
        const listType = list.segment.listType || list.listType;

        const userIds = list.segment.individualForSegment.map((individual) => individual.userId);

        const subSegmentIds = list.segment.subSegments.map((subSegment) => subSegment.id);

        const groups = list.segment.groupForSegment.map((group) => {
          return { type: group.type, groupId: group.groupId };
        });

        const listDoc: SegmentInputValidator = {
          name,
          description,
          context,
          type,
          userIds,
          subSegmentIds,
          groups,
          listType,
        };
        return listDoc;
      });
    } else {
      throw new NotFoundException('Experiment not found.');
    }

    return listsArray;
  }
}
