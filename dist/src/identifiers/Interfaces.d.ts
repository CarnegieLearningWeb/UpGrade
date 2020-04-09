import { SERVER_ERROR } from 'ees_types';
export declare namespace Interfaces {
    interface IConfig {
        hostURL: string;
        userId: string;
        api: any;
    }
    interface IResponse {
        status: boolean;
        data?: any;
        message?: any;
    }
    interface IUserGroup {
        group?: Map<string, Array<string>>;
        workingGroup?: Map<string, string>;
    }
    interface IUser {
        id: string;
        group?: Map<string, Array<string>>;
        workingGroup?: Map<string, string>;
    }
    interface IMarkExperimentPoint {
        experimentId: string;
        experimentPoint: string;
        userId: string;
    }
    interface IFailedExperimentPoint {
        type: SERVER_ERROR;
        message: string;
    }
}
