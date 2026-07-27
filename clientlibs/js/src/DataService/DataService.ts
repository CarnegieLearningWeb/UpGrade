import { UpGradeClientInterfaces } from '../types';
import { IExperimentAssignmentv5 } from 'upgrade_types';

/**
 * Synchronous data store
 */
export class DataService {
  private group: UpGradeClientInterfaces.IExperimentUserGroup = null;
  private workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = null;
  private experimentAssignmentData: IExperimentAssignmentv5[] = null;
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

  getExperimentAssignmentData(): IExperimentAssignmentv5[] {
    return this.experimentAssignmentData;
  }

  setExperimentAssignmentData(experimentAssignmentData: IExperimentAssignmentv5[]) {
    this.experimentAssignmentData = experimentAssignmentData;
  }

  upsertExperimentAssignmentData(experimentAssignmentData: IExperimentAssignmentv5[]) {
    if (!Array.isArray(experimentAssignmentData)) {
      return;
    }

    if (!Array.isArray(this.experimentAssignmentData)) {
      // Warm the cache even if this is an empty response.
      this.experimentAssignmentData = [...experimentAssignmentData];
      return;
    }

    if (experimentAssignmentData.length === 0) {
      return;
    }

    for (const incomingAssignment of experimentAssignmentData) {
      const incomingTarget = incomingAssignment.target ?? '';
      const existingIndex = this.experimentAssignmentData.findIndex(
        (existingAssignment) =>
          existingAssignment.site === incomingAssignment.site && (existingAssignment.target ?? '') === incomingTarget
      );

      if (existingIndex >= 0) {
        this.experimentAssignmentData[existingIndex] = incomingAssignment;
      } else {
        this.experimentAssignmentData.push(incomingAssignment);
      }
    }
  }

  getFeatureFlags(): string[] {
    return this.featureFlags;
  }

  setFeatureFlags(featureFlags: string[]) {
    this.featureFlags = featureFlags;
  }

  public rotateAssignmentList(assignment: IExperimentAssignmentv5) {
    if (assignment.assignedCondition.length > 1) {
      assignment.assignedCondition.push(assignment.assignedCondition.shift());
      if (assignment.assignedFactor) {
        assignment.assignedFactor.push(assignment.assignedFactor.shift());
      }
    }
    return assignment;
  }

  public findExperimentAssignmentBySiteAndTarget(site: string, target?: string): IExperimentAssignmentv5 {
    const normalizedTarget = target ?? '';
    const assignment = this.experimentAssignmentData.find(
      (assignment) => assignment.site === site && assignment.target === normalizedTarget
    );

    const emptyAssignment: IExperimentAssignmentv5 = {
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
