import Assignment from '../Assignment';
import { findExperimentAssignmentBySiteAndTarget } from '../common';
import { Interfaces } from 'identifiers/Interfaces';

export default function getDecisionPointAssignment(
  site: string,
  target: string,
  clientState: Interfaces.IClientState
): Assignment {
  if (clientState?.allExperimentAssignmentData) {
    const experimentAssignment = findExperimentAssignmentBySiteAndTarget(site, target, clientState.allExperimentAssignmentData)

    if (experimentAssignment) {
      const assignment = new Assignment(
        experimentAssignment,
        clientState,
      );

      return assignment;
    } else {
      return null;
    }
  } else {
    return null;
  }
}
