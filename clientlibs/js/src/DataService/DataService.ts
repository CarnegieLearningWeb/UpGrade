import { UpGradeClientInterfaces } from '../types';
import { IExperimentAssignment } from 'upgrade_types';

/**
 * Synchronous data store
 */
export class DataService {
  private group: UpGradeClientInterfaces.IExperimentUserGroup = null;
  private workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = null;
  private experimentAssignmentData: IExperimentAssignment[] = null;
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

  setExperimentAssignmentData(experimentAssignmentData: IExperimentAssignment[]) {
    this.experimentAssignmentData = experimentAssignmentData;
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

  public hasFeatureFlag(key: string): boolean {
    if (this.featureFlags) {
      const result = this.featureFlags.find((data) => data === key);
      return !!result;
    } else {
      return false;
    }
  }
}
