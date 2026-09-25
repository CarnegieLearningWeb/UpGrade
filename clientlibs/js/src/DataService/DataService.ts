import { UpGradeClientInterfaces } from '../types';
import { IExperimentAssignment } from 'upgrade_types';

/** The groupset id used for the default (no groups configured / useSingleGroupSet default) case. */
export const DEFAULT_GROUPSET_ID = '*';

/** The group definition remembered per groupset id, so a cache-miss can rehydrate on demand. */
export interface IGroupsetDefinition {
  groups?: Record<string, string[]>;
  includeStoredUserGroups?: boolean;
}

/**
 * Synchronous data store
 */
export class DataService {
  private group: UpGradeClientInterfaces.IExperimentUserGroup = null;
  private workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = null;
  private experimentAssignmentData: IExperimentAssignment[] = null;

  // All feature flags are stored here, uniformly, keyed by groupset id — the useSingleGroupSet
  // default lives under DEFAULT_GROUPSET_ID, mainGroupset/subGroupsets under their own ids.
  private featureFlagsByGroupsetId: Map<string, string[]> = new Map();

  // Remembers the groups/includeStoredUserGroups that produced each groupset id, for every id ever
  // configured or requested — lets hasFeatureFlag(key, id) rehydrate a cache-miss on demand.
  private groupsetDefinitionsById: Map<string, IGroupsetDefinition> = new Map();

  getGroup(): UpGradeClientInterfaces.IExperimentUserGroup {
    return this.group;
  }

  setGroup(group: UpGradeClientInterfaces.IExperimentUserGroup) {
    this.group = group;
  }

  getWorkingGroup(): UpGradeClientInterfaces.IExperimentUserWorkingGroup {
    return this.workingGroup;
  }

  setWorkingGroup(workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup) {
    this.workingGroup = workingGroup;
  }

  getExperimentAssignmentData(): IExperimentAssignment[] {
    return this.experimentAssignmentData;
  }

  setExperimentAssignmentData(experimentAssignmentData: IExperimentAssignment[]) {
    this.experimentAssignmentData = experimentAssignmentData;
  }

  /** @deprecated Use `getFeatureFlagsForGroupset(DEFAULT_GROUPSET_ID)` instead. */
  getFeatureFlags(): string[] {
    return this.getFeatureFlagsForGroupset(DEFAULT_GROUPSET_ID);
  }

  /** @deprecated Use `setFeatureFlagsForGroupset(DEFAULT_GROUPSET_ID, ...)` instead. */
  setFeatureFlags(featureFlags: string[]) {
    this.setFeatureFlagsForGroupset(DEFAULT_GROUPSET_ID, featureFlags);
  }

  /** @deprecated Use `clearFeatureFlagsForGroupset(DEFAULT_GROUPSET_ID)` instead. */
  clearFeatureFlags() {
    this.clearFeatureFlagsForGroupset(DEFAULT_GROUPSET_ID);
  }

  /** Returns the flags cached for a groupset id, or null if that id hasn't been fetched yet. */
  getFeatureFlagsForGroupset(groupsetId: string): string[] | null {
    return this.featureFlagsByGroupsetId.get(groupsetId) ?? null;
  }

  /** Upserts (replaces or adds) the flags cached for exactly this groupset id. */
  setFeatureFlagsForGroupset(groupsetId: string, featureFlags: string[]) {
    this.featureFlagsByGroupsetId.set(groupsetId, featureFlags);
  }

  /** Bulk-upserts multiple groupsets' flags at once, e.g. from a getAllFeatureFlags response. */
  setFeatureFlagsForGroupsets(featureFlagsByGroupsetId: Record<string, string[]>) {
    Object.entries(featureFlagsByGroupsetId).forEach(([groupsetId, featureFlags]) => {
      this.setFeatureFlagsForGroupset(groupsetId, featureFlags);
    });
  }

  clearFeatureFlagsForGroupset(groupsetId: string) {
    this.featureFlagsByGroupsetId.delete(groupsetId);
  }

  hasFeatureFlagForGroupset(key: string, groupsetId: string): boolean {
    return this.featureFlagsByGroupsetId.get(groupsetId)?.includes(key) ?? false;
  }

  /** Registers/updates the group definition that produced a groupset id, for later rehydration. */
  registerGroupsetDefinition(groupsetId: string, definition: IGroupsetDefinition) {
    this.groupsetDefinitionsById.set(groupsetId, definition);
  }

  /** Returns the group definition registered for a groupset id, or null if it was never seen. */
  getGroupsetDefinition(groupsetId: string): IGroupsetDefinition | null {
    return this.groupsetDefinitionsById.get(groupsetId) ?? null;
  }

  public rotateAssignmentList(assignment: IExperimentAssignment) {
    if (assignment.assignedCondition.length > 1) {
      assignment.assignedCondition.push(assignment.assignedCondition.shift());
      if (assignment.assignedFactor) {
        assignment.assignedFactor.push(assignment.assignedFactor.shift());
      }
    }
    return assignment;
  }

  public rotateAssignmentsByExperimentId(experimentId: string): void {
    if (!experimentId || !this.experimentAssignmentData) {
      return;
    }

    this.experimentAssignmentData
      .filter(
        (assignment) =>
          Array.isArray(assignment.assignedCondition) &&
          assignment.assignedCondition.some((condition) => condition?.experimentId === experimentId)
      )
      .forEach((assignment) => this.rotateAssignmentList(assignment));
  }

  public findExperimentAssignmentBySiteAndTarget(site: string, target?: string): IExperimentAssignment {
    const normalizedTarget = target ?? '';
    const assignment = this.experimentAssignmentData.find(
      (assignment) => assignment.site === site && assignment.target === normalizedTarget
    );

    const emptyAssignment: IExperimentAssignment = {
      site: site,
      target: normalizedTarget,
      assignedCondition: [
        {
          payload: null,
          conditionCode: null,
          id: null,
        },
      ],
      experimentType: null,
    };

    return assignment || emptyAssignment;
  }

  /** @deprecated Use `hasFeatureFlagForGroupset(key, DEFAULT_GROUPSET_ID)` instead. */
  public hasFeatureFlag(key: string): boolean {
    return this.hasFeatureFlagForGroupset(key, DEFAULT_GROUPSET_ID);
  }
}
