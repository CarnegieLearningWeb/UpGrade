import { UpGradeClientInterfaces, UpGradeClientEnums } from '../types';
import fetchDataService from '../common/fetchDataService';
import { IExperimentAssignmentv5, MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
import { findExperimentAssignmentBySiteAndTarget, rotateAssignmentList } from '../common';

export default async function markDecisionPoint(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  site: string,
  target: string,
  condition: string,
  status: MARKED_DECISION_POINT_STATUS,
  experimentAssignmentData: IExperimentAssignmentv5[],
  uniquifier?: string,
  clientError?: string
): Promise<UpGradeClientInterfaces.IMarkExperimentPoint> {
  const assignment = findExperimentAssignmentBySiteAndTarget(site, target, experimentAssignmentData);

  rotateAssignmentList(assignment);

  const data = { ...assignment, assignedCondition: { ...assignment.assignedCondition[0], conditionCode: condition } };

  let requestBody: UpGradeClientInterfaces.IMarkDecisionPointRequestBody = {
    userId,
    status,
    data,
  };

  if (uniquifier) {
    requestBody = {
      ...requestBody,
      uniquifier,
    };
  }
  if (clientError) {
    requestBody = {
      ...requestBody,
      clientError,
    };
  }
  const response = await fetchDataService(
    url,
    token,
    clientSessionId,
    requestBody,
    UpGradeClientEnums.REQUEST_TYPES.POST
  );
  if (response.status) {
    return response.data;
  } else {
    throw new Error(JSON.stringify(response.message));
  }
}
