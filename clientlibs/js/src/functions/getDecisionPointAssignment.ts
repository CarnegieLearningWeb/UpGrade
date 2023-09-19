import Assignment from '../Assignment';
import { findExperimentAssignmentBySiteAndTarget } from '../common';
import { UpGradeClientInterfaces } from 'types/Interfaces';

export default function getDecisionPointAssignment(
  site: string,
  target: string,
  clientState: UpGradeClientInterfaces.IClientState
): Assignment {
  if (clientState?.allExperimentAssignmentData) {
    const experimentAssignment = findExperimentAssignmentBySiteAndTarget(
      site,
      target,
      clientState.allExperimentAssignmentData
    );

    const assignment = new Assignment(experimentAssignment, clientState);
    return assignment;
  } else {
    return null;
  }
}
