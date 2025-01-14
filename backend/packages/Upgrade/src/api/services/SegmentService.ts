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
} from 'upgrade_types';
import { In } from 'typeorm';
import { EntityManager, DataSource } from 'typeorm';
import Papa from 'papaparse';
import { env } from '../../env';
import { v4 as uuid } from 'uuid';
import { ErrorWithType } from '../errors/ErrorWithType';
import {
  SegmentInputValidator,
  SegmentImportError,
  SegmentFile,
  Group,
  SegmentValidationObj,
  ListInputValidator,
} from '../controllers/validators/SegmentInputValidator';
import { ExperimentSegmentExclusionRepository } from '../repositories/ExperimentSegmentExclusionRepository';
import { ExperimentSegmentInclusionRepository } from '../repositories/ExperimentSegmentInclusionRepository';
import { FeatureFlagSegmentExclusionRepository } from '../repositories/FeatureFlagSegmentExclusionRepository';
import { FeatureFlagSegmentInclusionRepository } from '../repositories/FeatureFlagSegmentInclusionRepository';
import { getSegmentData } from '../controllers/SegmentController';
import { globalExcludeSegment } from '../../init/seed/globalExcludeSegment';
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

  public async getAllPublicSegmentsAndSubsegments(logger: UpgradeLogger): Promise<Segment[]> {
    logger.info({ message: `Find all segments and Subsegments` });
    const queryBuilder = await this.segmentRepository
      .createQueryBuilder('segment')
      .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segment.subSegments', 'subSegment')
      .where('segment.type != :private', { private: SEGMENT_TYPE.PRIVATE })
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

  public async getSingleSegmentWithStatus(segmentId: string, logger: UpgradeLogger): Promise<SegmentWithStatus> {
    const allSegmentData = await this.getAllPublicSegmentsAndSubsegments(logger);
    const segmentData = await this.getSegmentById(segmentId, logger);
    if (segmentData) {
      const segmentWithStatus = (await this.getSegmentStatus(allSegmentData)).segmentsData.find(
        (segment: Segment) => segment.id === segmentId
      );
      return { ...segmentData, status: segmentWithStatus?.status };
    } else {
      return null;
    }
  }

  public async getAllSegmentWithStatus(logger: UpgradeLogger): Promise<getSegmentData> {
    const segmentsData = await this.getAllPublicSegmentsAndSubsegments(logger);
    return this.getSegmentStatus(segmentsData);
  }

  public async getSegmentStatus(segmentsData: Segment[]): Promise<getSegmentData> {
    const connection = this.dataSource.manager.connection;
    const segmentsDataWithStatus = await connection.transaction(async () => {
      const [
        allExperimentSegmentsInclusion,
        allExperimentSegmentsExclusion,
        allFeatureFlagSegmentsInclusion,
        allFeatureFlagSegmentsExclusion,
      ] = await Promise.all([
        this.getExperimentSegmentInclusionData(),
        this.getExperimentSegmentExclusionData(),
        this.getFeatureFlagSegmentInclusionData(),
        this.getFeatureFlagSegmentExclusionData(),
      ]);

      const segmentMap = new Map<string, string[]>();
      segmentsData.forEach((segment) => {
        segmentMap.set(
          segment.id,
          segment.subSegments.map((subSegment) => subSegment.id)
        );
      });

      const segmentsUsedList = new Set<string>();

      const collectSegmentIds = (segmentId: string) => {
        if (segmentsUsedList.has(segmentId)) return;
        segmentsUsedList.add(segmentId);
        const subSegmentIds = segmentMap.get(segmentId) || [];
        subSegmentIds.forEach((subSegmentId) => collectSegmentIds(subSegmentId));
      };

      collectSegmentIds(globalExcludeSegment.id);

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

      const segmentsDataWithStatus = segmentsData.map((segment) => {
        if (segment.id === globalExcludeSegment.id) {
          return { ...segment, status: SEGMENT_STATUS.GLOBAL };
        } else if (segmentsUsedList.has(segment.id)) {
          return { ...segment, status: SEGMENT_STATUS.USED };
        } else {
          return { ...segment, status: SEGMENT_STATUS.UNUSED };
        }
      });

      return {
        segmentsData: segmentsDataWithStatus,
        experimentSegmentInclusionData: allExperimentSegmentsInclusion,
        experimentSegmentExclusionData: allExperimentSegmentsExclusion,
        featureFlagSegmentInclusionData: allFeatureFlagSegmentsInclusion,
        featureFlagSegmentExclusionData: allFeatureFlagSegmentsExclusion,
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

  public upsertSegment(segment: SegmentInputValidator, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Upsert segment => ${JSON.stringify(segment, undefined, 2)}` });
    return this.addSegmentDataInDB(segment, logger);
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
      parentSegment.subSegments = [...parentSegment.subSegments, createdSegment];

      await transactionalEntityManager.getRepository(Segment).save(parentSegment);
      return createdSegment;
    });
    return createdSegment;
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

  public async checkSegmentsValidity(fileData: SegmentFile[]): Promise<SegmentValidationObj> {
    const importFileErrors: SegmentImportError[] = [];
    const segments = fileData.filter((segment) => path.extname(segment.fileName) === '.json');

    const segmentData: ValidSegmentDetail[] = await Promise.all(
      segments.map(async (segment) => {
        let segmentForValidation;
        try {
          segmentForValidation = this.convertJSONStringToSegInputValFormat(segment.fileContent);
        } catch (err) {
          importFileErrors.push({ fileName: segment.fileName, error: (err as Error).message });
          return null;
        }
        segmentForValidation = plainToClass(SegmentInputValidator, segmentForValidation);
        const segmentJSONValidation = await this.checkForMissingProperties(segmentForValidation);
        const fileName = segment.fileName.slice(0, segment.fileName.lastIndexOf('.'));
        if (segmentJSONValidation.isSegmentValid) {
          return { filename: fileName, segment: segmentForValidation };
        } else {
          importFileErrors.push({ fileName, error: segmentJSONValidation.missingProperty });
          return null;
        }
      })
    );
    const validatedSegments = await this.validateSegmentsData(segmentData.filter((seg) => seg !== null));
    validatedSegments.importErrors = importFileErrors.concat(validatedSegments.importErrors);
    return validatedSegments;
  }

  convertJSONStringToSegInputValFormat(segmentDetails: string): SegmentInputValidator {
    let segmentInfo;
    try {
      segmentInfo = JSON.parse(segmentDetails);
    } catch (err) {
      throw new Error('Invalid JSON format');
    }
    let userIds: string[];
    let subSegmentIds: string[];
    let groups: Group[];

    if (segmentInfo.individualForSegment) {
      userIds = segmentInfo.individualForSegment.map((individual) => (individual.userId ? individual.userId : null));
    }

    if (segmentInfo.subSegments) {
      subSegmentIds = segmentInfo.subSegments.map((subSegment) => (subSegment.id ? subSegment.id : null));
    }

    if (segmentInfo.groupForSegment) {
      groups = segmentInfo.groupForSegment.map((group) => {
        return group.type && group.groupId ? { type: group.type, groupId: group.groupId } : null;
      });
    }

    const segmentForValidation: SegmentInputValidator = {
      ...segmentInfo,
      userIds: userIds,
      subSegmentIds: subSegmentIds,
      groups: groups,
    };

    return segmentForValidation;
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

  public async validateSegmentsData(segmentsData: ValidSegmentDetail[]): Promise<SegmentValidationObj> {
    const allValidatedSegments: SegmentInputValidator[] = [];
    const allSegmentIds = [
      ...new Set(
        segmentsData.flatMap((segmentData) => [segmentData.segment.id].concat(segmentData.segment.subSegmentIds))
      ),
    ];
    const allSubSegmentsData = await this.getSegmentByIds(allSegmentIds);
    const contextMetaData = env.initialization.contextMetadata;
    const contextMetaDataOptions = Object.keys(contextMetaData);
    const importFileErrors: SegmentImportError[] = [];

    for (const segmentFile of segmentsData) {
      const segment = segmentFile.segment;
      let errorMessage = '';
      if (!contextMetaDataOptions.includes(segment.context)) {
        errorMessage =
          errorMessage + 'Context ' + segment.context + ' not found. Please enter valid context in segment. ';
      } else if (segment.groups.length > 0) {
        const segmentGroupOptions = contextMetaData[segment.context].GROUP_TYPES;
        let invalidGroups = '';
        segment.groups.forEach((group) => {
          if (!segmentGroupOptions.includes(group.type)) {
            invalidGroups = invalidGroups ? invalidGroups + ', ' + group.type : group.type;
          }
        });
        errorMessage = invalidGroups
          ? errorMessage + 'Group type: ' + invalidGroups + ' not found. Please enter valid group type in segment. '
          : errorMessage;
      }

      const duplicateName = await this.segmentRepository.find({
        where: { name: segment.name, context: segment.context },
      });
      if (duplicateName.length) {
        errorMessage =
          errorMessage +
          'Invalid Segment Name: ' +
          segment.name +
          ' is already used by another segment with same context. ';
      }

      let invalidSubSegments = '';
      segment.subSegmentIds.forEach((subSegmentId) => {
        const subSegment = allSubSegmentsData
          ? allSubSegmentsData.find((seg) => subSegmentId === seg?.id && segment.context === seg?.context)
          : null;
        if (!subSegment) {
          invalidSubSegments = invalidSubSegments ? invalidSubSegments + ', ' + subSegmentId : subSegmentId;
        }
      });
      errorMessage = invalidSubSegments
        ? errorMessage +
          'SubSegment: ' +
          invalidSubSegments +
          ' not found. Please import subSegment with same context and link in segment. '
        : errorMessage;

      if (errorMessage.length > 0) {
        importFileErrors.push({
          fileName: segmentFile.filename,
          error: 'Invalid Segment data: ' + errorMessage,
        });
        continue;
      }

      allValidatedSegments.push(segment);
      importFileErrors.push({
        fileName: segmentFile.filename,
        error: null,
      });
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
    const { id, name, description, context, type, listType } = segment;
    const allSegments = await this.getSegmentByIds(segment.subSegmentIds);
    const subSegmentData = segment.subSegmentIds
      .filter((subSegmentId) => {
        // check if segment exists:
        const subSegment = allSegments.find((segment) => subSegmentId === segment.id);
        if (subSegment) {
          return true;
        } else {
          const error = new Error(
            'SubSegment: ' + subSegmentId + ' not found. Please import subSegment and link in experiment.'
          );
          (error as any).type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          return false;
        }
      })
      .map((subSegmentId) => ({ id: subSegmentId }));

    try {
      segmentDoc = await transactionalEntityManager.getRepository(Segment).save({
        id,
        name,
        description,
        context,
        type,
        listType,
        subSegments: subSegmentData,
      });
    } catch (err) {
      const error = err as ErrorWithType;
      error.details = 'Error in saving segment in DB';
      error.type = SERVER_ERROR.QUERY_FAILED;
      logger.error(error);
      throw error;
    }

    const individualForSegmentDocsToSave = segment.userIds.map((userId) => ({
      userId,
      segment: segmentDoc,
    }));

    const groupForSegmentDocsToSave = segment.groups.map((group) => {
      return { ...group, segment: segmentDoc };
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
}
