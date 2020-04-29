import { SERVER_ERROR } from 'upgrade_types';

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
    group?: Map<string, Array<string>>;
    workingGroup?: Map<string, string>;
  }

  export interface IMarkExperimentPoint {
    experimentId: string;
    experimentPoint: string;
    userId: string;
  }

  export interface IFailedExperimentPoint {
    type: SERVER_ERROR,
    message: string;
  }
}
