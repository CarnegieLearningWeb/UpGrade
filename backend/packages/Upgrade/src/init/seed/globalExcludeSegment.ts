import { SegmentInputValidator } from 'src/api/controllers/validators/SegmentInputValidator';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import Container from 'typedi';
import { SEGMENT_TYPE } from 'upgrade_types';
import { env } from '../../env';
import { Segment } from '../../api/models/Segment';

const globalExcludeSegment: Partial<SegmentInputValidator> = {
  name: 'Global Exclude',
  description: 'Globally excluded Users, Groups and Segments',
  type: SEGMENT_TYPE.GLOBAL_EXCLUDE,
  userIds: [],
  groups: [],
  subSegmentIds: [],
} as const;

/**
 * Creates global exclude segments for contexts that do not have one.
 *
 * This function retrieves all global exclude segments and checks if there are any contexts
 * that do not have a global exclude segment. If all contexts already have a global exclude segment,
 * the function exits early. Otherwise, it creates global exclude segments for the missing contexts
 * by copying the segment for the 'ALL' context if it exists, or using the existing global exclude segments.
 *
 * @param logger - The logger instance to use for logging.
 * @returns A promise that resolves when the segments have been upserted, or undefined if no segments needed to be upserted.
 */
export async function createGlobalExcludeSegment(logger: UpgradeLogger): Promise<any> {
  const segmentService = Container.get<SegmentService>(SegmentService);

  // Get the global exclude segment
  const globalExcludeSegments = await segmentService.getAllGlobalExcludeSegments(logger);

  const contexts = Object.keys(env.initialization.contextMetadata);

  // Filter context for which global exclude segment is not present
  const contextWithNoGlobalExclude = contexts.filter(
    (con) => !globalExcludeSegments.some(({ context }) => context === con)
  );

  // Exit the function if all context has global exclude segment
  if (contextWithNoGlobalExclude.length === 0) {
    return;
  }

  const globalExcludeSegmentForAllContext = globalExcludeSegments.find(({ context }) => context === 'ALL');

  const globalExcludeSegmentDocs: SegmentInputValidator[] = contextWithNoGlobalExclude.map((context) => {
    // Global segment for the context
    const segmentToCopy = globalExcludeSegmentForAllContext
      ? convertSegmentToSegmentInputValidator(
          globalExcludeSegmentForAllContext,
          context,
          env.initialization.contextMetadata[context]
        )
      : globalExcludeSegment;

    return {
      ...segmentToCopy,
      context,
    } as SegmentInputValidator;
  });

  // Create global exclude segment for the context
  await segmentService.upsertSegments(globalExcludeSegmentDocs, logger);

  // Delete the global exclude segment for the 'ALL' context if it exists
  if (globalExcludeSegmentForAllContext) {
    return segmentService.deleteSegment(globalExcludeSegmentForAllContext.id, logger);
  }
}

/**
 * Converts a Segment object to a SegmentInputValidator object.
 *
 * @param segment - The segment object to convert.
 * @returns The converted SegmentInputValidator object.
 */
function convertSegmentToSegmentInputValidator(
  segment: Segment,
  context: string,
  contextData: (typeof env.initialization.contextMetadata)[number]
): SegmentInputValidator {
  // Don't add the id to create a new segment
  return {
    name: segment.name,
    description: segment.description,
    context: segment.context,
    type: segment.type,
    tags: segment.tags || [],
    userIds: segment.individualForSegment.map((individual) => individual.userId),
    groups: segment.groupForSegment
      .filter(({ type }) => {
        return contextData.GROUP_TYPES.includes(type);
      })
      .map((group) => ({ groupId: group.groupId, type: group.type })),
    subSegmentIds: segment.subSegments
      .filter(({ context: cont }) => cont === context)
      .map((subSegment) => subSegment.id),
  };
}
