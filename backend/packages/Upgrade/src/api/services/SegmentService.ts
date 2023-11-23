import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { SegmentRepository } from '../repositories/SegmentRepository';
import { IndividualForSegmentRepository } from '../repositories/IndividualForSegmentRepository';
import { GroupForSegmentRepository } from '../repositories/GroupForSegmentRepository';
import { Segment } from '../models/Segment';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { SEGMENT_TYPE, SERVER_ERROR, SEGMENT_STATUS, CACHE_PREFIX } from 'upgrade_types';
import { getConnection } from 'typeorm';
import uuid from 'uuid';
import { env } from '../../env';
import { ErrorWithType } from '../errors/ErrorWithType';
import { IndividualForSegment } from '../models/IndividualForSegment';
import { GroupForSegment } from '../models/GroupForSegment';
import {
  SegmentInputValidator,
  SegmentReturnObj,
  SegmentImportError,
  SegmentFile,
  Group,
} from '../controllers/validators/SegmentInputValidator';
import { ExperimentSegmentExclusionRepository } from '../repositories/ExperimentSegmentExclusionRepository';
import { ExperimentSegmentInclusionRepository } from '../repositories/ExperimentSegmentInclusionRepository';
import { getSegmentData } from '../controllers/SegmentController';
import { globalExcludeSegment } from '../../init/seed/globalExcludeSegment';
import { CacheService } from './CacheService';

interface ImportSegmentJSON {
  schema: Record<keyof SegmentInputValidator, string>;
  data: SegmentInputValidator;
}

@Service()
export class SegmentService {
  missingAllProperties: string;

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

  public async importSegments(segments: SegmentFile[], logger: UpgradeLogger): Promise<SegmentReturnObj> {
    const importFileErrors: SegmentImportError[] = [];
    if (this.isJSONString(segments[0].fileContent)) {
      const parsedJsonData: SegmentInputValidator[] = [];
      segments.forEach((segment) => {
        const fileName = segment.fileName;
        const segmentInfo = JSON.parse(segment.fileContent);
        const userIds = segmentInfo.individualForSegment.map((individual) =>
          individual.userId ? individual.userId : null
        );
        const subSegmentIds = segmentInfo.subSegments.map((subSegment) => (subSegment.id ? subSegment.id : null));
        const groups = segmentInfo.groupForSegment.map((group) => {
          return group.type && group.groupId ? { type: group.type, groupId: group.groupId } : null;
        });

        const segmentForValidation = {
          ...segmentInfo,
          userIds: userIds,
          subSegmentIds: subSegmentIds,
          groups: groups,
        };
        const isSegmentJSONValid = this.validateSegmentJSON(segmentForValidation);
        if (isSegmentJSONValid) {
          parsedJsonData.push(segmentForValidation);
        } else {
          importFileErrors.push({
            fileName: fileName,
            error: 'Invalid Segment JSON data ' + this.missingAllProperties,
          });
          return;
        }
      });
      const [importedSegments] = await Promise.all([this.importJsonSegments(parsedJsonData, logger)]);
      return { segments: importedSegments, importErrors: importFileErrors };
    } else {
      const [importedSegments] = await Promise.all([this.importCsvSegments(segments, logger)]);
      return { segments: importedSegments, importErrors: importFileErrors };
    }
  }

  private isJSONString(data: any): boolean {
    try {
      JSON.parse(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  validateSegmentJSON(segment: SegmentInputValidator): boolean {
    const segmentSchema: Record<keyof any, string> = {
      id: 'string',
      name: 'string',
      context: 'string',
      description: 'string',
      userIds: 'array',
      groups: 'interface',
      subSegmentIds: 'array',
      type: 'enum',
    };

    this.missingAllProperties = this.checkForMissingProperties({ schema: segmentSchema, data: segment });

    if (this.missingAllProperties.length > 0) {
      return false;
    } else {
      return this.missingAllProperties.length === 0;
    }
  }

  private checkForMissingProperties(segmentJson: ImportSegmentJSON) {
    const { schema, data } = segmentJson;
    const missingProperties = Object.keys(schema)
      .filter((key) => data[key] === undefined)
      .map((key) => key as keyof SegmentInputValidator)
      .map((key) => `${key}`);
    return missingProperties.join(', ');
  }

  public async importCsvSegments(segments: SegmentFile[], logger: UpgradeLogger): Promise<Segment[]> {
    const csvData: string[] = [];
    const fileNames: string[] = [];

    segments.forEach((segment) => {
      csvData.push(segment.fileContent);
      const filename = segment.fileName.split('.');
      fileNames.push(filename[0]);
    });

    const segmentData = csvData.map((data, index) => {
      const rows = data.replace(/"/g, '').split('\n');

      let segmentContext: string;
      const segmentUserIds: string[] = [];
      const subSegmentIds: string[] = [];
      const segmentGroups: Group[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowValues = row.split(',');

        // Extract the ID
        const id = rowValues[0];
        if (!id) {
          continue;
        }

        const memberType = rowValues[1].trim().toLowerCase();
        if (memberType === 'individual') {
          segmentUserIds.push(id);
        } else if (memberType === 'segment') {
          subSegmentIds.push(id);
        } else if (memberType === 'context') {
          segmentContext = id;
        } else {
          segmentGroups.push({ groupId: id, type: memberType });
        }
      }
      return {
        id: uuid.v4(),
        name: fileNames[index],
        context: segmentContext,
        type: SEGMENT_TYPE.PUBLIC,
        userIds: segmentUserIds,
        groups: segmentGroups,
        subSegmentIds: subSegmentIds,
      };
    });

    return this.importJsonSegments(segmentData, logger);
  }

  public async importJsonSegments(segments: SegmentInputValidator[], logger: UpgradeLogger): Promise<Segment[]> {
    const allAddedSegments: Segment[] = [];
    const allSegmentIds: string[] = [];
    segments.forEach((segment) => {
      allSegmentIds.push(segment.id);
      segment.subSegmentIds.forEach((subSegment) => {
        allSegmentIds.includes(subSegment) ? true : allSegmentIds.push(subSegment);
      });
    });
    const allSegmentsData = await this.getSegmentByIds(allSegmentIds);
    const duplicateSegmentsIds = allSegmentsData?.map((segment) => segment?.id);
    const contextMetaData = env.initialization.contextMetadata;
    const contextMetaDataOptions = Object.keys(contextMetaData);

    for (const segment of segments) {
      if (!contextMetaDataOptions.includes(segment.context)) {
        const error = new Error('Context ' + segment.context + ' not found. Please enter valid context in segment.');
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      } else if (segment.groups.length > 0) {
        const segmentGroupOptions = contextMetaData[segment.context].GROUP_TYPES;
        const segmentGroups = segment.groups.filter((group) => segmentGroupOptions.includes(group.type));
        segment.groups = segmentGroups;
      }
      const duplicateSegment = duplicateSegmentsIds ? duplicateSegmentsIds.includes(segment.id) : false;
      if (duplicateSegment && segment.id !== undefined) {
        const error = new Error('Duplicate segment');
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }
      // import duplicate segment with different context:
      if (!isDuplicateSegment || !isDuplicateSegmentWithSameContext) {
        // assign new uuid to duplicate segment with new context:
        segment.id = !isDuplicateSegment ? segment.id : uuid();
        segment.subSegmentIds.forEach((subSegmentId) => {
          const subSegment = allDuplicateSegmentsData
            ? allDuplicateSegmentsData.find((segment) => subSegmentId === segment?.id)
            : null;
          if (!subSegment) {
            const error = new Error(
              'SubSegment: ' + subSegmentId + ' not found. Please import subSegment and link in experiment.'
            );
            (error as any).type = SERVER_ERROR.QUERY_FAILED;
            logger.error(error);
            throw error;
          }
        });

        logger.info({ message: `Import segment => ${JSON.stringify(segment, undefined, 2)}` });
        const addedSegment = await this.addSegmentDataInDB(segment, logger);
        allAddedSegments.push(addedSegment);
        allDuplicateSegmentsData.push(addedSegment);
      }
    }
    return allAddedSegments;
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
