import { MARKED_DECISION_POINT_STATUS } from '../../../../types/src';
import { UpGradeClientInterfaces } from './Interfaces';

/* eslint-disable @typescript-eslint/no-namespace */
export namespace UpGradeClientRequests {
  export interface IInitRequestBody {
    id?: string;
    group?: UpGradeClientInterfaces.IExperimentUserGroup;
    workingGroup?: UpGradeClientInterfaces.IExperimentUserWorkingGroup;
  }
  export interface ISetGroupMembershipRequestBody {
    group: UpGradeClientInterfaces.IExperimentUserGroup;
  }

  export interface ISetWorkingGroupRequestBody {
    workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup;
  }

  export interface ISetAltIdsRequestBody {
    aliases: UpGradeClientInterfaces.IExperimentUserAliases;
  }

  export interface IGetAllExperimentConditionsRequestBody {
    context: string;
  }

  export type IGetAllFeatureFlagsRequestBody =
    | {
        context: string;
      }
    | {
        context: string;
        groupsForSession: Record<string, string[]>;
        includeStoredUserGroups: boolean;
      };

  export interface IMarkDecisionPointRequestBody {
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
