import { MARKED_DECISION_POINT_STATUS } from '../../../../types/src';
import { UpGradeClientInterfaces } from './Interfaces';

/* eslint-disable @typescript-eslint/no-namespace */
export namespace UpGradeClientRequests {
  export interface ISetGroupMembershipRequestBody {
    id: string;
    group: UpGradeClientInterfaces.IExperimentUserGroup;
  }

  export interface ISetWorkingGroupRequestBody {
    id: string;
    workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup;
  }

  export interface ISetAltIdsRequestBody {
    userId: string;
    aliases: UpGradeClientInterfaces.IExperimentUserAliases;
  }

  export interface IGetAllExperimentConditionsRequestBody {
    userId: string;
    context: string;
  }

  export interface IGetAllFeatureFlagsRequestBody {
    userId: string;
    context: string;
  }

  export interface IMarkDecisionPointRequestBody {
    userId: string;
    status: MARKED_DECISION_POINT_STATUS;
    data: {
      site: string;
      target: string;
      assignedCondition: { conditionCode: string; experimentId?: string };
    };
    uniquifier?: string;
    clientError?: string;
  }
}
