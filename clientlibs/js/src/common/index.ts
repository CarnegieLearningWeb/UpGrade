import { IExperimentAssignmentv5, PAYLOAD_TYPE } from 'upgrade_types';

export function rotateAssignmentList(assignment: IExperimentAssignmentv5) {
  if (assignment.assignedCondition.length > 1) {
    assignment.assignedCondition.push(assignment.assignedCondition.shift());
    if (assignment.assignedFactor) {
      assignment.assignedFactor.push(assignment.assignedFactor.shift());
    }
  }
  return assignment;
}

export function findExperimentAssignmentBySiteAndTarget(
  site: string,
  target: string,
  experimentAssignmentData: IExperimentAssignmentv5[]
): IExperimentAssignmentv5 {
  const assignment = experimentAssignmentData.find(
    (assignment) => assignment.site === site && assignment.target === target
  );
  return (
    assignment || {
      site: site,
      target: target,
      assignedCondition: [
        {
          conditionCode: null,
          payload: null,
          id: null,
        },
      ],
    }
  );
}
