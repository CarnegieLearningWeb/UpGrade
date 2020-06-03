import { SERVER_ERROR } from 'upgrade_types';
export declare namespace Interfaces {
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
        type: SERVER_ERROR;
        message: string;
    }
    export interface ILog {
        createdAt: string;
        updatedAt: string;
        versionNumber: number;
        id: string;
        data: any;
        metric: IMetric[];
        user: IExperimentUser;
    }
    interface IMetric {
        createdAt: string;
        updatedAt: string;
        versionNumber: number;
        key: string;
    }
    export interface IExperimentUser {
        createdAt: string;
        updatedAt: string;
        versionNumber: number;
        id: string;
        group: object;
        workingGroup: object;
    }
    export interface FlagVariation {
        createdAt: string;
        updatedAt: string;
        versionNumber: number;
        id: string;
        value: string;
        name: string;
        description: string;
        defaultVariation: boolean[];
    }
    export interface FeatureFlag {
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
    export {};
}
