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
    .where('segment.type = :public', { public: SEGMENT_TYPE.PUBLIC })
    .andWhere({ id })
    .getOne()

    return segmentDoc;
  }

  public upsertSegment(segment: Segment, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Upsert segment => ${JSON.stringify(segment, undefined, 2)}`});
    return this.addSegmentDataInDB(segment,logger);
  }

  public deleteSegment(id: string, logger: UpgradeLogger): Promise<Segment> {
    logger.info({ message: `Delete segment by id. segmentId: ${id}`});
    return this.segmentRepository.deleteSegment(id, logger);
  }

  private async addSegmentDataInDB(segment: Segment, logger: UpgradeLogger) {
    const createdSegment = await getConnection().transaction(async (transactionalEntityManager) => {

      if(segment.id) {
        try {
          await transactionalEntityManager.getRepository(Segment).delete(segment.id);
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = 'Error in deleting segment in DB';
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }
      }

      segment.id = segment.id || uuid();
      let segmentDoc: Segment;

      const { individualForSegment, groupForSegment, ...segmentData } = segment;

      try {
        segmentDoc = await transactionalEntityManager.getRepository(Segment).save(segmentData);
      } catch (err) {
        const error = err as ErrorWithType;
        error.details = 'Error in saving segment in DB';
        error.type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }
      
      const individualForSegmentDocsToSave = 
        individualForSegment &&
        individualForSegment.length > 0 &&
        individualForSegment.map((user) => {
          user.segment = segmentDoc
          return user;
        })
      
      const groupForSegmentDocsToSave = 
        groupForSegment &&
        groupForSegment.length > 0 &&
        groupForSegment.map((group: GroupForSegment) => {
          group.segment = segmentDoc;
          return group;
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

      // todo remove this
      console.log('Individual docs', individualDocs);
      console.log('Group docs', groupDocs);
      
      const individualDocToReturn = individualDocs.map((individualDoc) => {
        const { segment, ...restDoc } = individualDoc as any
        return restDoc;
      });

      const groupDocToReturn = groupDocs.map((groupDoc) => {
        const { segment, ...restDoc } = groupDoc as any
        return restDoc;
      });
  
      var results: any[];
      if(segmentDoc.subSegments) {
        results = await Promise.all(segmentDoc.subSegments.map(async (item): Promise<Partial<Segment>> => {
          const { individualForSegment, groupForSegment, subSegments, ...restDoc } = await this.getSegmentById(item.id,logger);
          return restDoc;
        }));
      }

      const newSegment = {
        ...segmentDoc,
        indivialForSegment: individualDocToReturn as any,
        groupForSegment: groupDocToReturn as any,
        subSegments: results as any,
      }

      return newSegment;
    });

    return createdSegment;
  }
}
