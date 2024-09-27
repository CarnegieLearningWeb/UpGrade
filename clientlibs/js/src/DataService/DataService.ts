import { UpGradeClientInterfaces } from '../types';
import { IExperimentAssignmentv5, IFeatureFlag } from 'upgrade_types';

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

  public findExperimentAssignmentBySiteAndTarget(site: string, target: string): IExperimentAssignmentv5 {
    const assignment = this.experimentAssignmentData.find(
      (assignment) => assignment.site === site && assignment.target === target
    );

    const emptyAssignment: IExperimentAssignmentv5 = {
      site: site,
      target: target,
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
