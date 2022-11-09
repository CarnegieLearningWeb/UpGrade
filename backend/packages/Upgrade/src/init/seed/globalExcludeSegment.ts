import { SegmentInputValidator } from 'src/api/controllers/validators/SegmentInputValidator';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import Container from 'typedi';
import { SEGMENT_TYPE } from 'upgrade_types';

export const globalExcludeSegment: SegmentInputValidator = {
  name: 'Global Exclude',
  id: '77777777-7777-7777-7777-777777777777',
  description: 'Globally excluded Users, Groups and Segments',
  context: 'ALL',
  type: SEGMENT_TYPE.GLOBAL_EXCLUDE,
  userIds: [],
  groups: [],
  subSegmentIds: [],
};

export async function createGlobalExcludeSegment(logger: UpgradeLogger): Promise<any> {
  const segmentService = Container.get<SegmentService>(SegmentService);
  if (!(await segmentService.getSegmentById(globalExcludeSegment.id, new UpgradeLogger()))) {
    try {
      return segmentService.upsertSegment(globalExcludeSegment, logger);
    } catch (err) {
      const error = new Error('Error while creating Global Exclude Segment');
      logger.error(error);
      throw error;
    }
  }
  return Promise.resolve();
}
