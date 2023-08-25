import { UpGradeClientInterfaces } from '../types';
import { IExperimentAssignmentv5, IFeatureFlag } from 'upgrade_types';

/**
 * Synchronous data store
 */
export class DataService {
  private group: UpGradeClientInterfaces.IExperimentUserGroup = null;
  private workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = null;
  private experimentAssignmentData: IExperimentAssignmentv5[] = null;
  private featureFlags: IFeatureFlag[] = null;

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

  getFeatureFlags(): IFeatureFlag[] {
    return this.featureFlags;
  }

  setFeatureFlags(featureFlags: IFeatureFlag[]) {
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
    return assignment;
  }

  public getFeatureFlag(key: string): IFeatureFlag {
    if (this.featureFlags) {
      const result = this.featureFlags.find((data) => data.key === key);
      if (result) {
        const activeVariation = this.getActiveVariation(result) as any;
        return {
          ...result,
          variations: activeVariation,
        };
      } else {
        throw new Error('Feature flag with given key not found');
      }
    } else {
      return null;
    }
  }

  private getActiveVariation(flag: IFeatureFlag) {
    const existedVariation = flag.variations.filter((variation) => {
      if (variation.defaultVariation && variation.defaultVariation.includes(flag.status)) {
        return variation;
      }
    });
    return existedVariation || [];
  }
}
