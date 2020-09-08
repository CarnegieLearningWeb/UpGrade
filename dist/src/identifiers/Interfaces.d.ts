import { SERVER_ERROR, IMetricMetaData } from 'upgrade_types';
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
        condition: string | null;
    }
    interface IFailedExperimentPoint {
        type: SERVER_ERROR;
        message: string;
    }
    interface ILog {
        createdAt: string;
        updatedAt: string;
        versionNumber: number;
        id: string;
        data: any;
        metrics: IMetric[];
        user: IExperimentUser;
        timeStamp: string;
        uniquifier: string;
    }
    interface IMetric {
        key: string;
        type: IMetricMetaData;
        allowedData: string[];
    }
    interface IExperimentUser {
        createdAt: string;
        updatedAt: string;
        versionNumber: number;
        id: string;
        group: object;
        workingGroup: object;
    }
    interface IExperimentUserAliases extends IExperimentUser {
        originalUser: string;
    }
}
