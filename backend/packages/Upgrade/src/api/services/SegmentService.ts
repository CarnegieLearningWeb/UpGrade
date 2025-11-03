import { Service } from 'typedi';
import { InjectRepository, InjectDataSource } from '../../typeorm-typedi-extensions';
import { SegmentRepository } from '../repositories/SegmentRepository';
import { IndividualForSegmentRepository } from '../repositories/IndividualForSegmentRepository';
import { GroupForSegmentRepository } from '../repositories/GroupForSegmentRepository';
import { Segment } from '../models/Segment';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import {
  SEGMENT_TYPE,
  SERVER_ERROR,
  SEGMENT_STATUS,
  CACHE_PREFIX,
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  EXCLUSION_CODE,
  IMPORT_COMPATIBILITY_TYPE,
  ValidatedImportResponse,
  SEGMENT_SEARCH_KEY,
  DuplicateSegmentNameError,
} from 'upgrade_types';
import { In, Not } from 'typeorm';
import { EntityManager, DataSource } from 'typeorm';
import Papa from 'papaparse';
import { env } from '../../env';
import { v4 as uuid } from 'uuid';
import { ErrorWithType } from '../errors/ErrorWithType';
import {
  SegmentInputValidator,
  SegmentImportError,
  SegmentFile,
  SegmentValidationObj,
  ListInputValidator,
  SegmentListImportValidation,
} from '../controllers/validators/SegmentInputValidator';
import { ExperimentSegmentExclusionRepository } from '../repositories/ExperimentSegmentExclusionRepository';
import { ExperimentSegmentInclusionRepository } from '../repositories/ExperimentSegmentInclusionRepository';
import { FeatureFlagSegmentExclusionRepository } from '../repositories/FeatureFlagSegmentExclusionRepository';
import { FeatureFlagSegmentInclusionRepository } from '../repositories/FeatureFlagSegmentInclusionRepository';
import { getSegmentData, getSegmentsData } from '../controllers/SegmentController';
import { CacheService } from './CacheService';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import path from 'path';
import { GroupEnrollmentRepository } from '../repositories/GroupEnrollmentRepository';
import { IndividualEnrollmentRepository } from '../repositories/IndividualEnrollmentRepository';
import { GroupExclusion } from '../models/GroupExclusion';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { IndividualForSegment } from '../models/IndividualForSegment';
import { GroupForSegment } from '../models/GroupForSegment';
import { ISegmentSearchParams, ISegmentSortParams } from '../controllers/validators/SegmentPaginatedParamsValidator';

interface IsSegmentValidWithError {
  missingProperty: string;
  isSegmentValid: boolean;
}

interface SegmentParticipantsRow {
  Type: string;
  UUID: string;
}

interface ValidSegmentDetail {
  filename: string;
  segment: SegmentInputValidator;
}

export interface SegmentWithStatus extends Segment {
  status: SEGMENT_STATUS;
}
@Service()
export class SegmentService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository()
    private segmentRepository: SegmentRepository,
    @InjectRepository()
    private individualForSegmentRepository: IndividualForSegmentRepository,
    @InjectRepository()
    private groupForSegmentRepository: GroupForSegmentRepository,
    @InjectRepository()
    private experimentSegmentExclusionRepository: ExperimentSegmentExclusionRepository,
    @InjectRepository()
    private experimentSegmentInclusionRepository: ExperimentSegmentInclusionRepository,
    @InjectRepository()
    private individualEnrollmentRepository: IndividualEnrollmentRepository,
    @InjectRepository()
    private groupEnrollmentRepository: GroupEnrollmentRepository,
    @InjectRepository()
    private individualExclusionRepository: IndividualExclusionRepository,
    @InjectRepository()
    private groupExclusionRepository: GroupExclusionRepository,
    @InjectRepository()
    private featureFlagSegmentExclusionRepository: FeatureFlagSegmentExclusionRepository,
    @InjectRepository()
    private featureFlagSegmentInclusionRepository: FeatureFlagSegmentInclusionRepository,
    private cacheService: CacheService
  ) {}

  public async getAllSegments(logger: UpgradeLogger): Promise<Segment[]> {
    logger.info({ message: `Find all segments` });
    const queryBuilder = await this.segmentRepository
      .createQueryBuilder('segment')
      .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segment.subSegments', 'subSegment')
      .where('segment.type != :private', { private: SEGMENT_TYPE.PRIVATE })
      .getMany();

    return queryBuilder;
  }

  /**
   * Retrieves all segments of type `GLOBAL_EXCLUDE`.
   *
   * @param logger - The logger instance to log information.
   * @returns A promise that resolves to an array of segments of type `GLOBAL_EXCLUDE`.
   */
  public async getAllGlobalExcludeSegments(logger: UpgradeLogger): Promise<Segment[]> {
    return this.segmentRepository.getAllSegmentByType(SEGMENT_TYPE.GLOBAL_EXCLUDE, logger);
  }

  /**
   * Retrieves a global exclude segment by the given context.
   *
   * @param context - The context for which the global exclude segment is to be retrieved.
   * @returns A promise that resolves to the global exclude segment.
   */
  public async getGlobalExcludeSegmentByContext(context: string): Promise<Segment> {
    return this.segmentRepository.findOneSegmentByContextAndType(context, SEGMENT_TYPE.GLOBAL_EXCLUDE);
  }

  public async getAllPublicSegmentsAndSubsegments(logger: UpgradeLogger): Promise<Segment[]> {
    logger.info({ message: `Find all segments and Subsegments` });
    const queryBuilder = await this.segmentRepository
      .createQueryBuilder('segment')
      .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segment.subSegments', 'subSegment')
      .where('segment.type = :public', { public: SEGMENT_TYPE.PUBLIC })
      .getMany();

    return queryBuilder;
  }

  public async getSegmentById(id: string, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Find segment by id. segmentId: ${id}` });
    const segmentDoc = await this.segmentRepository
      .createQueryBuilder('segment')
      .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segment.subSegments', 'subSegment')
      .leftJoinAndSelect('segment.experimentSegmentInclusion', 'experimentSegmentInclusion')
      .leftJoinAndSelect('segment.experimentSegmentExclusion', 'experimentSegmentExclusion')
      .where('segment.type != :private', { private: SEGMENT_TYPE.PRIVATE })
      .andWhere({ id })
      .getOne();

    return segmentDoc;
  }

  public async getSegmentByIds(ids: string[]): Promise<Segment[]> {
    return this.cacheService.wrapFunction(CACHE_PREFIX.SEGMENT_KEY_PREFIX, ids, async () => {
      if (!ids.length) {
        return [];
      }
      const result = await this.segmentRepository
        .createQueryBuilder('segment')
        .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
        .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
        .leftJoinAndSelect('segment.subSegments', 'subSegment')
        .leftJoinAndSelect('segment.experimentSegmentInclusion', 'experimentSegmentInclusion')
        .leftJoinAndSelect('segment.experimentSegmentExclusion', 'experimentSegmentExclusion')
        .where('segment.id IN (:...ids)', { ids })
        .getMany();

      if (!result.length) {
        return [];
      }

      // sort according to ids
      const sortedData = ids.map((id) => {
        return result.find((data) => data.id === id);
      });
      return sortedData;
    });
  }

  public async getSingleSegmentWithStatus(segmentId: string, logger: UpgradeLogger): Promise<getSegmentData | null> {
    const segmentData = await this.getSegmentById(segmentId, logger);
    if (segmentData) {
      if (segmentData.subSegments.length > 0) {
        const listData = await this.getSegmentByIds(segmentData.subSegments.map((subSegment) => subSegment.id));
        // Add full member data to the subsegments (i.e. Lists) if it's a new style segment
        if (listData.some((subSegment) => subSegment.type === SEGMENT_TYPE.PRIVATE)) {
          segmentData.subSegments = listData;
        }
      }
      const segmentsDataWithStatus = await this.getSegmentStatus([segmentData]);
      const { segmentsData, ...inclusionExclusionData } = segmentsDataWithStatus;
      return { segment: segmentsData[0], ...inclusionExclusionData };
    } else {
      return null;
    }
  }

  public async findPaginated(
    skip: number,
    take: number,
    logger: UpgradeLogger,
    searchParams?: ISegmentSearchParams,
    sortParams?: ISegmentSortParams
  ): Promise<[getSegmentsData, number]> {
    logger.info({ message: `Find paginated segments` });
    let paginatedParentSubQuery = this.segmentRepository
      .createQueryBuilder()
      .subQuery()
      .from(Segment, 'segment')
      .select('segment.id');

    if (searchParams) {
      const whereClause = this.paginatedSearchString(searchParams);
      paginatedParentSubQuery = paginatedParentSubQuery.andWhere(whereClause);
    }
    const countQuery = paginatedParentSubQuery.clone().andWhere('segment.type=:type', { type: SEGMENT_TYPE.PUBLIC });
    paginatedParentSubQuery = paginatedParentSubQuery.andWhere('segment.type = :type').offset(skip).limit(take);

    let segmentsDataQuery = await this.segmentRepository
      .createQueryBuilder('segment')
      .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segment.subSegments', 'subSegment')
      .setParameter('type', SEGMENT_TYPE.PUBLIC)
      .where(`segment.id IN ${paginatedParentSubQuery.getQuery()}`);

    if (sortParams) {
      segmentsDataQuery = segmentsDataQuery.addOrderBy(`segment.${sortParams.key}`, sortParams.sortAs);
    }
    const [segmentsData, count] = await Promise.all([segmentsDataQuery.getMany(), countQuery.getCount()]);
    return [await this.getSegmentStatus(segmentsData), count];
  }

  private paginatedSearchString(params: ISegmentSearchParams): string {
    const type = params.key;
    // escape % and ' characters
    const serachString = params.string.replace(/%/g, '\\$&').replace(/'/g, "''");
    const likeString = `ILIKE '%${serachString}%'`;
    const searchString: string[] = [];
    switch (type) {
      case SEGMENT_SEARCH_KEY.NAME || SEGMENT_SEARCH_KEY.CONTEXT:
        searchString.push(`${type} ${likeString}`);
        break;
      case SEGMENT_SEARCH_KEY.TAG:
        searchString.push(`ARRAY_TO_STRING(tags, ',') ${likeString}`);
        break;
      default:
        searchString.push(`${SEGMENT_SEARCH_KEY.NAME} ${likeString}`);
        searchString.push(`${SEGMENT_SEARCH_KEY.CONTEXT} ${likeString}`);
        searchString.push(`ARRAY_TO_STRING(tags, ',') ${likeString}`);
        break;
    }

    const searchStringConcatenated = `(${searchString.join(' OR ')})`;
    return searchStringConcatenated;
  }

  public async getAllSegmentWithStatus(logger: UpgradeLogger): Promise<getSegmentsData> {
    const segmentsData = await this.getAllPublicSegmentsAndSubsegments(logger);
    return this.getSegmentStatus(segmentsData);
  }

  public async getSegmentStatus(segmentsData: Segment[]): Promise<getSegmentsData> {
    const connection = this.dataSource.manager.connection;
    const segmentsDataWithStatus = await connection.transaction(async () => {
      const [
        allExperimentSegmentsInclusion,
        allExperimentSegmentsExclusion,
        allFeatureFlagSegmentsInclusion,
        allFeatureFlagSegmentsExclusion,
        allSegmentsWithSubSegments,
      ] = await Promise.all([
        this.getExperimentSegmentInclusionData(),
        this.getExperimentSegmentExclusionData(),
        this.getFeatureFlagSegmentInclusionData(),
        this.getFeatureFlagSegmentExclusionData(),
        this.getParentSegments(),
      ]);

      const segmentMap = new Map<string, string[]>();
      segmentsData.forEach((segment) => {
        segmentMap.set(
          segment.id,
          segment.subSegments.map((subSegment) => subSegment.id)
        );
      });

      const segmentsUsedList = new Set<string>(
        allSegmentsWithSubSegments.flatMap((seg) =>
          seg.subSegments.flatMap((subSeg) => subSeg.subSegments.map((subSubSeg) => subSubSeg.id))
        )
      );

      const collectSegmentIds = (segmentId: string) => {
        if (segmentsUsedList.has(segmentId)) return;
        segmentsUsedList.add(segmentId);
        const subSegmentIds = segmentMap.get(segmentId) || [];
        subSegmentIds.forEach((subSegmentId) => collectSegmentIds(subSegmentId));
      };

      if (allExperimentSegmentsInclusion) {
        allExperimentSegmentsInclusion.forEach((ele) => {
          collectSegmentIds(ele.segment.id);
          ele.segment.subSegments.forEach((subSegment) => collectSegmentIds(subSegment.id));
        });
      }

      if (allExperimentSegmentsExclusion) {
        allExperimentSegmentsExclusion.forEach((ele) => {
          collectSegmentIds(ele.segment.id);
          ele.segment.subSegments.forEach((subSegment) => collectSegmentIds(subSegment.id));
        });
      }

      if (allFeatureFlagSegmentsInclusion) {
        allFeatureFlagSegmentsInclusion.forEach((ele) => {
          collectSegmentIds(ele.segment.id);
          ele.segment.subSegments.forEach((subSegment) => collectSegmentIds(subSegment.id));
        });
      }

      if (allFeatureFlagSegmentsExclusion) {
        allFeatureFlagSegmentsExclusion.forEach((ele) => {
          collectSegmentIds(ele.segment.id);
          ele.segment.subSegments.forEach((subSegment) => collectSegmentIds(subSegment.id));
        });
      }

      const addStatusToSegments = (segments: Segment[]) => {
        return segments.map((segment) => {
          if (segment.type === SEGMENT_TYPE.GLOBAL_EXCLUDE) {
            return { ...segment, status: SEGMENT_STATUS.EXCLUDED };
          } else if (segmentsUsedList.has(segment.id)) {
            return { ...segment, status: SEGMENT_STATUS.USED };
          } else {
            return { ...segment, status: SEGMENT_STATUS.UNUSED };
          }
        });
      };

      const segmentsDataWithStatus: SegmentWithStatus[] = addStatusToSegments(segmentsData);

      const parentSegmentsDataWithStatus: SegmentWithStatus[] = addStatusToSegments(allSegmentsWithSubSegments);

      return {
        segmentsData: segmentsDataWithStatus,
        experimentSegmentInclusionData: allExperimentSegmentsInclusion,
        experimentSegmentExclusionData: allExperimentSegmentsExclusion,
        featureFlagSegmentInclusionData: allFeatureFlagSegmentsInclusion,
        featureFlagSegmentExclusionData: allFeatureFlagSegmentsExclusion,
        allParentSegments: parentSegmentsDataWithStatus,
      };
    });

    return segmentsDataWithStatus;
  }

  public async getExperimentSegmentExclusionData() {
    const queryBuilder = await this.experimentSegmentExclusionRepository.getExperimentSegmentExclusionData();
    return queryBuilder;
  }

  public async getExperimentSegmentInclusionData() {
    const queryBuilder = await this.experimentSegmentInclusionRepository.getExperimentSegmentInclusionData();
    return queryBuilder;
  }

  public async getFeatureFlagSegmentExclusionData() {
    const queryBuilder = await this.featureFlagSegmentExclusionRepository.getFeatureFlagSegmentExclusionData();
    return queryBuilder;
  }

  public async getFeatureFlagSegmentInclusionData() {
    const queryBuilder = await this.featureFlagSegmentInclusionRepository.getFeatureFlagSegmentInclusionData();
    return queryBuilder;
  }

  public async getExperimentSegmentExclusionDocBySegmentId(segmentId: string) {
    const queryBuilder = await this.experimentSegmentExclusionRepository.getExperimentSegmentExclusionDocBySegmentId(
      segmentId
    );
    return queryBuilder;
  }

  public async upsertSegment(segment: SegmentInputValidator, logger: UpgradeLogger): Promise<Segment> {
    if (segment.type !== SEGMENT_TYPE.PRIVATE) {
      await this.checkIsDuplicateSegmentName(segment.name, segment.context, segment.id, logger);
    }
    logger.info({ message: `Upsert segment => ${JSON.stringify(segment, undefined, 2)}` });
    return this.addSegmentDataInDB(segment, logger);
  }

  public async upsertSegments(segmentsInput: SegmentInputValidator[], logger: UpgradeLogger): Promise<Segment[]> {
    try {
      return Promise.all(segmentsInput.map((segmentInput) => this.upsertSegment(segmentInput, logger)));
    } catch (error) {
      logger.error({ message: 'Error in upserting segments', error });
      throw error;
    }
  }

  public async addList(listInput: ListInputValidator, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Adding list => ${JSON.stringify(listInput, undefined, 2)}` });
    const manager = this.dataSource;
    const { parentSegmentId, ...segmentInput } = listInput;
    const newList: SegmentInputValidator = { ...segmentInput, type: SEGMENT_TYPE.PRIVATE };
    const createdSegment = await manager.transaction(async (transactionalEntityManager) => {
      const createdSegment = await this.upsertSegmentInPipeline(newList, logger, transactionalEntityManager);
      const parentSegment = await this.getSegmentById(parentSegmentId, logger);
      if (!parentSegment) {
        throw new Error('Parent Segment not found');
      }
      parentSegment.tags = parentSegment.tags || [];
      parentSegment.subSegments = [...parentSegment.subSegments, createdSegment];
      await transactionalEntityManager.getRepository(Segment).save(parentSegment);
      return createdSegment;
    });
    return createdSegment;
  }

  public async deleteList(segmentId: string, parentSegmentId: string, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Deleting list => ${segmentId} from segment ${parentSegmentId}` });
    const manager = this.dataSource;
    const deletedSegmentResponse = await manager.transaction(async (transactionalEntityManager) => {
      const parentSegment = await this.getSegmentById(parentSegmentId, logger);
      if (!parentSegment) {
        throw new Error('Parent Segment  not found');
      }
      if (!parentSegment.subSegments.map((subSegment) => subSegment.id).includes(segmentId)) {
        throw new Error(`List ${segmentId} not found in parent segment ${parentSegmentId}`);
      }
      const deletedSegmentResponse = await this.segmentRepository.deleteSegments(
        [segmentId],
        logger,
        transactionalEntityManager
      );

      parentSegment.subSegments = parentSegment.subSegments.filter((subSegment) => subSegment.id !== segmentId);

      await transactionalEntityManager.getRepository(Segment).save(parentSegment);
      return deletedSegmentResponse;
    });
    return deletedSegmentResponse[0];
  }

  public upsertSegmentInPipeline(
    segment: SegmentInputValidator,
    logger: UpgradeLogger,
    transactionalEntityManager: EntityManager
  ): Promise<Segment> {
    logger.info({ message: `Upsert segment => ${JSON.stringify(segment, undefined, 2)}` });
    return this.addSegmentDataWithPipeline(segment, logger, transactionalEntityManager);
  }

  public async deleteSegment(id: string, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Delete segment by id. segmentId: ${id}` });
    const manager = this.dataSource;
    const deletedSegment = manager.transaction(async (transactionalEntityManager) => {
      return this.deleteSegmentAndPrivateSubsegments(id, logger, transactionalEntityManager);
    });
    return deletedSegment;
  }

  private async deleteSegmentAndPrivateSubsegments(
    id: string,
    logger: UpgradeLogger,
    manager: EntityManager
  ): Promise<Segment> {
    const segmentDoc = await manager.getRepository(Segment).findOne({
      where: { id: id },
      relations: ['individualForSegment', 'groupForSegment', 'subSegments'],
    });
    if (!segmentDoc) {
      throw new Error(SERVER_ERROR.QUERY_FAILED);
    }
    await Promise.all(
      segmentDoc.subSegments.map((subSegment) => {
        if (subSegment.type === SEGMENT_TYPE.PRIVATE) {
          this.deleteSegmentAndPrivateSubsegments(subSegment.id, logger, manager);
        }
      })
    );
    const deletedSegmentResponse = await this.segmentRepository.deleteSegments([id], logger, manager);
    return deletedSegmentResponse[0];
  }

  public async validateSegments(segments: SegmentFile[], logger: UpgradeLogger): Promise<SegmentImportError[]> {
    logger.info({ message: `Validating segments` });
    const validatedSegments = await this.checkSegmentsValidity(segments);
    const validationErrors = validatedSegments.importErrors.filter((seg) => seg.error !== null);
    return validationErrors;
  }

  public async validateSegmentsForCommonImportModal(
    segments: SegmentFile[],
    logger: UpgradeLogger
  ): Promise<ValidatedImportResponse[]> {
    logger.info({ message: `Validating segments` });
    const validatedSegments = await this.checkSegmentsValidity(segments);

    return validatedSegments.importErrors as ValidatedImportResponse[];
  }

  public async validateListsImport(lists: SegmentFile[], logger: UpgradeLogger): Promise<ValidatedImportResponse[]> {
    logger.info({ message: `Validating segments` });
    const listImport = true;
    const validatedSegments = await this.checkSegmentsValidity(lists, listImport);

    return validatedSegments.importErrors as ValidatedImportResponse[];
  }

  public async importSegments(segments: SegmentFile[], logger: UpgradeLogger): Promise<SegmentImportError[]> {
    const validatedSegments = await this.checkSegmentsValidity(segments);
    for (const segment of validatedSegments.segments) {
      // Giving new id to avoid segment duplication
      segment.id = uuid();

      logger.info({ message: `Import segment => ${JSON.stringify(segment, undefined, 2)}` });
      await this.addSegmentDataInDB(segment, logger);
    }
    return validatedSegments.importErrors;
  }

  public async importLists(lists: SegmentListImportValidation, logger: UpgradeLogger): Promise<any> {
    const listImport = true;
    const validatedLists = await this.checkSegmentsValidity(lists.files, listImport);

    for (const list of validatedLists.segments) {
      // Giving new id to avoid segment duplication
      list.id = uuid();
      list.type = SEGMENT_TYPE.PRIVATE;

      logger.info({ message: `Import segment list => ${JSON.stringify(list, undefined, 2)}` });
      await this.addList({ ...list, parentSegmentId: lists.parentSegmentId }, logger);
    }
    return validatedLists.importErrors;
  }

  public validateSegmentContext(segment: { name: string; context: string }): string | null {
    const contextMetadata = env.initialization.contextMetadata;

    if (!contextMetadata[segment.context]) {
      return `The app context "${segment.context}" is not defined in CONTEXT_METADATA.`;
    }

    return null;
  }

  public async checkSegmentsValidity(fileData: SegmentFile[], listImport = false): Promise<SegmentValidationObj> {
    const importFileErrors: SegmentImportError[] = [];
    const segments = fileData.filter((segment) => path.extname(segment.fileName) === '.json');

    const segmentData: ValidSegmentDetail[] = await Promise.all(
      segments.map(async (segment) => {
        let segmentForValidation;
        let errorMessage = '';
        try {
          segmentForValidation = await this.convertJSONStringToSegInputValFormat(segment.fileContent);
        } catch (err) {
          errorMessage = (err as Error).message;
          importFileErrors.push({
            fileName: segment.fileName,
            error: errorMessage,
            compatibilityType: IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE,
          });
          return null;
        }
        segmentForValidation = plainToClass(SegmentInputValidator, segmentForValidation);
        const segmentJSONValidation = await this.checkForMissingProperties(segmentForValidation);
        if (!segmentJSONValidation.isSegmentValid) {
          errorMessage += segmentJSONValidation.missingProperty;
        }

        if (segmentForValidation.subSegments?.some((subSegment) => subSegment.type === SEGMENT_TYPE.PRIVATE)) {
          await Promise.all(
            segmentForValidation.subSegments.map(async (subSegment) => {
              const subSegmentForValidation = plainToClass(SegmentInputValidator, subSegment);
              const subSegmentJSONValidation = await this.checkForMissingProperties(subSegmentForValidation);
              if (!subSegmentJSONValidation.isSegmentValid) {
                errorMessage += ` in list ${subSegment.name} ` + subSegmentJSONValidation.missingProperty;
              }
            })
          );
        }

        if (!errorMessage) {
          return { filename: segment.fileName, segment: segmentForValidation };
        } else {
          importFileErrors.push({
            fileName: segment.fileName,
            error: errorMessage,
            compatibilityType: IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE,
          });
          return null;
        }
      })
    );
    const validatedSegments = await this.validateSegmentsData(
      segmentData.filter((seg) => seg !== null),
      listImport
    );
    validatedSegments.importErrors = importFileErrors.concat(validatedSegments.importErrors);
    return validatedSegments;
  }

  convertJSONStringToSegInputValFormat(segmentDetails: string): SegmentInputValidator {
    let segmentInfo;
    try {
      segmentInfo = JSON.parse(segmentDetails);
      if (!segmentInfo) {
        throw new Error('Empty JSON');
      }
    } catch (err) {
      throw new Error(`Invalid JSON format: ${(err as Error).message}`);
    }

    const addSegmentMembers = (segment: any): SegmentInputValidator => {
      if (segment.individualForSegment) {
        segment.userIds = segment.individualForSegment.map((individual) =>
          individual.userId ? individual.userId : null
        );
      }

      if (segment.subSegments) {
        if (!segment.subSegments?.some((subSegment) => subSegment.type === SEGMENT_TYPE.PRIVATE)) {
          segment.subSegmentIds = segment.subSegments.map((subSegment) => (subSegment.id ? subSegment.id : null));
        } else {
          segment.subSegments = segment.subSegments.map((subSegment) => addSegmentMembers(subSegment));
          segment.subSegmentIds = [];
        }
      }

      if (segment.groupForSegment) {
        segment.groups = segment.groupForSegment.map((group) => {
          return group.type && group.groupId ? { type: group.type, groupId: group.groupId } : null;
        });
      }
      return segment;
    };
    segmentInfo = addSegmentMembers(segmentInfo);
    return segmentInfo;
  }

  public async checkForMissingProperties(segment: SegmentInputValidator): Promise<IsSegmentValidWithError> {
    const errorRemovePart = 'Segment Input validator instance has failed the validation:\n - ';
    let missingAllProperties = '';
    let isSegmentValid = true;

    await validate(segment).then((errors) => {
      if (errors.length > 0) {
        errors.forEach((error) => {
          let validationError = error.toString();
          validationError = validationError.replace(errorRemovePart, '');
          missingAllProperties = missingAllProperties + validationError + ', ';
        });
        missingAllProperties = missingAllProperties.slice(0, -2);
        isSegmentValid = false;
      } else {
        // Object is valid
        isSegmentValid = true;
      }
    });

    return { missingProperty: missingAllProperties, isSegmentValid: isSegmentValid };
  }

  public async validateSegmentsData(
    segmentsData: ValidSegmentDetail[],
    listImport = false
  ): Promise<SegmentValidationObj> {
    const allValidatedSegments: SegmentInputValidator[] = [];
    const allSegmentIds = [
      ...new Set(
        segmentsData.flatMap((segmentData) =>
          [segmentData.segment.id].concat([
            ...segmentData.segment.subSegmentIds,
            ...segmentData.segment.subSegments.flatMap((subSegment) =>
              [subSegment.id].concat(subSegment.subSegments?.map((subSubSegment) => subSubSegment.id))
            ),
          ])
        )
      ),
    ];
    const allSubSegmentsData = await this.getSegmentByIds(allSegmentIds);
    const contextMetaData = env.initialization.contextMetadata;
    const contextMetaDataOptions = Object.keys(contextMetaData);
    const importFileErrors: SegmentImportError[] = [];

    const collectErrors = async (segment: SegmentInputValidator, contexts: string[], isList: boolean) => {
      let errorMessage = '';
      let compatibilityType = IMPORT_COMPATIBILITY_TYPE.COMPATIBLE;
      let invalidSubSegments = '';
      segment.subSegmentIds.forEach((subSegmentId) => {
        const subSegment = allSubSegmentsData
          ? allSubSegmentsData.find((seg) => subSegmentId === seg?.id && segment.context === seg?.context)
          : null;
        if (!subSegment) {
          invalidSubSegments = invalidSubSegments ? invalidSubSegments + ', ' + subSegmentId : subSegmentId;
        }
      });
      if (invalidSubSegments.length > 0) {
        errorMessage =
          errorMessage +
          'SubSegment: ' +
          invalidSubSegments +
          ' not found. Please import subSegment with same context and link in segment.';
        compatibilityType = IMPORT_COMPATIBILITY_TYPE.WARNING;
      }
      if (segment.subSegments.some((subSegment) => subSegment.type === SEGMENT_TYPE.PRIVATE)) {
        const subErrors = await Promise.all(
          segment.subSegments.map(async (subSegment) => {
            const subErrors = await collectErrors(
              subSegment as unknown as SegmentInputValidator,
              [segment.context],
              true
            );
            return subErrors;
          })
        );
        errorMessage =
          errorMessage +
          subErrors
            .map((subError) => subError.errorMessage)
            .filter((message) => message.length > 0)
            .join(', ');
        compatibilityType = subErrors.some(
          (subError) => subError.compatibilityType === IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE
        )
          ? IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE
          : subErrors.some((subError) => subError.compatibilityType === IMPORT_COMPATIBILITY_TYPE.WARNING)
          ? IMPORT_COMPATIBILITY_TYPE.WARNING
          : compatibilityType;
      }
      if (!contexts.includes(segment.context) || !contextMetaDataOptions.includes(segment.context)) {
        errorMessage =
          errorMessage + 'Context ' + segment.context + ' not found. Please enter valid context in segment. ';
        compatibilityType = IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;
      } else if (segment.groups.length > 0) {
        const segmentGroupOptions = contextMetaData[segment.context].GROUP_TYPES;
        let invalidGroups = '';
        segment.groups.forEach((group) => {
          if (!segmentGroupOptions.includes(group.type)) {
            invalidGroups = invalidGroups ? invalidGroups + ', ' + group.type : group.type;
          }
        });
        if (invalidGroups.length > 0) {
          errorMessage =
            errorMessage + 'Group type: ' + invalidGroups + ' not found. Please enter valid group type in segment. ';
          compatibilityType = IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;
        }
      }
      if (isList && !segment.listType) {
        errorMessage = errorMessage + 'List type is required for lists. Please enter valid list type in segment. ';
        compatibilityType = IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;
      }
      // Prevent duplicate segment names (but not for private segments)
      if (segment.type !== SEGMENT_TYPE.PRIVATE) {
        const duplicateName = await this.segmentRepository.find({
          where: { name: segment.name, context: segment.context, type: SEGMENT_TYPE.PUBLIC },
        });

        if (duplicateName.length) {
          errorMessage =
            errorMessage +
            'Invalid Segment Name: ' +
            segment.name +
            ' is already used by another segment with same context. ';
          compatibilityType = IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;
        }
      }
      return { errorMessage, compatibilityType };
    };

    for (const segmentFile of segmentsData) {
      const segment = segmentFile.segment;
      const { errorMessage, compatibilityType } = await collectErrors(segment, contextMetaDataOptions, listImport);

      allValidatedSegments.push(segment);

      // attach assign error and compatibilityType to response. this will be ignored by the 'old' segments modal
      const validationResponse: SegmentImportError = {
        fileName: segmentFile.filename,
        error: null,
        compatibilityType: compatibilityType,
      };

      if (compatibilityType === IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE) {
        validationResponse.error = 'Invalid Segment data: ' + errorMessage;
      } else if (compatibilityType === IMPORT_COMPATIBILITY_TYPE.WARNING) {
        validationResponse.error = 'warning: ' + errorMessage;
      }
      importFileErrors.push(validationResponse);
    }
    return { segments: allValidatedSegments, importErrors: importFileErrors };
  }

  public async exportSegments(segmentIds: string[], logger: UpgradeLogger): Promise<Segment[]> {
    logger.info({ message: `Export segment by id. segmentId: ${segmentIds}` });
    let segmentsDoc: Segment[] = [];
    if (segmentIds.length > 1) {
      segmentsDoc = await this.getSegmentByIds(segmentIds);
    } else {
      const segmentDoc = await this.segmentRepository.findOne({
        where: { id: segmentIds[0] },
        relations: ['individualForSegment', 'groupForSegment', 'subSegments'],
      });
      if (!segmentDoc) {
        throw new Error(SERVER_ERROR.QUERY_FAILED);
      } else {
        // get all subsegments
        const subSegments = await this.getSegmentByIds(segmentDoc.subSegments.map((subSegment) => subSegment.id));
        const isListData = subSegments.some((subSegment) => subSegment.type === SEGMENT_TYPE.PRIVATE);
        // If there are private subsegments, they are lists - so we need to clone the data
        if (isListData) {
          segmentDoc.subSegments = subSegments;
        }
        segmentsDoc.push(segmentDoc);
      }
    }

    return segmentsDoc;
  }

  public async exportSegmentCSV(segmentIds: string[], logger: UpgradeLogger): Promise<SegmentFile[]> {
    const segmentsDoc = await this.exportSegments(segmentIds, logger);

    const segmentExportObj: SegmentFile[] = segmentsDoc.map((segmentDoc) => {
      const segmentRows: SegmentParticipantsRow[] = [];
      segmentDoc.individualForSegment?.forEach((element) => {
        segmentRows.push({ Type: 'Individual', UUID: element.userId });
      });
      segmentDoc.subSegments?.forEach((element) => {
        segmentRows.push({ Type: 'Segment', UUID: element.name });
      });
      segmentDoc.groupForSegment?.forEach((element) => {
        segmentRows.push({ Type: element.type, UUID: element.groupId });
      });
      return { fileName: segmentDoc.name, fileContent: Papa.unparse(segmentRows) };
    });

    return segmentExportObj;
  }

  async addSegmentDataInDB(segment: SegmentInputValidator, logger: UpgradeLogger): Promise<Segment> {
    const manager = this.dataSource;
    const createdSegment = await manager.transaction(async (transactionalEntityManager) => {
      return this.addSegmentDataWithPipeline(segment, logger, transactionalEntityManager);
    });

    return createdSegment;
  }

  async addSegmentDataWithPipeline(
    segment: SegmentInputValidator,
    logger: UpgradeLogger,
    transactionalEntityManager: EntityManager
  ): Promise<Segment> {
    let segmentDoc: Segment;

    let usersToDelete = [],
      groupsToDelete = [];
    if (segment.id) {
      try {
        // get segment by ids
        segmentDoc = await transactionalEntityManager.getRepository(Segment).findOne({
          where: { id: segment.id },
          relations: ['individualForSegment', 'groupForSegment', 'subSegments'],
        });

        // delete individual for segment
        if (segmentDoc && segmentDoc.individualForSegment && segmentDoc.individualForSegment.length > 0) {
          usersToDelete = segmentDoc.individualForSegment.map((individual) => {
            return { userId: individual.userId, segment: segment };
          });
          await transactionalEntityManager.getRepository(IndividualForSegment).delete(usersToDelete as any);
        }

        // delete group for segment
        if (segmentDoc && segmentDoc.groupForSegment && segmentDoc.groupForSegment.length > 0) {
          groupsToDelete = segmentDoc.groupForSegment.map((group) => {
            return { groupId: group.groupId, type: group.type, segment: segment };
          });
          await transactionalEntityManager.getRepository(GroupForSegment).delete(groupsToDelete as any);
        }
      } catch (err) {
        const error = err as ErrorWithType;
        error.details = 'Error in deleting segment from DB';
        error.type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }
    }

    // create/update segment document
    segment.id = segment.id || uuid();
    const { id, name, description, context, type, listType, tags } = segment;
    const segmentsById = await this.getSegmentByIds(segment.subSegmentIds);
    const allSegments = [...segmentsById, ...(segment.subSegments || [])];
    // If there are private subsegments, they are lists - so we need to clone the data
    const isListData = allSegments.some((subSegment) => subSegment.type === SEGMENT_TYPE.PRIVATE);
    let subSegmentData;
    if (isListData) {
      subSegmentData = await Promise.all(
        allSegments.map(async (subSegment) => {
          // Create a new segment input object for the list
          const segmentInput = subSegment as unknown as SegmentInputValidator;
          segmentInput.userIds = subSegment.individualForSegment.map((user) => user.userId);
          segmentInput.groups = subSegment.groupForSegment.map((group) => {
            return { type: group.type, groupId: group.groupId };
          });
          segmentInput.subSegmentIds = subSegment.subSegments.map((subSegment) => subSegment.id);
          subSegment.id = undefined;
          return await this.addSegmentDataWithPipeline(segmentInput, logger, transactionalEntityManager);
        })
      );
    } else {
      subSegmentData = segment.subSegmentIds
        .map((subSegmentId) => {
          const subSegment = segmentsById.find((segment) => subSegmentId === segment.id);
          if (subSegment) {
            return subSegment;
          } else {
            const error = new Error(
              'SubSegment: ' + subSegmentId + ' not found. Please import subSegment and link in experiment.'
            );
            (error as any).type = SERVER_ERROR.QUERY_FAILED;
            logger.error(error);
            return null;
          }
        })
        .filter((subSegment) => subSegment !== null);
    }
    try {
      segmentDoc = await transactionalEntityManager.getRepository(Segment).save({
        id,
        name,
        description,
        context,
        type,
        listType,
        tags,
        subSegments: subSegmentData,
      });
    } catch (err) {
      const error = err as ErrorWithType;
      error.details = 'Error in saving segment in DB';
      error.type = SERVER_ERROR.QUERY_FAILED;
      logger.error(error);
      throw error;
    }

    const individualForSegmentDocsToSave = segment.userIds.map((userId) => {
      const trimmedId = this.trimAndRemoveHiddenChars(userId);
      return {
        userId: trimmedId,
        segment: segmentDoc,
      };
    });

    const groupForSegmentDocsToSave = segment.groups.map((group) => {
      group.groupId = this.trimAndRemoveHiddenChars(group.groupId);

      return {
        ...group,
        segment: segmentDoc,
      };
    });

    try {
      await Promise.all([
        this.individualForSegmentRepository.insertIndividualForSegment(
          individualForSegmentDocsToSave,
          transactionalEntityManager,
          logger
        ),
        this.groupForSegmentRepository.insertGroupForSegment(
          groupForSegmentDocsToSave,
          transactionalEntityManager,
          logger
        ),
      ]);

      // diff between new and old data
      const oldUserIds = new Set(usersToDelete.map((data) => data.userId));
      const diffUsers = individualForSegmentDocsToSave
        .map((data) => data.userId)
        .filter((userId) => !oldUserIds.has(userId));

      const diffGroups = groupForSegmentDocsToSave
        .filter((newData) => {
          return !groupsToDelete.some(
            (oldData) => oldData.groupId === newData.groupId && oldData.type === newData.type
          );
        })
        .map((diffData) => ({ groupId: diffData.groupId, type: diffData.type }));

      await this.updateEnrollmentAndExclusionDocuments(segment, diffUsers, diffGroups);
    } catch (err) {
      const error = err as Error;
      error.message = `Error in creating individualDocs, groupDocs in "addSegmentInDB"`;
      logger.error(error);
      throw error;
    }

    // reset cache
    await this.cacheService.resetPrefixCache(CACHE_PREFIX.SEGMENT_KEY_PREFIX);

    return transactionalEntityManager
      .getRepository(Segment)
      .findOne({ where: { id: segmentDoc.id }, relations: ['individualForSegment', 'groupForSegment', 'subSegments'] });
  }

  private trimAndRemoveHiddenChars(value: string): string {
    return value.replace(/[\r\n\t]/g, '').trim();
  }

  public async updateEnrollmentAndExclusionDocuments(
    segment: SegmentInputValidator,
    newUsers: string[],
    newGroups: { groupId: string; type: string }[]
  ) {
    // for exclusion doc:
    // update below code for nested
    const allExperimentWithExclusionSegment = await this.getExperimentSegmentExclusionDocBySegmentId(segment.id);

    if (allExperimentWithExclusionSegment.length) {
      for (const experimentSegment of allExperimentWithExclusionSegment) {
        const experiment = experimentSegment.experiment;
        const userGroups = newGroups.map((group) => group.groupId);

        // Scenario 1: Group Exclusion
        if (newGroups.length) {
          // Case 1: Individual Consistency
          if (experimentSegment.experiment.consistencyRule == CONSISTENCY_RULE.INDIVIDUAL) {
            // Don't remove users enrollment

            //IncludeSegment.individualForSegment in assign/mark call

            // Check IndividualEnrollment Doc is present In mark call

            // Delete Group Enrollment Doc
            if (experimentSegment.experiment.assignmentUnit == ASSIGNMENT_UNIT.GROUP) {
              await this.groupEnrollmentRepository.delete({
                experiment: { id: experiment.id },
                groupId: In(userGroups),
              });
            }
          }
          // Case 2: Group Consistency
          else if (experimentSegment.experiment.consistencyRule == CONSISTENCY_RULE.GROUP) {
            // find all users enrolled in the experiment
            const enrolledUsersData = await this.individualEnrollmentRepository.find({
              where: {
                experiment: { id: experiment.id },
                groupId: In(userGroups),
              },
              relations: ['user'],
            });
            const enrolledUsers = enrolledUsersData.map((data) => data.user);

            // individual exclusion doc
            const individualExclusionDocs: Array<
              Omit<IndividualExclusion, 'id' | 'createdAt' | 'updatedAt' | 'versionNumber'>
            > = enrolledUsers.map((user) => {
              return {
                user,
                experiment,
                groupId: user?.workingGroup?.[experiment.group],
                exclusionCode: EXCLUSION_CODE.EXCLUDED_DUE_TO_GROUP_LOGIC,
              };
            });

            // Delete Individual Enrollment Doc
            await Promise.all([
              this.individualExclusionRepository.saveRawJson(individualExclusionDocs),
              this.individualEnrollmentRepository.delete({
                experiment: { id: experiment.id },
                groupId: In(userGroups),
              }),
            ]);

            // Delete Group Enrollment
            if (experimentSegment.experiment.assignmentUnit == ASSIGNMENT_UNIT.GROUP) {
              await this.groupEnrollmentRepository.delete({
                experiment: { id: experiment.id },
                groupId: In(userGroups),
              });
            }
          }
        }
        if (newUsers.length) {
          // Case 1: User already visited
          const excludedUsers = await this.individualEnrollmentRepository.find({
            where: { experiment: { id: experiment.id }, user: In(newUsers) },
          });

          const excludedUsersGroups = Array.from(
            new Set(excludedUsers.map((enrollment) => enrollment.groupId).filter((groupId) => groupId != null))
          );

          // Delete individual enrollment of users
          await this.individualEnrollmentRepository.delete({
            experiment: { id: experiment.id },
            user: { id: In(newUsers) },
          });

          if (experimentSegment.experiment.consistencyRule == CONSISTENCY_RULE.GROUP) {
            // Delete Individual Enrollment Doc for users belongs to excludedUsersGroups
            await this.individualEnrollmentRepository.delete({
              experiment: { id: experiment.id },
              groupId: In(excludedUsersGroups),
            });
          }

          // Delete group enrollment of all groups
          if (experimentSegment.experiment.assignmentUnit == ASSIGNMENT_UNIT.GROUP) {
            await this.groupEnrollmentRepository.delete({
              experiment: { id: experiment.id },
              groupId: In(excludedUsersGroups),
            });

            // group exclusion doc
            const groupExclusionDocs: Array<Omit<GroupExclusion, 'id' | 'createdAt' | 'updatedAt' | 'versionNumber'>> =
              [...excludedUsersGroups].map((groupId) => {
                return {
                  experiment,
                  groupId,
                  exclusionCode: EXCLUSION_CODE.EXCLUDED_DUE_TO_GROUP_LOGIC,
                };
              });
            await this.groupExclusionRepository.saveRawJson(groupExclusionDocs);
          }
        }
      }
    }
  }

  async checkIsDuplicateSegmentName(
    name: string,
    context: string,
    id: string,
    logger: UpgradeLogger
  ): Promise<boolean> {
    logger.info({ message: `Check for duplicate segment name ${name} in context ${context}` });
    let sameNameSegment: Segment[] = [];
    // Check if the segment name already exists in the same context
    // If id is present, check only for other segments with the same name and context
    if (id) {
      sameNameSegment = await this.segmentRepository.find({
        where: { name, context, type: Not(SEGMENT_TYPE.PRIVATE), id: Not(id) },
      });
    } else {
      sameNameSegment = await this.segmentRepository.find({
        where: { name, context, type: Not(SEGMENT_TYPE.PRIVATE) },
      });
    }

    if (sameNameSegment.length) {
      logger.error({
        message: `Segment name ${name} already exists in context ${context}`,
      });

      const error: DuplicateSegmentNameError = {
        type: SERVER_ERROR.SEGMENT_DUPLICATE_NAME,
        message: `Segment name ${name} already exists in context ${context}`,
        duplicateName: name,
        context,
        httpCode: 400,
      };

      throw error;
    } else {
      return false;
    }
  }

  private async getParentSegments(): Promise<Segment[]> {
    return await this.segmentRepository.getAllParentSegments();
  }
}
