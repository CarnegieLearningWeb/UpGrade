import { Request } from 'express';
import { UpgradeLogger } from '../lib/logger/UpgradeLogger';
import { RequestedExperimentUser } from 'src/api/controllers/validators/ExperimentUserValidator';

export enum ASSIGNMENT_TYPE {
  MANUAL = 'manual',
  ALGORITHMIC = 'algorithmic',
}

export enum SORT_AS {
  ASCENDING = 'ASC',
  DESCENDING = 'DESC',
}

export interface PaginationResponse {
  total: number;
  skip: number;
  take: number;
}

/** A group-membership entry (group type + group id) as stored on a segment. */
export interface SegmentGroupMember {
  type: string;
  groupId: string;
}

/**
 * The resolved membership of an entity's inclusion (or exclusion) segments: individual user IDs and
 * groups, flattened across sub-segments. Produced by both the on-the-fly resolver
 * (ExperimentAssignmentService.resolveSegment) and the precomputed read path, and consumed by
 * inclusionExclusionLogic. "Entity" is an experiment or a feature flag.
 */
export interface SegmentMembers {
  users: string[];
  groups: SegmentGroupMember[];
}

/** Include- or exclude-side {@link SegmentMembers} keyed by entity (experiment/flag) id. */
export type EntitySegmentMembers = Record<string, SegmentMembers>;

/**
 * Per-entity segment IDs queued for on-the-fly resolution (see
 * ExperimentAssignmentService.getSegmentObject / resolveSegmentsForEntities), keyed by entity id.
 */
export interface SegmentResolutionInput {
  segmentIdsQueue: string[];
  currentIncludedSegmentIds: string[];
  currentExcludedSegmentIds: string[];
  allIncludedSegmentIds: string[];
  allExcludedSegmentIds: string[];
}

export type EntitySegmentResolutionInput = Record<string, SegmentResolutionInput>;

export interface AppRequest extends Request {
  userDoc: RequestedExperimentUser;
  logger: UpgradeLogger;
}
