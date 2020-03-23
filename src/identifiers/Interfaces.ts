import { SERVER_ERROR } from 'ees_types';

export namespace Interfaces {
  export interface IConfig {
    hostURL: string;
    userId: string;
    api: any;
  }

  export interface IResponse {
    status: boolean;
    data?: any;
    message?: any;
  }

  export interface IUserGroup {
    group?: Map<string, Array<string>>;
    workingGroup?: Map<string, string>;
  }

  export interface IUser {
    id: string;
    group: Map<string, Array<string>>;
    workingGroup: Map<string, string>;
  }

  export interface IMarkExperimentPoint {
    experimentId: string;
    experimentPoint: string;
    userId: string;
  }

  export interface IGetExperimentCondition {
    experimentId: string;
    experimentPoint: string;
    uniqueIdentifier: string;
    assignedCondition: {
      condition: string;
      uniqueIdentifier: string;
    };
  }

  export interface IFailedExperimentPoint {
    type: SERVER_ERROR,
    message: string;
  }
}
