import UpgradeClient from './UpGradeClient/UpgradeClient';
import Assignment from './Assignment/Assignment';
import { UpGradeClientEnums, UpGradeClientInterfaces, UpGradeClientRequests } from './types';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types/Experiment/enums';
import type { IExperimentAssignment, IExperimentAssignmentv5 } from 'upgrade_types/Experiment/interfaces';

export default UpgradeClient;

export { Assignment, UpGradeClientEnums, UpGradeClientInterfaces, UpGradeClientRequests, MARKED_DECISION_POINT_STATUS };

// IExperimentAssignment reaches the bundled .d.ts anyway via the public method
// signatures; IExperimentAssignmentv5 does not, so it needs an explicit re-export
// to stay importable for consumers written against the old name.
export type { IExperimentAssignment, IExperimentAssignmentv5 };
