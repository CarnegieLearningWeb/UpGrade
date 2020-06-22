import { EXPERIMENT_STATE, EXPERIMENT_SEARCH_KEY, EXPERIMENT_SORT_KEY, EXPERIMENT_SORT_AS, IMetricMetaData } from './enums';
export interface IEnrollmentCompleteCondition {
    userCount: number;
    groupCount: number;
}
interface IConditionEnrollmentStats {
    id: string;
    users: number;
    groups: number;
    partitions: IPartitionEnrollmentStats[];
}
interface IPartitionEnrollmentStats {
    id: string;
    users: number;
    groups: number;
}
export interface IExperimentEnrollmentStats {
    users: number;
    groups: number;
    id: string;
}
export interface IExperimentEnrollmentDetailStats {
    id: string;
    users: number;
    groups: number;
    usersExcluded: number;
    groupsExcluded: number;
    conditions: IConditionEnrollmentStats[];
}
export interface IExperimentAssignment {
    expId: string;
    expPoint: string;
    twoCharacterId: string;
    description: string;
    assignedCondition: {
        conditionCode: string;
        twoCharacterId: string;
        description: string;
    };
}
interface ExperimentCreatedData {
    experimentId: string;
    experimentName: string;
}
interface ExperimentUpdatedData {
    experimentId: string;
    experimentName: string;
    diff: string;
}
interface ExperimentStateChangedData {
    experimentId: string;
    experimentName: string;
    previousState: EXPERIMENT_STATE;
    newState: EXPERIMENT_STATE;
    startOn?: Date;
}
interface ExperimentDeletedData {
    experimentName: string;
}
export declare type AuditLogData = ExperimentCreatedData | ExperimentUpdatedData | ExperimentStateChangedData | ExperimentDeletedData;
export interface IExperimentSearchParams {
    key: EXPERIMENT_SEARCH_KEY;
    string: string;
}
export interface IExperimentSortParams {
    key: EXPERIMENT_SORT_KEY;
    sortAs: EXPERIMENT_SORT_AS;
}
export interface IExperimentDateStat {
    userId: string;
    groupId: string | undefined;
    conditionId: string;
    partitionIds: string[];
    createdAt: any;
}
export interface IMetricUnit {
    key: string | string[];
    children?: IMetricUnit[];
    metadata?: {
        type: IMetricMetaData;
    };
    allowedData?: string[];
}
export interface IFlagVariation {
    id: string;
    value: string;
    name: string;
    description: string;
    defaultVariation: boolean[];
}
export interface IFeatureFlag {
    id: string;
    name: string;
    key: string;
    description: string;
    variationType: string;
    status: boolean;
    variations: IFlagVariation[];
}
interface IConditionEnrollmentDateStats {
    id: string;
    partitions: IPartitionEnrollmentStats[];
}
export interface IExperimentEnrollmentDetailDateStats {
    id: string;
    conditions: IConditionEnrollmentDateStats[];
}
export {};
