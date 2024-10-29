import { Service } from 'typedi';
import { FeatureFlag } from '../models/FeatureFlag';
import { Segment } from '../models/Segment';
import { FeatureFlagExposure } from '../models/FeatureFlagExposure';
import { FeatureFlagSegmentInclusion } from '../models/FeatureFlagSegmentInclusion';
import { FeatureFlagSegmentExclusion } from '../models/FeatureFlagSegmentExclusion';
import { FeatureFlagRepository } from '../repositories/FeatureFlagRepository';
import { FeatureFlagSegmentInclusionRepository } from '../repositories/FeatureFlagSegmentInclusionRepository';
import { FeatureFlagSegmentExclusionRepository } from '../repositories/FeatureFlagSegmentExclusionRepository';
import { EntityManager, In, DataSource } from 'typeorm';
import { InjectDataSource, InjectRepository } from '../../typeorm-typedi-extensions';
import { v4 as uuid } from 'uuid';
import { env } from '../../env';
import {
  IFeatureFlagSearchParams,
  IFeatureFlagSortParams,
  FLAG_SEARCH_KEY,
  ValidatedFeatureFlagsError,
  FF_COMPATIBILITY_TYPE,
} from '../controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { FeatureFlagListValidator } from '../controllers/validators/FeatureFlagListValidator';
import {
  SERVER_ERROR,
  FEATURE_FLAG_STATUS,
  FILTER_MODE,
  SEGMENT_TYPE,
  IFeatureFlagFile,
  IImportError,
  LOG_TYPE,
  FeatureFlagDeletedData,
  FeatureFlagCreatedData,
  FeatureFlagStateChangedData,
  FeatureFlagUpdatedData,
  FEATURE_FLAG_LIST_FILTER_MODE,
  FEATURE_FLAG_LIST_OPERATION,
  ListOperationsData,
} from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { FeatureFlagValidation } from '../controllers/validators/FeatureFlagValidator';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentAssignmentService } from './ExperimentAssignmentService';
import { SegmentService } from './SegmentService';
import { ErrorWithType } from '../errors/ErrorWithType';
import { RequestedExperimentUser } from '../controllers/validators/ExperimentUserValidator';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  FeatureFlagImportDataValidation,
  ImportFeatureFlagListValidator,
} from '../controllers/validators/FeatureFlagImportValidator';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { UserDTO } from '../DTO/UserDTO';
import { diffString } from 'json-diff';
import { SegmentRepository } from '../repositories/SegmentRepository';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';

@Service()
export class FeatureFlagService {
  constructor(
    @InjectRepository() private featureFlagRepository: FeatureFlagRepository,
    @InjectRepository() private segmentFlagRepository: SegmentRepository,
    @InjectRepository() private featureFlagSegmentInclusionRepository: FeatureFlagSegmentInclusionRepository,
    @InjectRepository() private featureFlagSegmentExclusionRepository: FeatureFlagSegmentExclusionRepository,
    @InjectRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
    @InjectDataSource() private dataSource: DataSource,
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
    const filteredFeatureFlags = await this.featureFlagRepository.getFlagsFromContext(context);

    const [userExcluded, groupExcluded] = await this.experimentAssignmentService.checkUserOrGroupIsGloballyExcluded(
      experimentUserDoc
    );

    if (userExcluded || groupExcluded.length > 0) {
      return [];
    }

    const includedFeatureFlags = await this.featureFlagLevelInclusionExclusion(filteredFeatureFlags, experimentUserDoc);

    // save exposures in db
    try {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        const exposureRepo = transactionalEntityManager.getRepository(FeatureFlagExposure);
        const exposuresToSave = includedFeatureFlags.map((flag) => ({
          featureFlag: flag,
          experimentUser: experimentUserDoc,
        }));
        if (exposuresToSave.length > 0) {
          await exposureRepo.save(exposuresToSave);
        }
      });
    } catch (err) {
      const error = new Error(`Error in saving feature flag exposure records ${err}`);
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      logger.error(error);
    }

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
      .addOrderBy('LOWER(individualForSegment.userId)', 'ASC')
      .getOne();

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

    // TODO: the type of queryBuilder.getMany() is Promise<FeatureFlag[]>
    // However, the above query returns Promise<(Omit<FeatureFlag, 'featureFlagExposures'> & { featureFlagExposures: number })[]>
    // This can be fixed by using a @VirtualColumn in the FeatureFlag entity, when we are on TypeORM 0.3
    const featureFlagsWithExposures = await queryBuilder
      .loadRelationCountAndMap('feature_flag.featureFlagExposures', 'feature_flag.featureFlagExposures')
      .getMany();

    // Get the feature flag ids
    const featureFlagIds = featureFlagsWithExposures.map(({ id }) => id);

    // Get the relevant segment inclusion documents
    const featureFlagWithInclusionSegments = await this.featureFlagRepository.find({
      select: ['id', 'featureFlagSegmentInclusion'],
      where: { id: In(featureFlagIds) },
      relations: ['featureFlagSegmentInclusion'],
    });

    // Add the inclusion documents to the featureFlagsWithExposures
    return featureFlagsWithExposures.map((featureFlag) => {
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
    });
  }

  public async delete(
    featureFlagId: string,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<FeatureFlag | undefined> {
    logger.info({ message: `Delete Feature Flag => ${featureFlagId}` });
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      const featureFlag = await this.findOne(featureFlagId, logger);

      if (featureFlag) {
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
    flag.id = uuid();
    // saving feature flag doc

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
    const {
      featureFlagSegmentExclusion,
      featureFlagSegmentInclusion,
      versionNumber,
      createdAt,
      updatedAt,
      ...oldFlagDoc
    } = await this.findOne(flag.id);

    let includeList = [...featureFlagSegmentInclusion];
    let excludeList = [...featureFlagSegmentExclusion];

    const includeListIds = includeList.map((list) => list.segment.id);
    const excludeListIds = excludeList.map((list) => list.segment.id);

    return await this.dataSource.transaction(async (transactionalEntityManager) => {
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
            this.createDeleteListAuditLogs(
              includeListIds,
              FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION,
              user,
              transactionalEntityManager
            )
          );
        }

        if (excludeListIds.length) {
          promises.push(
            this.createDeleteListAuditLogs(
              excludeListIds,
              FEATURE_FLAG_LIST_FILTER_MODE.EXCLUSION,
              user,
              transactionalEntityManager
            )
          );
        }

        // Delete segments
        const segmentIds = [...includeListIds, ...excludeListIds];
        if (segmentIds.length) {
          await this.segmentFlagRepository.deleteSegments(segmentIds, logger, transactionalEntityManager);
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
        diff: diffString(newFlagDocClone, oldFlagDocClone),
      };

      await this.experimentAuditLogRepository.saveRawJson(LOG_TYPE.FEATURE_FLAG_UPDATED, updateAuditLog, user);

      return {
        ...featureFlagDoc,
        featureFlagSegmentInclusion: includeList,
        featureFlagSegmentExclusion: excludeList,
      };
    });
  }

  public async deleteList(
    segmentId: string,
    filterType: FEATURE_FLAG_LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<Segment> {
    await this.createDeleteListAuditLogs([segmentId], filterType, currentUser);
    return this.segmentService.deleteSegment(segmentId, logger);
  }

  async createDeleteListAuditLogs(
    segmentIds: string[],
    filterType: FEATURE_FLAG_LIST_FILTER_MODE,
    currentUser: UserDTO,
    entityManager?: EntityManager
  ): Promise<void> {
    const auditLogPromises = [];

    for (const segmentId of segmentIds) {
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
    filterType: FEATURE_FLAG_LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger,
    transactionalEntityManager?: EntityManager
  ): Promise<(FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion)[]> {
    logger.info({ message: `Add ${filterType} list to feature flag` });

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

      const featureFlags = await manager
        .getRepository(FeatureFlag)
        .findByIds(listsInput.map((listInput) => listInput.flagId));

      const featureFlagSegmentInclusionOrExclusionArray = listsInput.map((listInput) => {
        const featureFlagSegmentInclusionOrExclusion =
          filterType === 'inclusion' ? new FeatureFlagSegmentInclusion() : new FeatureFlagSegmentExclusion();
        featureFlagSegmentInclusionOrExclusion.enabled = listInput.enabled;
        featureFlagSegmentInclusionOrExclusion.listType = listInput.listType;
        featureFlagSegmentInclusionOrExclusion.featureFlag = featureFlags.find((flag) => flag.id === listInput.flagId);
        featureFlagSegmentInclusionOrExclusion.segment = newSegments.find(
          (segment) => segment.id === listInput.segment.id
        );
        return featureFlagSegmentInclusionOrExclusion;
      });

      try {
        if (filterType === FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION) {
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

  public async updateList(
    listInput: FeatureFlagListValidator,
    filterType: FEATURE_FLAG_LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion> {
    logger.info({ message: `Update ${filterType} list for feature flag` });
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Find the existing record
      let existingRecord: FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion;
      const featureFlag = await this.findOne(listInput.flagId);

      if (filterType === FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION) {
        existingRecord = await this.featureFlagSegmentInclusionRepository.findOne({
          where: { featureFlag: { id: listInput.flagId }, segment: { id: listInput.segment.id } },
          relations: ['featureFlag', 'segment'],
        });
      } else {
        existingRecord = await this.featureFlagSegmentExclusionRepository.findOne({
          where: { featureFlag: { id: listInput.flagId }, segment: { id: listInput.segment.id } },
          relations: ['featureFlag', 'segment'],
        });
      }

      if (!existingRecord) {
        throw new Error(
          `No existing ${filterType} record found for feature flag ${listInput.flagId} and segment ${listInput.segment.id}`
        );
      }

      const statusChanged = existingRecord.enabled !== listInput.enabled;
      // Update the existing record
      existingRecord.enabled = listInput.enabled;
      existingRecord.listType = listInput.listType;

      const { versionNumber, createdAt, updatedAt, type, ...oldSegmentDoc } = existingRecord.segment;

      const oldSegmentDocClone = JSON.parse(JSON.stringify(oldSegmentDoc));
      let newSegmentDocClone;

      // Update the segment
      try {
        const updatedSegment = await this.segmentService.upsertSegmentInPipeline(
          listInput.segment,
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
        };
      } else {
        listData = {
          listId: existingRecord.segment.id,
          listName: existingRecord.segment.name,
          filterType: filterType,
          operation: FEATURE_FLAG_LIST_OPERATION.UPDATED,
          diff: diffString(newSegmentDocClone, oldSegmentDocClone),
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
      case FLAG_SEARCH_KEY.TAG:
        searchString.push("coalesce(feature_flag.tags::TEXT,'')");
        break;
      default:
        searchString.push("coalesce(feature_flag.name::TEXT,'')");
        searchString.push("coalesce(feature_flag.key::TEXT,'')");
        searchString.push("coalesce(feature_flag.status::TEXT,'')");
        searchString.push("coalesce(feature_flag.context::TEXT,'')");
        searchString.push("coalesce(feature_flag.tags::TEXT,'')");
        break;
    }
    const stringConcat = searchString.join(',');
    const searchStringConcatenated = `concat_ws(' ', ${stringConcat})`;
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

  public async importFeatureFlags(
    featureFlagFiles: IFeatureFlagFile[],
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<IImportError[]> {
    logger.info({ message: 'Import feature flags' });
    const validatedFlags = await this.validateImportFeatureFlags(featureFlagFiles, logger);

    const fileStatusArray = featureFlagFiles.map((file) => {
      const validation = validatedFlags.find((error) => error.fileName === file.fileName);
      const isCompatible = validation && validation.compatibilityType !== FF_COMPATIBILITY_TYPE.INCOMPATIBLE;

      return {
        fileName: file.fileName,
        error: isCompatible ? validation.compatibilityType : FF_COMPATIBILITY_TYPE.INCOMPATIBLE,
      };
    });

    const validFiles: FeatureFlagImportDataValidation[] = await Promise.all(
      fileStatusArray
        .filter((fileStatus) => fileStatus.error !== FF_COMPATIBILITY_TYPE.INCOMPATIBLE)
        .map(async (fileStatus) => {
          const featureFlagFile = featureFlagFiles.find((file) => file.fileName === fileStatus.fileName);

          if (fileStatus.error === FF_COMPATIBILITY_TYPE.WARNING) {
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
          segmentInclusionList.segment.id = uuid();

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
            flagId: newFlag.id,
            segment: { ...segmentInclusionList.segment, userIds, subSegmentIds, groups },
          };
        });

        const featureFlagSegmentExclusionList = featureFlag.featureFlagSegmentExclusion.map((segmentExclusionList) => {
          segmentExclusionList.segment.id = uuid();

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
            flagId: newFlag.id,
            segment: { ...segmentExclusionList.segment, userIds, subSegmentIds, groups },
          };
        });

        const [inclusionDoc, exclusionDoc] = await Promise.all([
          this.addList(
            featureFlagSegmentInclusionList,
            FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION,
            currentUser,
            logger,
            transactionalEntityManager
          ),
          this.addList(
            featureFlagSegmentExclusionList,
            FEATURE_FLAG_LIST_FILTER_MODE.EXCLUSION,
            currentUser,
            logger,
            transactionalEntityManager
          ),
        ]);

        return { ...newFlag, featureFlagSegmentInclusion: inclusionDoc, featureFlagSegmentExclusion: exclusionDoc };
      });

      createdFlags.push(createdFlag);
    }
    logger.info({ message: 'Imported feature flags', details: createdFlags });

    fileStatusArray.forEach((fileStatus) => {
      if (fileStatus.error !== FF_COMPATIBILITY_TYPE.INCOMPATIBLE) {
        fileStatus.error = null;
      }
    });
    return fileStatusArray;
  }

  public async validateImportFeatureFlags(
    featureFlagFiles: IFeatureFlagFile[],
    logger: UpgradeLogger
  ): Promise<ValidatedFeatureFlagsError[]> {
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
            compatibilityType: FF_COMPATIBILITY_TYPE.INCOMPATIBLE,
          };
        }

        const featureFlag = parsedFile.content;
        if (seenKeys.includes(featureFlag.key)) {
          return {
            fileName: parsedFile.fileName,
            compatibilityType: FF_COMPATIBILITY_TYPE.INCOMPATIBLE,
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
    let compatibilityType = FF_COMPATIBILITY_TYPE.COMPATIBLE;

    flag = plainToClass(FeatureFlagImportDataValidation, flag);
    await validate(flag, { forbidUnknownValues: true, stopAtFirstError: true }).then((errors) => {
      if (errors.length > 0) {
        compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
      }
    });
    if (!(flag instanceof FeatureFlagImportDataValidation)) {
      compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
    }

    if (compatibilityType === FF_COMPATIBILITY_TYPE.COMPATIBLE) {
      const keyExists = existingFeatureFlags?.find(
        (existingFlag) => existingFlag.key === flag.key && existingFlag.context[0] === flag.context[0]
      );

      if (keyExists) {
        compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
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
          compatibilityType = FF_COMPATIBILITY_TYPE.WARNING;
        }

        segments.forEach((segment) => {
          if (segment == undefined || segment.context !== flag.context[0]) {
            compatibilityType = FF_COMPATIBILITY_TYPE.WARNING;
          }
        });
      }
    }

    return {
      fileName: fileName,
      compatibilityType: compatibilityType,
    };
  }

  public async importFeatureFlagLists(
    featureFlagListFiles: IFeatureFlagFile[],
    featureFlagId: string,
    listType: FEATURE_FLAG_LIST_FILTER_MODE,
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<IImportError[]> {
    logger.info({ message: 'Import feature flags' });
    const validatedFlags = await this.validateImportFeatureFlagLists(featureFlagListFiles, featureFlagId, logger);

    const fileStatusArray = featureFlagListFiles.map((file) => {
      const validation = validatedFlags.find((error) => error.fileName === file.fileName);
      const isCompatible = validation && validation.compatibilityType !== FF_COMPATIBILITY_TYPE.INCOMPATIBLE;

      return {
        fileName: file.fileName,
        error: isCompatible ? validation.compatibilityType : FF_COMPATIBILITY_TYPE.INCOMPATIBLE,
      };
    });

    const validFiles: ImportFeatureFlagListValidator[] = fileStatusArray
      .filter((fileStatus) => fileStatus.error !== FF_COMPATIBILITY_TYPE.INCOMPATIBLE)
      .map((fileStatus) => {
        const featureFlagListFile = featureFlagListFiles.find((file) => file.fileName === fileStatus.fileName);
        return JSON.parse(featureFlagListFile.fileContent as string);
      });

    const createdLists: (FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion)[] =
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        const listDocs: FeatureFlagListValidator[] = [];
        for (const list of validFiles) {
          const listDoc: FeatureFlagListValidator = {
            ...list,
            enabled: false,
            flagId: featureFlagId,
            segment: { ...list.segment, id: uuid() },
          };

          listDocs.push(listDoc);
        }

        return await this.addList(listDocs, listType, currentUser, logger, transactionalEntityManager);
      });

    logger.info({ message: 'Imported feature flags', details: createdLists });

    fileStatusArray.forEach((fileStatus) => {
      if (fileStatus.error !== FF_COMPATIBILITY_TYPE.INCOMPATIBLE) {
        fileStatus.error = null;
      }
    });
    return fileStatusArray;
  }

  public async validateImportFeatureFlagLists(
    featureFlagFiles: IFeatureFlagFile[],
    featureFlagId: string,
    logger: UpgradeLogger
  ): Promise<ValidatedFeatureFlagsError[]> {
    logger.info({ message: 'Validate feature flag lists' });

    const parsedFeatureFlagLists = featureFlagFiles.map((featureFlagFile) => {
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

    const featureFlag = await this.findOne(featureFlagId, logger);

    const validationErrors = await Promise.allSettled(
      parsedFeatureFlagLists.map(async (parsedFile) => {
        if (!featureFlag) {
          return {
            fileName: parsedFile.fileName,
            compatibilityType: FF_COMPATIBILITY_TYPE.INCOMPATIBLE,
          };
        }

        if (!parsedFile.content) {
          return {
            fileName: parsedFile.fileName,
            compatibilityType: FF_COMPATIBILITY_TYPE.INCOMPATIBLE,
          };
        }
        return this.validateImportFeatureFlagList(parsedFile.fileName, featureFlag, parsedFile.content);
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

  public async validateImportFeatureFlagList(
    fileName: string,
    flag: FeatureFlag,
    list: ImportFeatureFlagListValidator
  ) {
    let compatibilityType = FF_COMPATIBILITY_TYPE.COMPATIBLE;

    list = plainToClass(ImportFeatureFlagListValidator, list);
    await validate(list, { forbidUnknownValues: true, stopAtFirstError: true }).then((errors) => {
      if (errors.length > 0) {
        compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
      }
    });

    if (!(list instanceof ImportFeatureFlagListValidator)) {
      compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
    }

    if (list?.segment?.context !== flag.context[0]) {
      compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
    }

    if (compatibilityType === FF_COMPATIBILITY_TYPE.COMPATIBLE) {
      if (list.listType === 'Segment') {
        const segments = await this.segmentService.getSegmentByIds(list.segment.subSegmentIds);

        if (!segments.length) {
          compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
        }

        segments?.forEach((segment) => {
          if (!segment || segment.context !== flag.context[0]) {
            compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
          }
        });
      } else if (list.listType !== 'Individual' && list.segment.groups.length) {
        const contextMetaData = env.initialization.contextMetadata;
        const groupTypes = contextMetaData[flag.context[0]].GROUP_TYPES;
        if (!groupTypes.includes(list.listType)) {
          compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
        }

        list.segment.groups.forEach((group) => {
          if (group.type !== list.listType) {
            compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
          }
        });
      }
    }

    return {
      fileName: fileName,
      compatibilityType: compatibilityType,
    };
  }
}
