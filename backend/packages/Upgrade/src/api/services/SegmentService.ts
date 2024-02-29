import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { SegmentRepository } from '../repositories/SegmentRepository';
import { IndividualForSegmentRepository } from '../repositories/IndividualForSegmentRepository';
import { GroupForSegmentRepository } from '../repositories/GroupForSegmentRepository';
import { Segment } from '../models/Segment';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { SEGMENT_TYPE, SERVER_ERROR, SEGMENT_STATUS, CACHE_PREFIX } from 'upgrade_types';
import { getConnection } from 'typeorm';
import Papa from 'papaparse';
import { env } from '../../env';
import { v4 as uuid } from 'uuid';
import { ErrorWithType } from '../errors/ErrorWithType';
import { IndividualForSegment } from '../models/IndividualForSegment';
import { GroupForSegment } from '../models/GroupForSegment';
import {
  SegmentInputValidator,
  SegmentImportError,
  SegmentFile,
  Group,
  SegmentValidationObj,
} from '../controllers/validators/SegmentInputValidator';
import { ExperimentSegmentExclusionRepository } from '../repositories/ExperimentSegmentExclusionRepository';
import { ExperimentSegmentInclusionRepository } from '../repositories/ExperimentSegmentInclusionRepository';
import { getSegmentData } from '../controllers/SegmentController';
import { globalExcludeSegment } from '../../init/seed/globalExcludeSegment';
import { CacheService } from './CacheService';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

interface SegmentJsonForValidation {
  missingProperty: string;
  segment: SegmentInputValidator;
}

interface IsSegmentValidWithError {
  missingProperty: string;
  isSegmentValid: boolean;
}

interface SegmentParticipantsRow {
  Type: string;
  UUID: string;
}

@Service()
export class SegmentService {
  constructor(
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

  public async getSegmentById(id: string, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Find segment by id. segmentId: ${id}` });
    const segmentDoc = await this.segmentRepository
      .createQueryBuilder('segment')
      .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segment.subSegments', 'subSegment')
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
        .where('segment.id IN (:...ids)', { ids })
        .getMany();

      // sort according to ids
      const sortedData = ids.map((id) => {
        return result.find((data) => data.id === id);
      });
      return sortedData;
    });
  }

  public async getAllSegmentWithStatus(logger: UpgradeLogger): Promise<getSegmentData> {
    const segmentsData = await getConnection().transaction(async () => {
      const [segmentsData, allExperimentSegmentsInclusion, allExperimentSegmentsExclusion] = await Promise.all([
        this.getAllSegments(logger),
        this.getExperimentSegmenInclusionData(),
        this.getExperimentSegmenExclusionData(),
      ]);

      const segmentsUsedList = [];

      if (allExperimentSegmentsInclusion) {
        allExperimentSegmentsInclusion.forEach((ele) => {
          const subSegments = ele.segment.subSegments;
          segmentsUsedList.push(...subSegments.map((subSegment) => subSegment.id));
        });
      }

      if (allExperimentSegmentsExclusion) {
        allExperimentSegmentsExclusion.forEach((ele) => {
          const subSegments = ele.segment.subSegments;
          segmentsUsedList.push(...subSegments.map((subSegment) => subSegment.id));
        });
      }

      segmentsData.forEach((segment) => {
        if (segmentsUsedList.includes(segment.id)) {
          segmentsUsedList.push(...segment.subSegments.map((subSegment) => subSegment.id));
        }
      });

      const segmentsDataWithStatus = segmentsData.map((segment) => {
        if (segment.id === globalExcludeSegment.id) {
          return { ...segment, status: SEGMENT_STATUS.GLOBAL };
        } else if (segmentsUsedList.includes(segment.id)) {
          return { ...segment, status: SEGMENT_STATUS.USED };
        } else {
          return { ...segment, status: SEGMENT_STATUS.UNUSED };
        }
      });

      return {
        segmentsData: segmentsDataWithStatus,
        experimentSegmentInclusionData: allExperimentSegmentsInclusion,
        experimentSegmentExclusionData: allExperimentSegmentsExclusion,
      };
    });

    return segmentsData;
  }

  public async getExperimentSegmenExclusionData() {
    const queryBuilder = await this.experimentSegmentExclusionRepository.getExperimentSegmentExclusionData();
    return queryBuilder;
  }

  public async getExperimentSegmenInclusionData() {
    const queryBuilder = await this.experimentSegmentInclusionRepository.getExperimentSegmentInclusionData();
    return queryBuilder;
  }

  public upsertSegment(segment: SegmentInputValidator, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Upsert segment => ${JSON.stringify(segment, undefined, 2)}` });
    return this.addSegmentDataInDB(segment, logger);
  }

  public async deleteSegment(id: string, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Delete segment by id. segmentId: ${id}` });
    return await this.segmentRepository.deleteSegment(id, logger);
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
      logger.info({ message: `Import segment => ${JSON.stringify(segment, undefined, 2)}` });
      await this.addSegmentDataInDB(segment, logger);
    }
    return validatedSegments.importErrors;
  }

  public async checkSegmentsValidity(segments: SegmentFile[]): Promise<SegmentValidationObj> {
    const importFileErrors: SegmentImportError[] = [];
    const parsedData: SegmentInputValidator[] = [];
    const fileNames: string[] = [];

    for (const segment of segments) {
      const lastDotIndex = segment.fileName.lastIndexOf('.');
      const fileName = segment.fileName.slice(0, lastDotIndex);
      const extension = segment.fileName.slice(lastDotIndex + 1);
      if (extension === 'json') {
        const segmentForValidation = this.convertJSONStringToSegInputValFormat(segment.fileContent);

        //To avoid seg duplication
        segmentForValidation.segment.id = uuid();
        segmentForValidation.segment = plainToClass(SegmentInputValidator, segmentForValidation.segment);
        const segmentJSONValidation = await this.checkForMissingProperties(segmentForValidation);

        if (segmentJSONValidation.isSegmentValid) {
          fileNames.push(fileName);
          parsedData.push(segmentForValidation.segment);
        } else {
          importFileErrors.push({
            fileName: fileName,
            error: segmentJSONValidation.missingProperty,
          });
        }
      }
    }
    const validatedSegments = await this.validateSegmentsData(parsedData, fileNames);
    validatedSegments.importErrors = importFileErrors.concat(validatedSegments.importErrors);
    return validatedSegments;
  }

  convertJSONStringToSegInputValFormat(segmentDetails: string): SegmentJsonForValidation {
    const segmentInfo = JSON.parse(segmentDetails);
    let userIds: string[];
    let subSegmentIds: string[];
    let groups: Group[];
    let missingAllProperties = '';

    if (segmentInfo.individualForSegment) {
      userIds = segmentInfo.individualForSegment.map((individual) => (individual.userId ? individual.userId : null));
    } else {
      missingAllProperties = missingAllProperties + ' individualForSegment';
    }

    if (segmentInfo.subSegments) {
      subSegmentIds = segmentInfo.subSegments.map((subSegment) => (subSegment.id ? subSegment.id : null));
    } else {
      missingAllProperties = missingAllProperties + ' subSegments';
    }

    if (segmentInfo.groupForSegment) {
      groups = segmentInfo.groupForSegment.map((group) => {
        return group.type && group.groupId ? { type: group.type, groupId: group.groupId } : null;
      });
    } else {
      missingAllProperties = missingAllProperties + ' groupForSegment';
    }

    const segmentForValidation: SegmentInputValidator = {
      ...segmentInfo,
      userIds: userIds,
      subSegmentIds: subSegmentIds,
      groups: groups,
    };

    missingAllProperties = missingAllProperties
      ? 'Invalid Segment JSON, missing properties: ' + missingAllProperties
      : missingAllProperties;

    return { missingProperty: missingAllProperties, segment: segmentForValidation };
  }

  public async checkForMissingProperties(obj: SegmentJsonForValidation): Promise<IsSegmentValidWithError> {
    const errorRemovePart = 'Segment Input validator instance has failed the validation:\n - ';
    let missingAllProperties = obj.missingProperty;
    let isSegmentValid = true;

    await validate(obj.segment).then((errors) => {
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
    segments: SegmentInputValidator[],
    fileNames: string[]
  ): Promise<SegmentValidationObj> {
    const allValidatedSegments: SegmentInputValidator[] = [];
    const allSegmentIds: string[] = [];
    segments.forEach((segment) => {
      allSegmentIds.push(segment.id);
      segment.subSegmentIds.forEach((subSegment) => {
        if (!allSegmentIds.includes(subSegment)) {
          allSegmentIds.push(subSegment);
        }
      });
    });
    const allSubSegmentsData = await this.getSegmentByIds(allSegmentIds);
    const contextMetaData = env.initialization.contextMetadata;
    const contextMetaDataOptions = Object.keys(contextMetaData);
    const importFileErrors: SegmentImportError[] = [];
    let index = 0;

    for (const segment of segments) {
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

      const duplicateName = await this.segmentRepository.find({ name: segment.name, context: segment.context });
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
          fileName: fileNames[index],
          error: 'Invalid Segment data: ' + errorMessage,
        });
        index++;
        continue;
      }

      allValidatedSegments.push(segment);
      importFileErrors.push({
        fileName: fileNames[index],
        error: null,
      });
      index++;
      allSubSegmentsData.push(this.convertSegInputValToSegment(segment));
    }
    return { segments: allValidatedSegments, importErrors: importFileErrors };
  }

  convertSegInputValToSegment(segment: SegmentInputValidator): Segment {
    const seg = new Segment();
    seg.id = segment.id;
    seg.context = segment.context;
    seg.name = segment.name;
    return seg;
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
    const createdSegment = await getConnection().transaction(async (transactionalEntityManager) => {
      let segmentDoc: Segment;

      if (segment.id) {
        try {
          // get segment by ids
          segmentDoc = await transactionalEntityManager
            .getRepository(Segment)
            .findOne(segment.id, { relations: ['individualForSegment', 'groupForSegment', 'subSegments'] });

          // delete individual for segment
          if (segmentDoc && segmentDoc.individualForSegment && segmentDoc.individualForSegment.length > 0) {
            const usersToDelete = segmentDoc.individualForSegment.map((individual) => {
              return { userId: individual.userId, segment: segment.id };
            });
            await transactionalEntityManager.getRepository(IndividualForSegment).delete(usersToDelete as any);
          }

          // delete group for segment
          if (segmentDoc && segmentDoc.groupForSegment && segmentDoc.groupForSegment.length > 0) {
            const groupToDelete = segmentDoc.groupForSegment.map((group) => {
              return { groupId: group.groupId, type: group.type, segment: segment.id };
            });
            await transactionalEntityManager.getRepository(GroupForSegment).delete(groupToDelete as any);
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
      const { id, name, description, context, type } = segment;
      const allSegments = await this.getSegmentByIds(segment.subSegmentIds);
      const subSegmentData = segment.subSegmentIds
        .filter((subSegmentId) => {
          // check if segment exists:
          const subSegment = allSegments.find((segmentId) => subSegmentId === segmentId.id);
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
        segmentDoc = await transactionalEntityManager
          .getRepository(Segment)
          .save({ id, name, description, context, type, subSegments: subSegmentData });
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
      } catch (err) {
        const error = err as Error;
        error.message = `Error in creating individualDocs, groupDocs in "addSegmentInDB"`;
        logger.error(error);
        throw error;
      }

      return transactionalEntityManager
        .getRepository(Segment)
        .findOne(segmentDoc.id, { relations: ['individualForSegment', 'groupForSegment', 'subSegments'] });
    });

    // reset caching
    await this.cacheService.resetPrefixCache(CACHE_PREFIX.SEGMENT_KEY_PREFIX);

    return createdSegment;
  }
}
