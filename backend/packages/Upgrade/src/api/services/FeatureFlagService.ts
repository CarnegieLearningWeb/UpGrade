import { Service } from 'typedi';
import { FeatureFlag } from '../models/FeatureFlag';
import { Segment } from '../models/Segment';
import { FeatureFlagSegmentInclusion } from '../models/FeatureFlagSegmentInclusion';
import { FeatureFlagSegmentExclusion } from '../models/FeatureFlagSegmentExclusion';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { FeatureFlagRepository } from '../repositories/FeatureFlagRepository';
import { FeatureFlagSegmentInclusionRepository } from '../repositories/FeatureFlagSegmentInclusionRepository';
import { FeatureFlagSegmentExclusionRepository } from '../repositories/FeatureFlagSegmentExclusionRepository';
import { getConnection } from 'typeorm';
import { v4 as uuid } from 'uuid';
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
  EXPERIMENT_LOG_TYPE,
  FeatureFlagDeletedData,
  FeatureFlagCreatedData,
  FeatureFlagStateChangedData,
  FeatureFlagUpdatedData,
  FEATURE_FLAG_LIST_FILTER_MODE,
  FEATURE_FLAG_LIST_OPERATION,
  ListOperationsData
} from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { FeatureFlagValidation } from '../controllers/validators/FeatureFlagValidator';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentAssignmentService } from './ExperimentAssignmentService';
import { SegmentService } from './SegmentService';
import { ErrorWithType } from '../errors/ErrorWithType';
import { RequestedExperimentUser } from '../controllers/validators/ExperimentUserValidator';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { User } from '../models/User';
import { diffString } from 'json-diff';

@Service()
export class FeatureFlagService {
  constructor(
    @InjectRepository() private featureFlagRepository: FeatureFlagRepository,
    @InjectRepository() private featureFlagSegmentInclusionRepository: FeatureFlagSegmentInclusionRepository,
    @InjectRepository() private featureFlagSegmentExclusionRepository: FeatureFlagSegmentExclusionRepository,
    @InjectRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
    public experimentAssignmentService: ExperimentAssignmentService,
    public segmentService: SegmentService
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

    const filteredFeatureFlags = await this.featureFlagRepository.getFlagsFromContext(context);

    const includedFeatureFlags = await this.featureFlagLevelInclusionExclusion(filteredFeatureFlags, experimentUserDoc);

    return includedFeatureFlags.map((flags) => flags.key);
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
      .getOne();

    return featureFlag;
  }

  public create(flagDTO: FeatureFlagValidation, currentUser: User, logger: UpgradeLogger): Promise<FeatureFlag> {
    logger.info({ message: 'Create a new feature flag', details: flagDTO });
    return this.addFeatureFlagInDB(this.featureFlagValidatorToFlag(flagDTO), currentUser, logger);
  }

  public getTotalCount(): Promise<number> {
    return this.featureFlagRepository.count();
  }

  public findPaginated(
    skip: number,
    take: number,
    logger: UpgradeLogger,
    searchParams?: IFeatureFlagSearchParams,
    sortParams?: IFeatureFlagSortParams
  ): Promise<FeatureFlag[]> {
    logger.info({ message: 'Find paginated Feature flags' });

    let queryBuilder = this.featureFlagRepository.createQueryBuilder('feature_flag');
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
      queryBuilder = queryBuilder.addOrderBy(`feature_flag.${sortParams.key}`, sortParams.sortAs);
    }

    queryBuilder = queryBuilder.offset(skip).limit(take);
    return queryBuilder.getMany();
  }

  public async delete(featureFlagId: string, currentUser: User, logger: UpgradeLogger): Promise<FeatureFlag | undefined> {
    logger.info({ message: `Delete Feature Flag => ${featureFlagId}` });
    return getConnection().transaction(async (transactionalEntityManager) => {
      const featureFlag = await this.findOne(featureFlagId, logger);

      if (featureFlag) {
        const deletedFlag = await this.featureFlagRepository.deleteById(featureFlagId, transactionalEntityManager);

        featureFlag.featureFlagSegmentInclusion.forEach(async (segmentInclusion) => {
          try {
            await transactionalEntityManager.getRepository(Segment).delete(segmentInclusion.segment.id);
          } catch (err) {
            const error = err as ErrorWithType;
            error.details = 'Error in deleting Feature Flag Included Segment fron DB';
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
            error.details = 'Error in deleting Feature Flag Excluded Segment fron DB';
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
          EXPERIMENT_LOG_TYPE.FEATURE_FLAG_DELETED,
          createAuditLogData,
          currentUser
        );
        return deletedFlag;
      }
      return undefined;
    });
  }

  public async updateState(flagId: string, status: FEATURE_FLAG_STATUS, currentUser: User): Promise<FeatureFlag> {
    const oldFeatureFlag = await this.findOne(flagId);
    let updatedState: FeatureFlag;
    try {
      updatedState = await this.featureFlagRepository.updateState(flagId, status);
    } catch (err) {
      const error = new Error(`Error in updating feature flag status ${err}`);
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      throw error;
    }

    // TODO: Add log for updating flag state
    let data: FeatureFlagStateChangedData = {
      flagId,
      flagName: oldFeatureFlag.name,
      previousState: oldFeatureFlag.status,
      newState: status,
    };

    await this.experimentAuditLogRepository.saveRawJson(
      EXPERIMENT_LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED,
      data,
      currentUser
    );
    return updatedState;
  }

  public async updateFilterMode(flagId: string, filterMode: FILTER_MODE, currentUser: User): Promise<FeatureFlag> {
    let updatedFilterMode: FeatureFlag;
    try {
      updatedFilterMode = await this.featureFlagRepository.updateFilterMode(flagId, filterMode);
    } catch (err) {
      const error = new Error(`Error in updating feature flag filter mode ${err}`);
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      throw error;
    }

    // TODO: Add log for updating filter mode
    let data: FeatureFlagUpdatedData = {
      flagId,
      flagName: updatedFilterMode.name,
      filterMode: filterMode,
    };

    await this.experimentAuditLogRepository.saveRawJson(
      EXPERIMENT_LOG_TYPE.FEATURE_FLAG_UPDATED,
      data,
      currentUser
    );
    return updatedFilterMode;
  }

  public async exportDesignLog(flagName, currentUser) {
    const exportAuditLog: FeatureFlagDeletedData = {
      flagName: flagName,
    };

    return await this.experimentAuditLogRepository.saveRawJson(
      EXPERIMENT_LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED,
      exportAuditLog,
      currentUser,
    );
  }

  public update(flagDTO: FeatureFlagValidation, currentUser: User, logger: UpgradeLogger): Promise<FeatureFlag> {
    logger.info({ message: `Update a Feature Flag => ${flagDTO.toString()}` });
    // TODO add entry in log of updating feature flag
    return this.updateFeatureFlagInDB(this.featureFlagValidatorToFlag(flagDTO), currentUser, logger);
  }

  private async addFeatureFlagInDB(flag: FeatureFlag, user: User, logger: UpgradeLogger): Promise<FeatureFlag> {
    flag.id = uuid();
    // saving feature flag doc
    let featureFlagDoc: FeatureFlag;
    await getConnection().transaction(async (transactionalEntityManager) => {
      try {
        featureFlagDoc = (
          await this.featureFlagRepository.insertFeatureFlag(flag as any, transactionalEntityManager)
        )[0];
      } catch (err) {
        const error = new Error(`Error in creating feature flag document "addFeatureFlagInDB" ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }
    });

    // TODO: Add log for feature flag creation
    const createAuditLogData: FeatureFlagCreatedData = {
      flagId: featureFlagDoc.id,
      flagName: featureFlagDoc.name,
    };
    await this.experimentAuditLogRepository.saveRawJson(
      EXPERIMENT_LOG_TYPE.FEATURE_FLAG_CREATED,
      createAuditLogData,
      user
    );
    return featureFlagDoc;
  }

  private async updateFeatureFlagInDB(flag: FeatureFlag, user: User, logger: UpgradeLogger): Promise<FeatureFlag> {
    const {
      featureFlagSegmentExclusion,
      featureFlagSegmentInclusion,
      versionNumber,
      createdAt,
      updatedAt,
      ...oldFlagDoc
    } = await this.findOne(flag.id);
    return getConnection().transaction(async (transactionalEntityManager) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        featureFlagSegmentExclusion,
        featureFlagSegmentInclusion,
        versionNumber,
        createdAt,
        updatedAt,
        ...flagDoc
      } = flag;
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
      // update AuditLogs here
      const updateAuditLog: FeatureFlagUpdatedData = {
        flagId: featureFlagDoc.id,
        flagName: featureFlagDoc.name,
        diff: diffString(newFlagDocClone, oldFlagDocClone),
      };

      await this.experimentAuditLogRepository.saveRawJson(
        EXPERIMENT_LOG_TYPE.FEATURE_FLAG_UPDATED,
        updateAuditLog,
        user
      );
      return featureFlagDoc;
    });
  }

  public async deleteList(segmentId: string, filterType: FEATURE_FLAG_LIST_FILTER_MODE, currentUser: User, logger: UpgradeLogger): Promise<Segment> {
    let existingRecord: FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion;
    if (filterType === FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION) {
      existingRecord = await this.featureFlagSegmentInclusionRepository.findOne({
        where: { segment: { id: segmentId } },
        relations: ['featureFlag', 'segment'],
      });
    } else {
      existingRecord = await this.featureFlagSegmentExclusionRepository.findOne({
        where: { segment: { id: segmentId } },
        relations: ['featureFlag', 'segment'],
      });
    }

    // delete list AuditLogs here
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

    await this.experimentAuditLogRepository.saveRawJson(
      EXPERIMENT_LOG_TYPE.FEATURE_FLAG_UPDATED,
      updateAuditLog,
      currentUser,
    );

    return this.segmentService.deleteSegment(segmentId, logger);
  }

  public async addList(
    listInput: FeatureFlagListValidator,
    filterType: FEATURE_FLAG_LIST_FILTER_MODE,
    currentUser: User,
    logger: UpgradeLogger
  ): Promise<FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion> {
    logger.info({ message: `Add ${filterType} list to feature flag` });
    const createdList = await getConnection().transaction(async (transactionalEntityManager) => {
      const featureFlagSegmentInclusionOrExclusion =
        filterType === FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION ? new FeatureFlagSegmentInclusion() : new FeatureFlagSegmentExclusion();
      featureFlagSegmentInclusionOrExclusion.enabled = listInput.enabled;
      featureFlagSegmentInclusionOrExclusion.listType = listInput.listType;
      const featureFlag = await this.featureFlagRepository.findOne(listInput.flagId);

      featureFlagSegmentInclusionOrExclusion.featureFlag = featureFlag;

      // create a new private segment
      listInput.list.type = SEGMENT_TYPE.PRIVATE;
      let newSegment: Segment;
      try {
        newSegment = await this.segmentService.upsertSegmentInPipeline(
          listInput.list,
          logger,
          transactionalEntityManager
        );
      } catch (err) {
        const error = new Error(`Error in creating private segment for feature flag ${filterType} list ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }
      featureFlagSegmentInclusionOrExclusion.segment = newSegment;
      // }

      try {
        if (filterType === FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION) {
          await this.featureFlagSegmentInclusionRepository.insertData(
            featureFlagSegmentInclusionOrExclusion,
            logger,
            transactionalEntityManager
          );
        } else {
          await this.featureFlagSegmentExclusionRepository.insertData(
            featureFlagSegmentInclusionOrExclusion,
            logger,
            transactionalEntityManager
          );
        }
      } catch (err) {
        const error = new Error(`Error in adding segment for feature flag ${filterType} list ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      // add list AuditLogs here
      const updateAuditLog: FeatureFlagUpdatedData = {
        flagId: featureFlag.id,
        flagName: featureFlag.name,
        list: {
          listId: featureFlagSegmentInclusionOrExclusion.segment.id,
          listName: featureFlagSegmentInclusionOrExclusion.segment.name,
          filterType: filterType,
          operation: FEATURE_FLAG_LIST_OPERATION.CREATED,
        },
      };

      await this.experimentAuditLogRepository.saveRawJson(
        EXPERIMENT_LOG_TYPE.FEATURE_FLAG_UPDATED,
        updateAuditLog,
        currentUser,
      );
      return featureFlagSegmentInclusionOrExclusion;
    });
    return createdList;
  }

  public async updateList(
    listInput: FeatureFlagListValidator,
    filterType: FEATURE_FLAG_LIST_FILTER_MODE,
    currentUser: User,
    logger: UpgradeLogger
  ): Promise<FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion> {
    logger.info({ message: `Update ${filterType} list for feature flag` });
    return await getConnection().transaction(async (transactionalEntityManager) => {
      // Find the existing record
      let existingRecord: FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion;
      const featureFlag = await this.featureFlagRepository.findOne(listInput.flagId);

      if (filterType === FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION) {
        existingRecord = await this.featureFlagSegmentInclusionRepository.findOne({
          where: { featureFlag: { id: listInput.flagId }, segment: { id: listInput.list.id } },
          relations: ['featureFlag', 'segment'],
        });
      } else {
        existingRecord = await this.featureFlagSegmentExclusionRepository.findOne({
          where: { featureFlag: { id: listInput.flagId }, segment: { id: listInput.list.id } },
          relations: ['featureFlag', 'segment'],
        });
      }

      if (!existingRecord) {
        throw new Error(
          `No existing ${filterType} record found for feature flag ${listInput.flagId} and segment ${listInput.list.id}`
        );
      }

      const statusChanged = existingRecord.enabled !== listInput.enabled;
      // Update the existing record
      existingRecord.enabled = listInput.enabled;
      existingRecord.listType = listInput.listType;

      const {
        versionNumber,
        createdAt,
        updatedAt,
        type,
        ...oldSegmentDoc
      } = existingRecord.segment;

      const oldSegmentDocClone = JSON.parse(JSON.stringify(oldSegmentDoc));
      let newSegmentDocClone;

      // Update the segment
      try {
        const updatedSegment = await this.segmentService.upsertSegmentInPipeline(
          listInput.list,
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
        const error = new Error(`Error in updating private segment for feature flag ${filterType} list: ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      // Save the updated record
      try {
        if (filterType === FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION) {
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
          }
      } else {
        listData = {
            listId: existingRecord.segment.id,
            listName: existingRecord.segment.name,
            filterType: filterType,
            operation: FEATURE_FLAG_LIST_OPERATION.UPDATED,
            diff: diffString(newSegmentDocClone, oldSegmentDocClone),
          }
      }

      // update list AuditLogs here
      const updateAuditLog: FeatureFlagUpdatedData = {
        flagId: featureFlag.id,
        flagName: featureFlag.name,
        list: listData,
      };

      await this.experimentAuditLogRepository.saveRawJson(
        EXPERIMENT_LOG_TYPE.FEATURE_FLAG_UPDATED,
        updateAuditLog,
        currentUser,
      );

      return existingRecord;
    });
  }

  private postgresSearchString(type: FLAG_SEARCH_KEY): string {
    const searchString: string[] = [];
    switch (type) {
      case FLAG_SEARCH_KEY.NAME:
        searchString.push("coalesce(feature_flag.name::TEXT,'')");
        break;
      case FLAG_SEARCH_KEY.KEY:
        searchString.push("coalesce(feature_flag.key::TEXT,'')");
        break;
      case FLAG_SEARCH_KEY.STATUS:
        searchString.push("coalesce(feature_flag.status::TEXT,'')");
        break;
      case FLAG_SEARCH_KEY.CONTEXT:
        searchString.push("coalesce(feature_flag.context::TEXT,'')");
        break;
      default:
        searchString.push("coalesce(feature_flag.name::TEXT,'')");
        searchString.push("coalesce(feature_flag.key::TEXT,'')");
        searchString.push("coalesce(feature_flag.status::TEXT,'')");
        searchString.push("coalesce(feature_flag.context::TEXT,'')");
        break;
    }
    const stringConcat = searchString.join(',');
    const searchStringConcatenated = `concat_ws(' ', ${stringConcat})`;
    return searchStringConcatenated;
  }

  private featureFlagValidatorToFlag(flagDTO: FeatureFlagValidation) {
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
    featureFlags: FeatureFlag[],
    experimentUser: ExperimentUser
  ): Promise<FeatureFlag[]> {
    const segmentObjMap = {};
    featureFlags.forEach((flag) => {
      const includeIds = flag.featureFlagSegmentInclusion
        .filter((inclusion) => inclusion.enabled)
        .map((segmentInclusion) => segmentInclusion.segment.id);
      const excludeIds = flag.featureFlagSegmentExclusion
        .filter((exclusion) => exclusion.enabled)
        .map((segmentExclusion) => segmentExclusion.segment.id);

      segmentObjMap[flag.id] = {
        segmentIdsQueue: [...includeIds, ...excludeIds],
        currentIncludedSegmentIds: includeIds,
        currentExcludedSegmentIds: excludeIds,
        allIncludedSegmentIds: includeIds,
        allExcludedSegmentIds: excludeIds,
      };
    });

    const featureFlagIdsWithFilter: { id: string; filterMode: FILTER_MODE }[] = featureFlags.map(
      ({ id, filterMode }) => ({ id, filterMode })
    );

    const [includedFeatureFlagIds] = await this.experimentAssignmentService.inclusionExclusionLogic(
      segmentObjMap,
      experimentUser,
      featureFlagIdsWithFilter
    );

    const includedFeatureFlags = featureFlags.filter(({ id }) => includedFeatureFlagIds.includes(id));
    return includedFeatureFlags;
  }
}
