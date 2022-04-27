import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { SegmentRepository } from '../repositories/SegmentRepository';
import { IndividualForSegmentRepository } from '../repositories/IndividualForSegmentRepository';
import { GroupForSegmentRepository } from '../repositories/GroupForSegmentRepository';
import { Segment } from '../models/Segment';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { SEGMENT_TYPE, SERVER_ERROR } from 'upgrade_types'
import { getConnection } from 'typeorm';
import uuid from 'uuid';
import { ErrorWithType } from '../errors/ErrorWithType';
import { IndividualForSegment } from '../models/IndividualForSegment';
import { GroupForSegment } from '../models/GroupForSegment';
import { SegmentInputValidator } from '../controllers/validators/SegmentInputValidator';

@Service()
export class SegmentService {
  constructor(
    @OrmRepository()
    private segmentRepository: SegmentRepository,
    private individualForSegmentRepository: IndividualForSegmentRepository,
    private groupForSegmentRepository: GroupForSegmentRepository
  ) {}

  public getAllSegments(logger: UpgradeLogger): Promise<Segment[]> {
    logger.info({ message: `Find all segments`});
    let queryBuilder = this.segmentRepository
      .createQueryBuilder('segment')
      .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segment.subSegments', 'subSegment')
      .where('segment.type = :public', {public: SEGMENT_TYPE.PUBLIC})
      .getMany();

    return queryBuilder;
  }

  public getSegmentById(id: string, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Find segment by id. segmentId: ${id}`});
    let segmentDoc = this.segmentRepository
    .createQueryBuilder('segment')
    .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
    .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
    .leftJoinAndSelect('segment.subSegments', 'subSegment')
    .where('segment.type = :public', {public: SEGMENT_TYPE.PUBLIC})
    .andWhere({ id })
    .getOne()

    return segmentDoc;
  }

  public upsertSegment(segment: SegmentInputValidator, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Upsert segment => ${JSON.stringify(segment, undefined, 2)}`});
    return this.addSegmentDataInDB(segment,logger);
  }

  public deleteSegment(id: string, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Delete segment by id. segmentId: ${id}`});
    return this.segmentRepository.deleteSegment(id, logger);
  }

  private async addSegmentDataInDB(segment: SegmentInputValidator, logger: UpgradeLogger): Promise<Segment> {
    const createdSegment = await getConnection().transaction(async (transactionalEntityManager) => {

      if (segment.id) {
        try {
          await transactionalEntityManager.getRepository(Segment).delete(segment.id);
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = 'Error in deleting segment from DB';
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }
      }

      segment.id = segment.id || uuid();
      let segmentDoc: Segment;

      const { userIds, groups, subSegmentIds, ...segmentData } = segment;
      let subSegmentData = segment.subSegmentIds.map((subSegmentId) => ({id: subSegmentId}));

      try {
        segmentDoc = await transactionalEntityManager.getRepository(Segment).save({...segmentData, subSegments: subSegmentData});
      } catch (err) {
        const error = err as ErrorWithType;
        error.details = 'Error in saving segment in DB';
        error.type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      const individualForSegmentDocsToSave = 
        segment.userIds.map((userId) => ({
          userId: userId,
          segment: segmentDoc
        }))

      const groupForSegmentDocsToSave = 
        segment.groups.map((group) => {
          return {...group, segment: segmentDoc};
        })

      let individualDocs: IndividualForSegment[];
      let groupDocs: GroupForSegment[];
      try {
        [individualDocs, groupDocs] = await Promise.all([
          this.individualForSegmentRepository.insertIndividualForSegment(individualForSegmentDocsToSave, transactionalEntityManager, logger),
          this.groupForSegmentRepository.insertGroupForSegment(groupForSegmentDocsToSave, transactionalEntityManager, logger),
        ]);
      } catch (err) {
        const error = err as Error;
        error.message = `Error in creating individualDocs, groupDocs in "addSegmentInDB"`;
        logger.error(error);
        throw error;
      }

      const individualDocToReturn = individualDocs ? individualDocs.map((individualDoc) => {
        const { segment, ...restDoc } = individualDoc;
        return restDoc;
      }) : [];

      const groupDocToReturn = groupDocs ? groupDocs.map((groupDoc) => {
        const { segment, ...restDoc } = groupDoc;
        return restDoc;
      }) : [];

      const results = await Promise.all(segmentDoc.subSegments.map(async (item): Promise<Partial<Segment>> => {
        const { individualForSegment, groupForSegment, subSegments, ...restDoc } = await this.getSegmentById(item.id,logger);
        return restDoc;
      }));

      const newSegment = {
        ...segmentDoc,
        individualForSegment: individualDocToReturn as IndividualForSegment[],
        groupForSegment: groupDocToReturn as GroupForSegment[],
        subSegments: results as Segment[],
      }

      return newSegment;
    });

    return createdSegment;
  }
}
