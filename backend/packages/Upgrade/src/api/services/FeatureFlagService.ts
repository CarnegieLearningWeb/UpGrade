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
import { SERVER_ERROR, FEATURE_FLAG_STATUS, FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { FeatureFlagValidation } from '../controllers/validators/FeatureFlagValidator';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentAssignmentService } from './ExperimentAssignmentService';
import { SegmentService } from './SegmentService';
import { ErrorWithType } from '../errors/ErrorWithType';

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

  public async getKeys(experimentUserDoc: ExperimentUser, context: string, logger: UpgradeLogger): Promise<string[]> {
    logger.info({ message: 'Get all feature flags' });

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
        return deletedFlag;
      }
      return undefined;
    });
  }

  public async updateState(flagId: string, status: FEATURE_FLAG_STATUS): Promise<FeatureFlag> {
    // TODO: Add log for updating flag state
    const updatedState = await this.featureFlagRepository.updateState(flagId, status);
    return updatedState;
  }

  public async updateFilterMode(flagId: string, filterMode: FILTER_MODE): Promise<FeatureFlag> {
    // TODO: Add log for updating filter mode
    const updatedFilterMode = await this.featureFlagRepository.updateFilterMode(flagId, filterMode);
    return updatedFilterMode;
  }

  public update(flagDTO: FeatureFlagValidation, logger: UpgradeLogger): Promise<FeatureFlag> {
    logger.info({ message: `Update a Feature Flag => ${flagDTO.toString()}` });
    // TODO add entry in log of updating feature flag
    return this.updateFeatureFlagInDB(this.featureFlagValidatorToFlag(flagDTO), logger);
  }

  private async addFeatureFlagInDB(flag: FeatureFlag, logger: UpgradeLogger): Promise<FeatureFlag> {
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
    return featureFlagDoc;
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
    listInput: FeatureFlagListValidator,
    filterType: string,
    logger: UpgradeLogger
  ): Promise<FeatureFlagSegmentInclusion | FeatureFlagSegmentExclusion> {
    logger.info({ message: `Add ${filterType} list to feature flag` });
    const createdList = await getConnection().transaction(async (transactionalEntityManager) => {
      const featureFlagSegmentInclusionOrExclusion =
        filterType === 'inclusion' ? new FeatureFlagSegmentInclusion() : new FeatureFlagSegmentExclusion();
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
        if (filterType === 'inclusion') {
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
      return featureFlagSegmentInclusionOrExclusion;
    });
    return createdList;
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
      const includeIds = flag.featureFlagSegmentInclusion.map((segmentInclusion) => segmentInclusion.segment.id);
      const excludeIds = flag.featureFlagSegmentExclusion.map((segmentExclusion) => segmentExclusion.segment.id);

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
