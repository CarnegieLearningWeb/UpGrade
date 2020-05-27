import { SERVER_ERROR } from 'upgrade_types';
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
    interface FlagVariation {
        createdAt: string;
        updatedAt: string;
        versionNumber: number;
        id: string;
        value: string;
        name: string;
        description: string;
        defaultVariation: boolean[];
    }
    interface FeatureFlag {
        createdAt: string;
        updatedAt: string;
        versionNumber: number;
        id: string;
        name: string;
        key: string;
        description: string;
        variationType: string;
        status: boolean;
        variations: FlagVariation[];
    }
}
