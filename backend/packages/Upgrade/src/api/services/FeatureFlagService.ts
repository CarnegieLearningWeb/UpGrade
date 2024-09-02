import { Service } from 'typedi';
import { FeatureFlag } from '../models/FeatureFlag';
import { Segment } from '../models/Segment';
import { FeatureFlagExposure } from '../models/FeatureFlagExposure';
import { FeatureFlagSegmentInclusion } from '../models/FeatureFlagSegmentInclusion';
import { FeatureFlagSegmentExclusion } from '../models/FeatureFlagSegmentExclusion';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { FeatureFlagRepository } from '../repositories/FeatureFlagRepository';
import { FeatureFlagSegmentInclusionRepository } from '../repositories/FeatureFlagSegmentInclusionRepository';
import { FeatureFlagSegmentExclusionRepository } from '../repositories/FeatureFlagSegmentExclusionRepository';
import { EntityManager, getConnection, getRepository, In } from 'typeorm';
import { v4 as uuid } from 'uuid';
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
import { FeatureFlagImportDataValidation } from '../controllers/validators/FeatureFlagImportValidator';

@Service()
export class FeatureFlagService {
  constructor(
    @InjectRepository() private featureFlagRepository: FeatureFlagRepository,
    @InjectRepository() private featureFlagSegmentInclusionRepository: FeatureFlagSegmentInclusionRepository,
    @InjectRepository() private featureFlagSegmentExclusionRepository: FeatureFlagSegmentExclusionRepository,
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

    // save exposures in db
    try {
      const exposureRepo = getRepository(FeatureFlagExposure);
      const exposuresToSave = includedFeatureFlags.map((flag) => ({
        featureFlag: flag,
        experimentUser: experimentUserDoc,
      }));
      if (exposuresToSave.length > 0) {
        await exposureRepo.save(exposuresToSave);
      }
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
      .getOne();

    return featureFlag;
  }

  public create(flagDTO: FeatureFlagValidation, logger: UpgradeLogger): Promise<FeatureFlag> {
    logger.info({ message: 'Create a new feature flag', details: flagDTO });
    return this.addFeatureFlagInDB(this.featureFlagValidatorToFlag(flagDTO), logger);
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

    let queryBuilder = this.featureFlagRepository
      .createQueryBuilder('feature_flag')
      .loadRelationCountAndMap('feature_flag.featureFlagExposures', 'feature_flag.featureFlagExposures');
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
    return queryBuilder.getMany();
  }

  public async delete(featureFlagId: string, logger: UpgradeLogger): Promise<FeatureFlag | undefined> {
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
        return deletedFlag;
      }
      return undefined;
    });
  }

  public async updateState(flagId: string, status: FEATURE_FLAG_STATUS): Promise<FeatureFlag> {
    // TODO: Add log for updating flag state
    let updatedState: FeatureFlag;
    try {
      updatedState = await this.featureFlagRepository.updateState(flagId, status);
    } catch (err) {
      const error = new Error(`Error in updating feature flag status ${err}`);
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      throw error;
    }
    return updatedState;
  }

  public async updateFilterMode(flagId: string, filterMode: FILTER_MODE): Promise<FeatureFlag> {
    // TODO: Add log for updating filter mode
    let updatedFilterMode: FeatureFlag;
    try {
      updatedFilterMode = await this.featureFlagRepository.updateFilterMode(flagId, filterMode);
    } catch (err) {
      const error = new Error(`Error in updating feature flag filter mode ${err}`);
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      throw error;
    }
    return updatedFilterMode;
  }

  public update(flagDTO: FeatureFlagValidation, logger: UpgradeLogger): Promise<FeatureFlag> {
    logger.info({ message: `Update a Feature Flag => ${flagDTO.toString()}` });
    // TODO add entry in log of updating feature flag
    return this.updateFeatureFlagInDB(this.featureFlagValidatorToFlag(flagDTO), logger);
  }

  private async addFeatureFlagInDB(
    flag: FeatureFlag,
    logger: UpgradeLogger,
    entityManager?: EntityManager
  ): Promise<FeatureFlag> {
    flag.id = uuid();
    // saving feature flag doc

    const executeTransaction = async (manager: EntityManager): Promise<FeatureFlag> => {
      try {
        const featureFlagDoc = (await this.featureFlagRepository.insertFeatureFlag(flag as any, manager))[0];
        return featureFlagDoc;
      } catch (err) {
        const error = new Error(`Error in creating feature flag document "addFeatureFlagInDB" ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }
    };

    // TODO: Add log for feature flag creation
    if (entityManager) {
      // Use the provided entity manager
      return await executeTransaction(entityManager);
    } else {
      // Create a new transaction if no entity manager is provided
      return await getConnection().transaction(async (manager) => {
        return await executeTransaction(manager);
      });
    }
  }

  private async updateFeatureFlagInDB(flag: FeatureFlag, logger: UpgradeLogger): Promise<FeatureFlag> {
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
      return featureFlagDoc;
    });
  }

  public async deleteList(segmentId: string, logger: UpgradeLogger): Promise<Segment> {
    return this.segmentService.deleteSegment(segmentId, logger);
  }

  public async addList(
    listsInput: FeatureFlagListValidator[],
    filterType: string,
    logger: UpgradeLogger,
    transactionalEntityManager?: EntityManager
  ): Promise<(FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion)[]> {
    logger.info({ message: `Add ${filterType} list to feature flag` });

    const executeTransaction = async (manager: EntityManager) => {
      // create a new private segment
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
        const error = new Error(`Error in creating private segment for feature flag ${filterType} list ${err}`);
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
        if (filterType === 'inclusion') {
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
        const error = new Error(`Error in adding segment for feature flag ${filterType} list ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }
      return featureFlagSegmentInclusionOrExclusionArray;
    };

    if (transactionalEntityManager) {
      // Use the provided entity manager
      return await executeTransaction(transactionalEntityManager);
    } else {
      // Create a new transaction if no entity manager is provided
      return await getConnection().transaction(async (manager) => {
        return await executeTransaction(manager);
      });
    }
  }

  public async updateList(
    listInput: FeatureFlagListValidator,
    filterType: string,
    logger: UpgradeLogger
  ): Promise<FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion> {
    logger.info({ message: `Update ${filterType} list for feature flag` });
    return await getConnection().transaction(async (transactionalEntityManager) => {
      // Find the existing record
      let existingRecord: FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion;
      if (filterType === 'inclusion') {
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

      // Update the existing record
      existingRecord.enabled = listInput.enabled;
      existingRecord.listType = listInput.listType;

      // Update the segment
      try {
        const updatedSegment = await this.segmentService.upsertSegmentInPipeline(
          listInput.segment,
          logger,
          transactionalEntityManager
        );
        existingRecord.segment = updatedSegment;
      } catch (err) {
        const error = new Error(`Error in updating private segment for feature flag ${filterType} list: ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      // Save the updated record
      try {
        if (filterType === 'inclusion') {
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
    logger: UpgradeLogger
  ): Promise<IImportError[]> {
    logger.info({ message: 'Import feature flags' });
    const validatedFlags = await this.validateImportFeatureFlags(featureFlagFiles, logger);

    const fileStatusArray = featureFlagFiles.map((file) => {
      const validation = validatedFlags.find((error) => error.fileName === file.fileName);
      const isCompatible = validation && validation.compatibilityType !== FF_COMPATIBILITY_TYPE.INCOMPATIBLE;

      return {
        fileName: file.fileName,
        error: isCompatible ? null : FF_COMPATIBILITY_TYPE.INCOMPATIBLE,
      };
    });

    const validFiles: FeatureFlagImportDataValidation[] = fileStatusArray
      .filter((fileStatus) => fileStatus.error === null)
      .map((fileStatus) => {
        const featureFlagFile = featureFlagFiles.find((file) => file.fileName === fileStatus.fileName);
        return JSON.parse(featureFlagFile.fileContent as string);
      });

    const createdFlags = [];

    for (const featureFlag of validFiles) {
      const createdFlag = await getConnection().transaction(async (transactionalEntityManager) => {
        const newFlag = await this.addFeatureFlagInDB(
          this.featureFlagValidatorToFlag(featureFlag),
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
          this.addList(featureFlagSegmentInclusionList, 'inclusion', logger, transactionalEntityManager),
          this.addList(featureFlagSegmentExclusionList, 'exclusion', logger, transactionalEntityManager),
        ]);

        return { ...newFlag, featureFlagSegmentInclusion: inclusionDoc, featureFlagSegmentExclusion: exclusionDoc };
      });

      createdFlags.push(createdFlag);
    }
    logger.info({ message: 'Imported feature flags', details: createdFlags });
    return fileStatusArray;
  }
  public async validateImportFeatureFlags(
    featureFlagFiles: IFeatureFlagFile[],
    logger: UpgradeLogger
  ): Promise<ValidatedFeatureFlagsError[]> {
    logger.info({ message: 'Validate feature flags' });

    const featureFlagsIds = featureFlagFiles
      .map((featureFlagFile) => {
        try {
          return JSON.parse(featureFlagFile.fileContent as string).key;
        } catch (parseError) {
          return null;
        }
      })
      .filter((key) => key !== null);
    const existingFeatureFlags = await this.featureFlagRepository.find({ key: In(featureFlagsIds) });

    const validationErrors = await Promise.allSettled(
      featureFlagFiles.map(async (featureFlagFile) => {
        let featureFlag: FeatureFlagImportDataValidation;
        try {
          featureFlag = JSON.parse(featureFlagFile.fileContent as string);
        } catch (parseError) {
          logger.error({ message: 'Error in parsing feature flag file', details: parseError });
          return {
            fileName: featureFlagFile.fileName,
            compatibilityType: FF_COMPATIBILITY_TYPE.INCOMPATIBLE,
          };
        }

        const error = await this.validateImportFeatureFlag(featureFlagFile.fileName, featureFlag, existingFeatureFlags);
        return error;
      })
    );
    // Filter out the files that have no promise rejection errors
    return validationErrors
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
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
    await validate(flag).then((errors) => {
      if (errors.length > 0) {
        compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
      }
    });

    if (compatibilityType === FF_COMPATIBILITY_TYPE.COMPATIBLE) {
      const keyExists = existingFeatureFlags.find((existingFlag) => existingFlag.key === flag.key);

      if (keyExists) {
        compatibilityType = FF_COMPATIBILITY_TYPE.INCOMPATIBLE;
      } else {
        const segmentIds = [
          ...flag.featureFlagSegmentInclusion.flatMap((segmentInclusion) => {
            return segmentInclusion.segment.subSegments.map((subSegment) => subSegment.id);
          }),
          ...flag.featureFlagSegmentExclusion.flatMap((segmentExclusion) => {
            return segmentExclusion.segment.subSegments.map((subSegment) => subSegment.id);
          }),
        ];

        const segments = await this.segmentService.getSegmentByIds(segmentIds);
        segments.forEach((segment) => {
          if (segment == undefined) {
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
}
