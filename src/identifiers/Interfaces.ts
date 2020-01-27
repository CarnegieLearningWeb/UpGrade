import { Types } from './Types';

export namespace Interfaces {
  export interface IConfig {
    hostURL: string;
    user: {
      userId: string;
      userEnvironment: any;
    };
    api: any;
  }

  export interface IResponse {
    status: boolean;
    data?: any;
    message?: any;
  }
}
