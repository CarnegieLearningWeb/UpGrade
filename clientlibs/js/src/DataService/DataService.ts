import { UpGradeClientInterfaces } from '../types';
import { IExperimentAssignment } from 'upgrade_types/Experiment/interfaces';

/**
 * Synchronous data store
 */
export class DataService {
  private group: UpGradeClientInterfaces.IExperimentUserGroup = null;
  private workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = null;
  private experimentAssignmentData: IExperimentAssignment[] = null;
  private fullContextCached = false;
  private featureFlags: string[] = null;

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

  getFullContextAssignmentData(): IExperimentAssignment[] {
    return this.fullContextCached ? this.experimentAssignmentData : null;
  }

  setExperimentAssignmentData(experimentAssignmentData: IExperimentAssignment[]) {
    this.experimentAssignmentData = experimentAssignmentData;
    this.fullContextCached = true;
  }

  /**
   * Adds a single decision point's /assign response to the cache, unless a full-context response already filled it.
   * Entries for decision points the cache already holds are skipped
   */
  addDecisionPointAssignmentData(experimentAssignmentData: IExperimentAssignment[]) {
    if (this.fullContextCached) {
      return;
    }
    const cached = this.experimentAssignmentData ?? [];
    const added = experimentAssignmentData.filter(
      (assignment) => !cached.some((c) => DataService.isAtDecisionPoint(c, assignment.site, assignment.target))
    );
    this.experimentAssignmentData = [...cached, ...added];
  }

  /**
   * Whether the cache can answer a lookup of this decision point without asking the server. A full-context cache
   * answers any decision point, even one with no assignment. A cache of single decision points answers only one it
   * holds.
   */
  hasDecisionPointAssignment(site: string, target?: string): boolean {
    if (!this.experimentAssignmentData) {
      return false;
    }
    return (
      this.fullContextCached ||
      this.experimentAssignmentData.some((assignment) => DataService.isAtDecisionPoint(assignment, site, target))
    );
  }

  clearExperimentAssignmentData() {
    this.experimentAssignmentData = null;
    this.fullContextCached = false;
  }

  /**
   * Invalidate everything that depends on the user's identity or groups (assignments and feature flags), after a
   * call that may have changed them: init, group membership, working group, or aliases.
   */
  clearUserDependentData() {
    this.clearExperimentAssignmentData();
    this.clearFeatureFlags();
  }

  getFeatureFlags(): string[] {
    return this.featureFlags;
  }

  setFeatureFlags(featureFlags: string[]) {
    this.featureFlags = featureFlags;
  }

  clearFeatureFlags() {
    this.featureFlags = null;
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
    // experimentAssignmentData stays null if the preceding /assign call failed or returned a non-array
    const assignment = this.experimentAssignmentData?.find((assignment) =>
      DataService.isAtDecisionPoint(assignment, site, normalizedTarget)
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

  /** Site and target match exactly (case-sensitive), as the server matches them; a missing target equals ''. */
  private static isAtDecisionPoint(assignment: IExperimentAssignment, site: string, target?: string): boolean {
    return assignment.site === site && assignment.target === (target ?? '');
  }

  public hasFeatureFlag(key: string): boolean {
    if (this.featureFlags) {
      const result = this.featureFlags.find((data) => data === key);
      return !!result;
    } else {
      return false;
    }
  }
}
